from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Category, MenuItem, Order
from .serializers import (
    CategorySerializer,
    MenuItemSerializer,
    OrderSerializer,
    OrderCreateSerializer
)

class HealthCheckView(APIView):
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


class OrderListCreateView(APIView):
    def get(self, request):
        status_filter = request.query_params.get('status')
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
