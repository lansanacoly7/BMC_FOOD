"""
Schémas de requêtes et de réponses de l'API (I6) — source unique pour OpenAPI.

Ces serializers DÉCRIVENT les enveloppes réellement renvoyées par les vues ; ils ne
servent pas à produire les réponses. Ils sont réutilisables par les annotations
`@extend_schema` de tous les endpoints (y compris ceux relevant de P1/P3/P4/P7).

Contrat commun :
- Succès : `{"success": true, ...}` (+ `message` pour les actions d'écriture).
- Erreur : voir `api/exceptions.py` -> `ErrorEnvelopeSerializer`.
"""
from rest_framework import serializers

from .models import Order
from .serializers import (
    MenuItemSerializer,
    OrderSerializer,
    OrderTrackItemSerializer,
    OrderTrackResponseSerializer,
)


class ErrorEnvelopeSerializer(serializers.Serializer):
    success = serializers.BooleanField(help_text="Toujours false en cas d'erreur.")
    error = serializers.CharField(help_text="Message d'erreur lisible.")
    errors = serializers.DictField(
        child=serializers.JSONField(),
        required=False,
        help_text="Erreurs de validation par champ (400 uniquement), au format DRF : {champ: [messages]}.",
    )
    code = serializers.CharField(required=False, help_text="Code machine (erreurs hors validation).")


class HealthResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    service = serializers.CharField()
    version = serializers.CharField()
    server_time = serializers.DateTimeField()


class MenuCategorySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.SlugField()
    icon = serializers.CharField()
    items_count = serializers.IntegerField()
    items = MenuItemSerializer(many=True)


class MenuResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    total_items = serializers.IntegerField()
    categories = MenuCategorySerializer(many=True)
    items = MenuItemSerializer(many=True)


class DailySpecialResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    count = serializers.IntegerField()
    is_fallback = serializers.BooleanField(required=False, default=False)
    daily_specials = MenuItemSerializer(many=True)


class DailySpecialToggleRequestSerializer(serializers.Serializer):
    is_daily_special = serializers.BooleanField(
        required=False,
        help_text="Nouvel état. Si absent, l'état courant est inversé.",
    )


class DailySpecialToggleResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    item = MenuItemSerializer()


class OrderEnvelopeSerializer(serializers.Serializer):
    """Réponse de POST /api/orders/ (201), GET /api/orders/<ref>/ et PATCH /api/orders/<ref>/status/."""
    success = serializers.BooleanField()
    message = serializers.CharField(required=False)
    order = OrderSerializer()


class OrderListResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    count = serializers.IntegerField()
    orders = OrderSerializer(many=True)


class OrderStatusUpdateRequestSerializer(serializers.Serializer):
    """Corps de PATCH /api/orders/<ref>/status/. Au moins un des deux champs est requis ;
    les deux changements sont validés puis appliqués ensemble (tout ou rien)."""
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES, required=False)
    payment_status = serializers.ChoiceField(choices=Order.PAYMENT_STATUS_CHOICES, required=False)


class UnnotifiedEventsResponseSerializer(serializers.Serializer):
    has_new_orders = serializers.BooleanField()
    count = serializers.IntegerField()
    new_orders = OrderSerializer(many=True)


class AcknowledgeRequestSerializer(serializers.Serializer):
    order_refs = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Références à acquitter. Le comportement sans références relève de P4 (décision D14).",
    )


class AcknowledgeResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()


class AuthTokenRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={'input_type': 'password'})


class AuthTokenResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    token = serializers.CharField(help_text="À envoyer dans l'en-tête `Authorization: Token <jeton>`.")
    username = serializers.CharField()
