from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from .views import (
    HealthCheckView,
    MenuView,
    DailySpecialView,
    ToggleDailySpecialView,
    OrderListCreateView,
    OrderDetailView,
    OrderStatusUpdateView,
    OrderUnnotifiedEventsView
)

urlpatterns = [
    # OpenAPI Schema & Swagger UI
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Endpoints B4
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('menu/', MenuView.as_view(), name='menu-list'),
    path('daily-special/', DailySpecialView.as_view(), name='daily-special'),
    path('daily-special/<int:pk>/toggle/', ToggleDailySpecialView.as_view(), name='toggle-daily-special'),
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/<str:ref_or_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:ref_or_id>/status/', OrderStatusUpdateView.as_view(), name='order-status-update'),
    path('orders/events/unnotified/', OrderUnnotifiedEventsView.as_view(), name='order-unnotified-events'),
]
