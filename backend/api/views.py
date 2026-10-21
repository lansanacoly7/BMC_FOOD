from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiExample,
    OpenApiResponse
)

from .models import Category, MenuItem, Order
from .serializers import (
    CategorySerializer,
    MenuItemSerializer,
    OrderSerializer,
    OrderCreateSerializer,
    HealthCheckResponseSerializer,
    MenuResponseSerializer,
    DailySpecialResponseSerializer,
    ToggleDailySpecialInputSerializer,
    ToggleDailySpecialResponseSerializer,
    OrderListResponseSerializer,
    OrderCreatedResponseSerializer,
    OrderStatusUpdateInputSerializer,
    OrderStatusUpdateResponseSerializer,
    OrderUnnotifiedGetResponseSerializer,
    OrderAcknowledgeInputSerializer,
    OrderAcknowledgeResponseSerializer,
    ErrorResponseSerializer
)


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Santé"],
        summary="Contrôle de santé du serveur",
        description="Vérifie la disponibilité opérationnelle du backend Django REST Framework et renvoie l'horodatage officiel.",
        responses={
            200: OpenApiResponse(
                response=HealthCheckResponseSerializer,
                description="Le service est opérationnel.",
                examples=[
                    OpenApiExample(
                        "Exemple Nominal",
                        value={
                            "status": "ok",
                            "service": "BMC Food Django REST API",
                            "version": "2.0.0",
                            "server_time": "2026-10-21T05:00:00Z"
                        }
                    )
                ]
            )
        }
    )
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
    """Retourne le ou les Plats du Jour actuels"""
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Plat du Jour"],
        summary="Plat du Jour actif",
        description="Retourne le ou les Plats du Jour actuellement configurés et disponibles pour mise en avant.",
        responses={
            200: OpenApiResponse(
                response=DailySpecialResponseSerializer,
                description="Plat du Jour actif retourné."
            )
        }
    )
    def get(self, request):
        specials = MenuItem.objects.filter(is_daily_special=True, is_available=True)
        return Response({
            'success': True,
            'count': specials.count(),
            'daily_specials': MenuItemSerializer(specials, many=True).data
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


@extend_schema_view(
    get=extend_schema(
        tags=["Commandes"],
        summary="Liste des commandes pour l'administration",
        description="Retourne la liste complète des commandes passées avec filtre optionnel par statut.",
        parameters=[
            OpenApiParameter(
                name='status',
                type=str,
                description="Filtrer par statut de commande : pending, confirmed, preparing, delivering, delivered, cancelled",
                required=False
            )
        ],
        responses={
            200: OpenApiResponse(response=OrderListResponseSerializer, description="Liste des commandes.")
        }
    ),
    post=extend_schema(
        tags=["Commandes"],
        summary="Création d'une nouvelle commande (Moteur de prix sécurisé)",
        description=(
            "Création d'une commande client. Les prix sont impérativement recalculés en base de données "
            "par le serveur : tout prix transmis par le client est ignoré. La création est atomique."
        ),
        request=OrderCreateSerializer,
        responses={
            201: OpenApiResponse(response=OrderCreatedResponseSerializer, description="Commande créée avec succès."),
            400: OpenApiResponse(response=ErrorResponseSerializer, description="Panier invalide, article inexistant ou indisponible.")
        }
    )
)
class OrderListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminUser()]
        return [AllowAny()]

    def get(self, request):
        status_filter = request.query_params.get('status')
        allowed_statuses = [choice[0] for choice in Order.STATUS_CHOICES]

        if status_filter and status_filter not in allowed_statuses:
            return Response({
                'success': False,
                'error': f"Statut de filtre invalide. Autorisés : {', '.join(allowed_statuses)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        queryset = Order.objects.prefetch_related('items__menu_item').all()
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        serializer = OrderSerializer(queryset, many=True)
        return Response({
            'success': True,
            'count': queryset.count(),
            'orders': serializer.data
        })

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            return Response({
                'success': True,
                'message': 'Commande créée avec succès !',
                'order': OrderSerializer(order).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Commandes"],
        summary="Détail complet d'une commande",
        description="Récupère une commande et le détail de ses lignes par son ID numérique ou sa référence unique visible client (ex: BMC-1234).",
        parameters=[
            OpenApiParameter(
                name='ref_or_id',
                type=str,
                location=OpenApiParameter.PATH,
                description="Identifiant ID (entier) ou référence publique BMC-XXXX"
            )
        ],
        responses={
            200: OpenApiResponse(response=OrderSerializer, description="Détail de la commande."),
            404: OpenApiResponse(response=ErrorResponseSerializer, description="Commande introuvable.")
        }
    )
    def get(self, request, ref_or_id):
        if ref_or_id.isdigit():
            order = get_object_or_404(Order, id=int(ref_or_id))
        else:
            order = get_object_or_404(Order, order_ref=ref_or_id)

        return Response({
            'success': True,
            'order': OrderSerializer(order).data
        })


class OrderStatusUpdateView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        tags=["Administration - Commandes"],
        summary="Mise à jour du statut d'une commande",
        description="Permet au personnel de cuisine ou livreur de faire évoluer le statut opérationnel d'une commande et le paiement.",
        parameters=[
            OpenApiParameter(
                name='ref_or_id',
                type=str,
                location=OpenApiParameter.PATH,
                description="Identifiant ID ou référence BMC-XXXX"
            )
        ],
        request=OrderStatusUpdateInputSerializer,
        responses={
            200: OpenApiResponse(response=OrderStatusUpdateResponseSerializer, description="Statut mis à jour avec succès."),
            400: OpenApiResponse(response=ErrorResponseSerializer, description="Statut invalide."),
            401: OpenApiResponse(response=ErrorResponseSerializer, description="Authentification requise."),
            403: OpenApiResponse(response=ErrorResponseSerializer, description="Droits administrateur requis."),
            404: OpenApiResponse(response=ErrorResponseSerializer, description="Commande introuvable.")
        }
    )
    def patch(self, request, ref_or_id):
        if ref_or_id.isdigit():
            order = get_object_or_404(Order, id=int(ref_or_id))
        else:
            order = get_object_or_404(Order, order_ref=ref_or_id)

        new_status = request.data.get('status')
        new_payment_status = request.data.get('payment_status')

        allowed_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if new_status and new_status not in allowed_statuses:
            return Response({
                'success': False,
                'error': f"Statut invalide. Autorisés : {', '.join(allowed_statuses)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        allowed_payments = ['unpaid', 'pending', 'paid']
        if new_payment_status and new_payment_status not in allowed_payments:
            return Response({
                'success': False,
                'error': f"Statut de paiement invalide. Autorisés : {', '.join(allowed_payments)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        if new_status:
            order.status = new_status
        if new_payment_status:
            order.payment_status = new_payment_status

        order.save()

        return Response({
            'success': True,
            'message': 'Statut de commande mis à jour.',
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

            if order_refs:
                updated_count = Order.objects.filter(
                    order_ref__in=order_refs,
                    is_notified_to_admin=False
                ).update(is_notified_to_admin=True)
            else:
                updated_count = 0
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

