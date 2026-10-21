from django.db import transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
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
    OrderCreateSerializer
)

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
    def get(self, request):
        specials = MenuItem.objects.filter(is_daily_special=True, is_available=True)
        if not specials.exists():
            # Si aucun n'est marqué, prendre le premier best-seller par défaut
            specials = MenuItem.objects.filter(popular=True, is_available=True)[:1]
        
        return Response({
            'success': True,
            'count': specials.count(),
            'daily_specials': MenuItemSerializer(specials, many=True).data
        })


class ToggleDailySpecialView(APIView):
    """Permet à l'Admin d'activer / désactiver un plat du jour"""
    def patch(self, request, pk):
        item = get_object_or_404(MenuItem, pk=pk)
        new_state = request.data.get('is_daily_special', not item.is_daily_special)
        item.is_daily_special = bool(new_state)
        item.save()
        return Response({
            'success': True,
            'message': f"Plat du jour {'activé' if item.is_daily_special else 'désactivé'} pour {item.name}",
            'item': MenuItemSerializer(item).data
        })


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


class OrderListCreateView(APIView):
    """GET (liste, administration) / POST (création, public)."""

    def get_permissions(self):
        method = getattr(getattr(self, 'request', None), 'method', None)
        if method == 'POST':
            return [AllowAny()]
        return [IsAdminUser()]

    @extend_schema(
        operation_id='orders_list',
        parameters=[
            OpenApiParameter(
                'status', str, enum=ORDER_STATUS_VALUES, required=False,
                description="Filtre par statut de commande.",
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
        queryset = Order.objects.prefetch_related('items__menu_item').all()
        if status_filter:
            if status_filter not in ORDER_STATUS_VALUES:
                message = f"Statut invalide. Valeurs autorisées : {', '.join(ORDER_STATUS_VALUES)}."
                return error_response(message, errors={'status': [message]})
            queryset = queryset.filter(status=status_filter)

        orders = list(queryset)
        return Response({
            'success': True,
            'count': len(orders),
            'orders': OrderSerializer(orders, many=True).data
        })

    @extend_schema(
        request=OrderCreateSerializer,
        responses={
            201: OrderEnvelopeSerializer,
            400: ErrorEnvelopeSerializer,
            503: ErrorEnvelopeSerializer,
        },
    )
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            return Response({
                'success': True,
                'message': 'Commande créée avec succès !',
                'order': OrderSerializer(order).data
            }, status=status.HTTP_201_CREATED)
        return error_response(
            first_message(serializer.errors) or 'Commande invalide.',
            errors=serializer.errors,
        )


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


class OrderUnnotifiedEventsView(APIView):
    """
    Endpoint crucial pour l'application Admin :
    Renvoie les commandes non encore notifiées (pour déclencher la sonnerie et la notification push).
    """
    def get(self, request):
        unnotified = Order.objects.filter(is_notified_to_admin=False).order_by('-created_at')
        return Response({
            'has_new_orders': unnotified.exists(),
            'count': unnotified.count(),
            'new_orders': OrderSerializer(unnotified, many=True).data
        })

    def post(self, request):
        """Accuse réception de la notification (stoppe l'alerte sonore pour les commandes passées)"""
        order_refs = request.data.get('order_refs', [])
        if order_refs:
            Order.objects.filter(order_ref__in=order_refs).update(is_notified_to_admin=True)
        else:
            Order.objects.filter(is_notified_to_admin=False).update(is_notified_to_admin=True)
        
        return Response({
            'success': True,
            'message': 'Alertes de commandes acquittées.'
        })
