import time
from django.db import OperationalError, transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiExample,
    OpenApiResponse
)
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from . import order_rules
from .api_schemas import (
    ErrorEnvelopeSerializer,
    HealthResponseSerializer,
    OrderEnvelopeSerializer,
    OrderListResponseSerializer,
    OrderStatusUpdateRequestSerializer,
)
from .exceptions import error_response, first_message
from .models import Category, MenuItem, Order
from .serializers import (
    CategorySerializer,
    MenuItemSerializer,
    OrderSerializer,
    OrderCreateSerializer,
    MenuResponseSerializer,
    DailySpecialResponseSerializer,
    ToggleDailySpecialInputSerializer,
    ToggleDailySpecialResponseSerializer,
    OrderUnnotifiedGetResponseSerializer,
    OrderAcknowledgeInputSerializer,
    OrderAcknowledgeResponseSerializer,
    OrderTrackResponseSerializer,
    ErrorResponseSerializer
)

ORDER_STATUS_VALUES = [choice[0] for choice in Order.STATUS_CHOICES]
PAYMENT_STATUS_VALUES = [choice[0] for choice in Order.PAYMENT_STATUS_CHOICES]


def _find_order(ref_or_id, for_update=False):
    """Retrouve une commande par ID Django (numérique) ou par référence `BMC-XXXX`. Lève Http404."""
    queryset = Order.objects.all()
    if for_update:
        queryset = queryset.select_for_update()
    if ref_or_id.isdigit():
        return get_object_or_404(queryset, id=int(ref_or_id))
    return get_object_or_404(queryset, order_ref=ref_or_id)


def _check_allowed_value(errors, field, value, allowed):
    if value is None:
        return
    if not isinstance(value, str) or value not in allowed:
        errors[field] = [f"Valeur invalide. Valeurs autorisées : {', '.join(allowed)}."]



class HealthCheckView(APIView):
    @extend_schema(responses=HealthResponseSerializer)
    def get(self, request):
        return Response({
            'status': 'ok',
            'service': 'BMC Food Django REST API',
            'version': '2.0.0',
            'server_time': timezone.now().isoformat()
        })


class MenuView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Menu & Catalogue"],
        summary="Catalogue complet du menu BMC FOOD",
        description="Renvoie l'arborescence des 7 catégories et la liste complète des 32 articles réels disponibles au restaurant.",
        responses={
            200: OpenApiResponse(
                response=MenuResponseSerializer,
                description="Catalogue structuré par catégories et articles."
            )
        }
    )
    def get(self, request):
        categories = Category.objects.prefetch_related('items').all()
        items = MenuItem.objects.filter(is_available=True).select_related('category')

        categories_data = []
        for cat in categories:
            cat_items = items.filter(category=cat)
            categories_data.append({
                'id': cat.id,
                'name': cat.name,
                'slug': cat.slug,
                'icon': cat.icon,
                'items_count': cat_items.count(),
                'items': MenuItemSerializer(cat_items, many=True).data
            })

        return Response({
            'success': True,
            'total_items': items.count(),
            'categories': categories_data,
            'items': MenuItemSerializer(items, many=True).data
        })


class DailySpecialView(APIView):
    """Retourne le ou les Plats du Jour actuels (avec repli gracieux sur les best-sellers si aucun plat du jour n'est configuré - P15)."""
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Plat du Jour"],
        summary="Plat du Jour actif",
        description=(
            "Retourne le Plat du Jour configuré et disponible pour mise en avant. "
            "Règle de repli (P15) : si aucun Plat du Jour n'est configuré ou disponible, "
            "l'API retourne gracieusement le premier best-seller disponible (avec is_fallback=True), "
            "ou une liste vide si aucun article n'est éligible."
        ),
        responses={
            200: OpenApiResponse(
                response=DailySpecialResponseSerializer,
                description="Plat du Jour actif ou article de repli (best-seller)."
            )
        }
    )
    def get(self, request):
        specials = MenuItem.objects.filter(is_daily_special=True, is_available=True)
        if specials.exists():
            return Response({
                'success': True,
                'count': specials.count(),
                'is_fallback': False,
                'daily_specials': MenuItemSerializer(specials, many=True).data
            })

        # Repli gracieux (P15) : premier article populaire (best-seller) disponible
        fallback_items = MenuItem.objects.filter(is_available=True, popular=True)[:1]
        if fallback_items.exists():
            return Response({
                'success': True,
                'count': fallback_items.count(),
                'is_fallback': True,
                'daily_specials': MenuItemSerializer(fallback_items, many=True).data
            })

        return Response({
            'success': True,
            'count': 0,
            'is_fallback': False,
            'daily_specials': []
        })


class ToggleDailySpecialView(APIView):
    """Permet à l'Admin d'activer / désactiver un plat du jour (Tâche P3)"""
    permission_classes = [IsAdminUser]

    @extend_schema(
        tags=["Administration - Plat du Jour"],
        summary="Activer / désactiver un Plat du Jour",
        description=(
            "Endpoint réservé à l'administrateur pour activer ou désactiver un plat du jour. "
            "Validation booléenne stricte : le texte 'false' ou toute valeur non booléenne renvoie 400. "
            "Un article indisponible ne peut pas être désigné comme Plat du Jour. "
            "Règle D5 : l'activation d'un plat désactive automatiquement l'ancien pour garantir l'unicité."
        ),
        request=ToggleDailySpecialInputSerializer,
        responses={
            200: OpenApiResponse(
                response=ToggleDailySpecialResponseSerializer,
                description="Statut du Plat du Jour mis à jour avec succès."
            ),
            400: OpenApiResponse(response=ErrorResponseSerializer, description="Valeur non booléenne ou article indisponible."),
            401: OpenApiResponse(response=ErrorResponseSerializer, description="Authentification requise."),
            403: OpenApiResponse(response=ErrorResponseSerializer, description="Droits administrateur requis."),
            404: OpenApiResponse(response=ErrorResponseSerializer, description="Article introuvable.")
        }
    )
    def patch(self, request, pk):
        item = get_object_or_404(MenuItem, pk=pk)

        if 'is_daily_special' in request.data:
            raw_val = request.data.get('is_daily_special')
            if not isinstance(raw_val, bool):
                return Response({
                    'success': False,
                    'error': "La valeur de 'is_daily_special' doit être un booléen strict (true ou false)."
                }, status=status.HTTP_400_BAD_REQUEST)
            new_state = raw_val
        else:
            new_state = not item.is_daily_special

        if new_state and not item.is_available:
            return Response({
                'success': False,
                'error': "Un article indisponible ne peut pas être désigné comme Plat du Jour."
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if new_state:
                # Règle D5 : un seul plat du jour actif à la fois
                MenuItem.objects.filter(is_daily_special=True).exclude(pk=item.pk).update(is_daily_special=False)
            item.is_daily_special = new_state
            item.save()

        return Response({
            'success': True,
            'message': f"Plat du jour {'activé' if item.is_daily_special else 'désactivé'} pour {item.name}",
            'item': MenuItemSerializer(item).data
        })


class OrderListCreateView(APIView):
    """GET (liste, administration, avec pagination I18) / POST (création, public, avec limitation anti-spam I15)."""

    def get_permissions(self):
        method = getattr(getattr(self, 'request', None), 'method', None)
        if method == 'POST':
            return [AllowAny()]
        return [IsAdminUser()]

    def get_throttles(self):
        if getattr(self, 'request', None) and self.request.method == 'POST':
            self.throttle_scope = 'order_create'
            return [ScopedRateThrottle()]
        return []

    @extend_schema(
        operation_id='orders_list',
        parameters=[
            OpenApiParameter(
                'status', str, enum=ORDER_STATUS_VALUES, required=False,
                description="Filtre par statut de commande.",
            ),
            OpenApiParameter(
                'page', int, required=False,
                description="Numéro de page pour la pagination optionnelle (I18).",
            ),
            OpenApiParameter(
                'page_size', int, required=False,
                description="Nombre d'éléments par page (max: 100, défaut: 20).",
            ),
        ],
        responses={
            200: OrderListResponseSerializer,
            400: ErrorEnvelopeSerializer,
            401: ErrorEnvelopeSerializer,
            403: ErrorEnvelopeSerializer,
        },
    )
    def get(self, request):
        status_filter = request.query_params.get('status')
        queryset = Order.objects.prefetch_related('items__menu_item').all().order_by('-created_at')
        if status_filter:
            if status_filter not in ORDER_STATUS_VALUES:
                message = f"Statut invalide. Valeurs autorisées : {', '.join(ORDER_STATUS_VALUES)}."
                return error_response(message, errors={'status': [message]})
            queryset = queryset.filter(status=status_filter)

        total_count = queryset.count()
        page_param = request.query_params.get('page')
        page_size_param = request.query_params.get('page_size')

        # Pagination optionnelle rétrocompatible (I18) : si page/page_size sont fournis
        if page_param or page_size_param:
            try:
                page = max(1, int(page_param or 1))
                page_size = min(100, max(1, int(page_size_param or 20)))
            except (ValueError, TypeError):
                message = "Les paramètres 'page' et 'page_size' doivent être des entiers valides."
                return error_response(message, errors={'pagination': [message]})

            start = (page - 1) * page_size
            end = start + page_size
            orders = list(queryset[start:end])
            return Response({
                'success': True,
                'count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size if total_count > 0 else 1,
                'orders': OrderSerializer(orders, many=True).data
            })

        orders = list(queryset)
        return Response({
            'success': True,
            'count': total_count,
            'orders': OrderSerializer(orders, many=True).data
        })

    @extend_schema(
        request=OrderCreateSerializer,
        responses={
            201: OrderEnvelopeSerializer,
            400: ErrorEnvelopeSerializer,
            429: ErrorEnvelopeSerializer,
            503: ErrorEnvelopeSerializer,
        },
    )
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            for attempt in range(5):
                try:
                    order = serializer.save()
                    order_data = OrderSerializer(order).data
                    return Response({
                        'success': True,
                        'message': 'Commande créée avec succès !',
                        'order': order_data
                    }, status=status.HTTP_201_CREATED)
                except OperationalError as e:
                    if 'locked' in str(e).lower() and attempt < 4:
                        time.sleep(0.05 + 0.05 * attempt)
                        continue
                    raise
        return error_response(
            first_message(serializer.errors) or 'Commande invalide.',
            errors=serializer.errors,
        )


class OrderTrackView(APIView):
    """Suivi public allégé de commande client (Tâche I13 & Décision X2).
    
    Exclut rigoureusement toute donnée personnelle (ni nom, ni téléphone, ni adresse).
    Protégé par une limitation de débit anti-énumération et référence à 6 chiffres.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'order_track'

    @extend_schema(
        tags=["Commandes - Suivi Client"],
        summary="Suivi public allégé de commande (sans données personnelles)",
        description=(
            "Permet au client de suivre en direct le statut de sa commande à l'aide de sa référence `BMC-XXXXXX`. "
            "Exclut strictement tout nom, numéro de téléphone et adresse (conformité stricte RGPD / confidentialité). "
            "Renvoie un code 404 uniforme si la commande n'existe pas, et protégé par un limiteur de débit."
        ),
        responses={
            200: OrderTrackResponseSerializer,
            404: ErrorResponseSerializer,
            429: ErrorResponseSerializer,
        }
    )
    def get(self, request, ref):
        ref_clean = ref.strip().upper()
        order = Order.objects.filter(order_ref__iexact=ref_clean).prefetch_related('items__menu_item').first()
        if not order:
            return Response({
                'success': False,
                'error': "Commande introuvable."
            }, status=status.HTTP_404_NOT_FOUND)

        status_display = dict(Order.STATUS_CHOICES).get(order.status, order.status)
        payment_status_display = dict(Order.PAYMENT_STATUS_CHOICES).get(order.payment_status, order.payment_status)

        items_data = [
            {
                'item_name': item.item_name,
                'quantity': item.quantity,
                'unit_price': item.unit_price,
                'subtotal': item.subtotal
            }
            for item in order.items.all()
        ]

        return Response({
            'success': True,
            'order_ref': order.order_ref,
            'status': order.status,
            'status_label': status_display,
            'payment_status': order.payment_status,
            'payment_status_label': payment_status_display,
            'total_amount': order.total_amount,
            'created_at': order.created_at.isoformat(),
            'items_count': sum(item['quantity'] for item in items_data),
            'items': items_data
        })


class OrderDetailView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id='orders_detail',
        responses={
            200: OrderEnvelopeSerializer,
            401: ErrorEnvelopeSerializer,
            403: ErrorEnvelopeSerializer,
            404: ErrorEnvelopeSerializer,
        },
    )
    def get(self, request, ref_or_id):
        order = _find_order(ref_or_id)
        return Response({
            'success': True,
            'order': OrderSerializer(order).data
        })


class OrderStatusUpdateView(APIView):
    """Met à jour le statut de commande et/ou le statut de paiement (I4).

    Les deux valeurs sont validées (valeurs, puis transitions autorisées) AVANT toute
    écriture : en cas d'erreur sur l'une, aucune des deux n'est appliquée.
    Les transitions sont définies dans `api/order_rules.py`.
    """
    permission_classes = [IsAdminUser]

    @extend_schema(
        request=OrderStatusUpdateRequestSerializer,
        responses={
            200: OrderEnvelopeSerializer,
            400: ErrorEnvelopeSerializer,
            401: ErrorEnvelopeSerializer,
            403: ErrorEnvelopeSerializer,
            404: ErrorEnvelopeSerializer,
        },
    )
    def patch(self, request, ref_or_id):
        data = request.data
        if not isinstance(data, dict):
            return error_response("Corps de requête invalide : un objet JSON est attendu.")

        new_status = data.get('status')
        new_payment_status = data.get('payment_status')
        if new_status is None and new_payment_status is None:
            message = "Fournir au moins « status » ou « payment_status »."
            return error_response(message, errors={'non_field_errors': [message]})

        errors = {}
        _check_allowed_value(errors, 'status', new_status, ORDER_STATUS_VALUES)
        _check_allowed_value(errors, 'payment_status', new_payment_status, PAYMENT_STATUS_VALUES)
        if errors:
            return error_response(first_message(errors), errors=errors)

        with transaction.atomic():
            order = _find_order(ref_or_id, for_update=True)

            # Règle X4 : Une commande déjà annulée est verrouillée (état terminal, aucune modification permise)
            if order.status == 'cancelled':
                message = "Transition impossible : une commande annulée est verrouillée (Règle X4)."
                return error_response(message, errors={'status': [message]})

            # Règle X4 : Commande annulée déjà payée -> bascule automatique à 'refund_pending'
            if new_status == 'cancelled' and order.payment_status == 'paid' and new_payment_status is None:
                new_payment_status = 'refund_pending'

            if new_status is not None:
                message = order_rules.validate_order_status_transition(order.status, new_status)
                if message:
                    errors['status'] = [message]
            if new_payment_status is not None:
                message = order_rules.validate_payment_status_transition(order.payment_status, new_payment_status)
                if message:
                    errors['payment_status'] = [message]
            if errors:
                return error_response(first_message(errors), errors=errors)

            changed = []
            if new_status is not None and new_status != order.status:
                order.status = new_status
                changed.append('status')
            if new_payment_status is not None and new_payment_status != order.payment_status:
                order.payment_status = new_payment_status
                changed.append('payment_status')
            if changed:
                order.save(update_fields=changed)

        return Response({
            'success': True,
            'message': 'Commande mise à jour.' if changed else 'Aucun changement : la commande est déjà dans cet état.',
            'order': OrderSerializer(order).data
        })


@extend_schema_view(
    get=extend_schema(
        tags=["Administration - Alertes"],
        summary="Commandes non encore notifiées à la cuisine",
        description="Retourne les commandes récemment passées et non acquittées pour déclencher le carillon sonore et la notification push de l'app Admin.",
        responses={
            200: OpenApiResponse(response=OrderUnnotifiedGetResponseSerializer, description="Liste des commandes en attente d'alerte."),
            401: OpenApiResponse(response=ErrorResponseSerializer, description="Authentification requise."),
            403: OpenApiResponse(response=ErrorResponseSerializer, description="Droits administrateur requis.")
        }
    ),
    post=extend_schema(
        tags=["Administration - Alertes"],
        summary="Acquittement des alertes de commande (Tâche P4)",
        description=(
            "Accuse réception de la notification (stoppe le carillon sonore côté Admin). "
            "Si 'order_refs' est fourni (liste de références), seules ces commandes sont acquittées. "
            "Si 'order_refs' n'est pas fourni (D14), toutes les alertes en attente sont acquittées de façon idempotente."
        ),
        request=OrderAcknowledgeInputSerializer,
        responses={
            200: OpenApiResponse(response=OrderAcknowledgeResponseSerializer, description="Alertes acquittées avec succès."),
            400: OpenApiResponse(response=ErrorResponseSerializer, description="Format de requête invalide ou order_refs non-liste."),
            401: OpenApiResponse(response=ErrorResponseSerializer, description="Authentification requise."),
            403: OpenApiResponse(response=ErrorResponseSerializer, description="Droits administrateur requis.")
        }
    )
)
class OrderUnnotifiedEventsView(APIView):
    """
    Endpoint crucial pour l'application Admin (Tâche P4) :
    Renvoie les commandes non encore notifiées et permet un acquittement ciblé ou global.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        unnotified = Order.objects.filter(is_notified_to_admin=False).order_by('-created_at')
        return Response({
            'has_new_orders': unnotified.exists(),
            'count': unnotified.count(),
            'new_orders': OrderSerializer(unnotified, many=True).data
        })

    def post(self, request):
        """Accuse réception de la notification (stoppe l'alerte sonore pour les commandes passées)"""
        if not isinstance(request.data, dict):
            return Response({
                'success': False,
                'error': "Format de requête invalide : un objet JSON est attendu."
            }, status=status.HTTP_400_BAD_REQUEST)

        if 'order_refs' in request.data:
            order_refs = request.data.get('order_refs')
            if not isinstance(order_refs, list):
                return Response({
                    'success': False,
                    'error': "Le champ 'order_refs' doit être une liste de références."
                }, status=status.HTTP_400_BAD_REQUEST)

            if len(order_refs) == 0:
                return Response({
                    'success': False,
                    'error': "La liste 'order_refs' ne peut pas être vide (D14)."
                }, status=status.HTTP_400_BAD_REQUEST)

            updated_count = Order.objects.filter(
                order_ref__in=order_refs,
                is_notified_to_admin=False
            ).update(is_notified_to_admin=True)
        else:
            # Sans références spécifiées : acquitter toutes les commandes non notifiées (comportement D14)
            updated_count = Order.objects.filter(
                is_notified_to_admin=False
            ).update(is_notified_to_admin=True)

        return Response({
            'success': True,
            'message': f"Alertes de commandes acquittées ({updated_count} commande(s) mise(s) à jour).",
            'updated_count': updated_count
        })

