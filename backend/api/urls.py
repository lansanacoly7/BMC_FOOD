from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny

from .auth_views import StaffTokenView
from .views import (
    HealthCheckView,
    MenuView,
    DailySpecialView,
    ToggleDailySpecialView,
    OrderListCreateView,
    OrderDetailView,
    OrderStatusUpdateView,
    OrderUnnotifiedEventsView,
    OrderTrackView,
)

# --- Politique d'accès (I7) --------------------------------------------------
# Par défaut (settings.REST_FRAMEWORK) toute vue est réservée au staff authentifié
# par jeton (`Authorization: Token <jeton>`). Seuls les accès publics réellement
# nécessaires sont déclarés ici :
#
#   PUBLIC  GET  /api/health/            santé de l'API
#   PUBLIC  GET  /api/menu/              catalogue
#   PUBLIC  GET  /api/daily-special/     Plat du Jour
#   PUBLIC  GET  /api/orders/track/<ref>/ suivi de commande client (sans données personnelles)
#   PUBLIC  POST /api/orders/            création d'une commande (client)
#   PUBLIC  POST /api/auth/token/        obtention d'un jeton (compte staff requis, débit limité)
#   ADMIN   GET  /api/orders/            liste des commandes
#   ADMIN   GET  /api/orders/<ref>/      détail (données personnelles du client)
#   ADMIN   PATCH /api/orders/<ref>/status/
#   ADMIN   PATCH /api/daily-special/<id>/toggle/
#   ADMIN   GET/POST /api/orders/events/unnotified/
#
# La politique est posée ici (as_view) afin de ne pas modifier le code des vues
# relevant de P1/P3/P4. Les vues publiques ignorent l'en-tête d'authentification
# pour qu'un jeton périmé n'empêche jamais la consultation du menu.
PUBLIC = {'permission_classes': [AllowAny], 'authentication_classes': []}

urlpatterns = [
    path('health/', HealthCheckView.as_view(**PUBLIC), name='health-check'),
    path('menu/', MenuView.as_view(**PUBLIC), name='menu-list'),
    path('daily-special/', DailySpecialView.as_view(**PUBLIC), name='daily-special'),
    path('daily-special/<int:pk>/toggle/', ToggleDailySpecialView.as_view(), name='toggle-daily-special'),
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/events/unnotified/', OrderUnnotifiedEventsView.as_view(), name='order-unnotified-events'),
    path('orders/track/<str:ref>/', OrderTrackView.as_view(**PUBLIC), name='order-track'),
    path('orders/<str:ref_or_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:ref_or_id>/status/', OrderStatusUpdateView.as_view(), name='order-status-update'),

    # Authentification administration
    path('auth/token/', StaffTokenView.as_view(), name='auth-token'),

    # Documentation OpenAPI (accès réglé par SPECTACULAR_SETTINGS['SERVE_PERMISSIONS'])
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
