from django.db import IntegrityError, transaction
from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from . import order_rules
from .exceptions import OrderReferenceUnavailable
from .models import Category, MenuItem, Order, OrderItem

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon']


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'code', 'name', 'category', 'category_name',
            'description', 'price', 'image_url', 'is_available',
            'is_daily_special', 'popular'
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_code = serializers.CharField(source='menu_item.code', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_code', 'item_name', 'unit_price', 'quantity', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_ref', 'customer_name', 'phone', 'address',
            'notes', 'payment_method', 'payment_status', 'total_amount',
            'status', 'is_notified_to_admin', 'created_at', 'items', 'items_count'
        ]

    @extend_schema_field(OpenApiTypes.INT)
    def get_items_count(self, obj):
        return sum(item.quantity for item in obj.items.all())




class StrictIntegerField(serializers.IntegerField):
    """Entier JSON strict : refuse les booléens, flottants (même 2.0) et chaînes."""
    default_error_messages = {'invalid': 'Un nombre entier est requis.'}

    def to_internal_value(self, data):
        if isinstance(data, bool) or not isinstance(data, int):
            self.fail('invalid')
        return super().to_internal_value(data)


def resolve_cart(raw_items):
    """Résout un panier côté serveur (I3).

    - Aucun prix ni total fourni par le client n'est lu : seuls `id` et `quantity` comptent.
    - Chaque article est recherché par ID Django (si numérique) puis par `code`.
    - Les lignes qui désignent le même article sont FUSIONNÉES (quantités additionnées),
      quel que soit l'identifiant utilisé (code ou ID).
    - Les prix sont lus en base ; montants en entiers (F CFA).

    Retourne `(lignes, erreurs)` ; `erreurs` est une liste de messages (toutes les
    erreurs du panier sont remontées en une seule fois).
    """
    refs = [str(raw['id']).strip() for raw in raw_items]
    numeric_ids = [int(ref) for ref in refs if ref.isdigit()]
    found = MenuItem.objects.filter(Q(pk__in=numeric_ids) | Q(code__in=refs))
    by_id = {item.pk: item for item in found}
    by_code = {item.code: item for item in found}

    errors = []
    merged = {}  # pk de l'article -> {'menu_item': ..., 'quantity': int}
    for ref, raw in zip(refs, raw_items):
        menu_item = by_id.get(int(ref)) if ref.isdigit() and int(ref) in by_id else by_code.get(ref)
        if menu_item is None:
            message = f"L'article « {ref} » est introuvable au menu."
            if message not in errors:
                errors.append(message)
            continue
        if not menu_item.is_available:
            message = f"L'article « {menu_item.name} » ({menu_item.code}) n'est pas disponible actuellement."
            if message not in errors:
                errors.append(message)
            continue
        line = merged.setdefault(menu_item.pk, {'menu_item': menu_item, 'quantity': 0})
        line['quantity'] += int(raw['quantity'])

    for line in merged.values():
        if line['quantity'] > order_rules.MAX_QUANTITY_PER_LINE:
            errors.append(
                f"Quantité maximale par article : {order_rules.MAX_QUANTITY_PER_LINE} "
                f"(« {line['menu_item'].name} » : {line['quantity']} demandés)."
            )
    if len(merged) > order_rules.MAX_DISTINCT_LINES:
        errors.append(
            f"Le panier ne peut contenir que {order_rules.MAX_DISTINCT_LINES} articles différents "
            f"({len(merged)} demandés)."
        )

    lines = []
    for line in merged.values():
        menu_item = line['menu_item']
        quantity = line['quantity']
        lines.append({
            'menu_item': menu_item,
            'item_name': menu_item.name,
            'unit_price': menu_item.price,
            'quantity': quantity,
            'subtotal': menu_item.price * quantity,
        })
    return lines, errors


class OrderCreateItemInputSerializer(serializers.Serializer):
    id = serializers.CharField(
        max_length=50,
        help_text="Identifiant ou code de l'article (ex: tp-1 ou ID Django)",
    )
    quantity = StrictIntegerField(
        min_value=1,
        max_value=order_rules.MAX_QUANTITY_PER_LINE,
        default=1,
        help_text=f"Entier entre 1 et {order_rules.MAX_QUANTITY_PER_LINE}. Les lignes du même article sont fusionnées.",
    )


class OrderCreateSerializer(serializers.Serializer):
    """Corps de `POST /api/orders/`.

    Tout champ de prix ou de total envoyé par le client (`price`, `unit_price`,
    `subtotal`, `total_amount`…) est ignoré : seuls les champs déclarés ici sont lus.
    """
    customer_name = serializers.CharField(max_length=120, min_length=2)
    phone = serializers.CharField(max_length=30, min_length=6)
    address = serializers.CharField(min_length=3)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    payment_method = serializers.ChoiceField(choices=['cash', 'wave', 'orange_money'], default='cash')
    items = OrderCreateItemInputSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Le panier ne peut pas être vide.")
        return value

    def validate(self, attrs):
        _, errors = resolve_cart(attrs['items'])
        if errors:
            raise serializers.ValidationError({'items': errors})
        return attrs

    @staticmethod
    def _create_order_with_unique_ref(**fields):
        """Crée la commande avec une référence unique.

        La contrainte UNIQUE de la base est l'arbitre : on tente l'insertion (dans un
        point de sauvegarde) et on retente avec un autre candidat en cas de collision,
        ce qui est sûr même avec des requêtes concurrentes. Aucune référence non
        vérifiée n'est jamais utilisée en dernier recours.
        """
        for _ in range(order_rules.ORDER_REF_MAX_ATTEMPTS):
            candidate = order_rules.generate_order_ref()
            try:
                with transaction.atomic():
                    return Order.objects.create(order_ref=candidate, **fields)
            except IntegrityError:
                if Order.objects.filter(order_ref=candidate).exists():
                    continue  # collision de référence : on retente
                raise  # autre violation d'intégrité : ne pas la masquer
        raise OrderReferenceUnavailable()

    def create(self, validated_data):
        payment_method = validated_data['payment_method']
        payment_status = 'pending' if payment_method in ('wave', 'orange_money') else 'unpaid'

        with transaction.atomic():
            # Relecture des prix et de la disponibilité DANS la transaction de création.
            lines, errors = resolve_cart(validated_data['items'])
            if errors:
                raise serializers.ValidationError({'items': errors})

            total_amount = sum(line['subtotal'] for line in lines)
            order = self._create_order_with_unique_ref(
                customer_name=validated_data['customer_name'].strip(),
                phone=validated_data['phone'].strip(),
                address=validated_data['address'].strip(),
                notes=validated_data.get('notes', '').strip(),
                payment_method=payment_method,
                payment_status=payment_status,
                total_amount=total_amount,
                status='pending',
                is_notified_to_admin=False,
            )
            OrderItem.objects.bulk_create([OrderItem(order=order, **line) for line in lines])

        return order


# ============================================================================
# Sérialiseurs de documentation et de schéma OpenAPI (Tâche P7)
# ============================================================================

class HealthCheckResponseSerializer(serializers.Serializer):
    status = serializers.CharField(default='ok')
    service = serializers.CharField(default='BMC Food Django REST API')
    version = serializers.CharField(default='2.0.0')
    server_time = serializers.DateTimeField()


class CategoryWithItemsSerializer(serializers.ModelSerializer):
    items_count = serializers.IntegerField()
    items = MenuItemSerializer(many=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'items_count', 'items']


class MenuResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    total_items = serializers.IntegerField()
    categories = CategoryWithItemsSerializer(many=True)
    items = MenuItemSerializer(many=True)


class DailySpecialResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    count = serializers.IntegerField()
    is_fallback = serializers.BooleanField(
        default=False,
        required=False,
        help_text="Indique si les articles retournés sont issus du repli automatique sur les best-sellers (P15)."
    )
    daily_specials = MenuItemSerializer(many=True)


class ToggleDailySpecialInputSerializer(serializers.Serializer):
    is_daily_special = serializers.BooleanField(
        required=False,
        help_text="Nouvel état du Plat du Jour (true pour activer, false pour désactiver). Optionnel : bascule l'état actuel si omis."
    )


class ToggleDailySpecialResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    message = serializers.CharField()
    item = MenuItemSerializer()


class OrderListResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    count = serializers.IntegerField()
    orders = OrderSerializer(many=True)


class OrderCreatedResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(default='Commande créée avec succès !')
    order = OrderSerializer()


class OrderStatusUpdateInputSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[choice[0] for choice in Order.STATUS_CHOICES],
        required=False,
        help_text="Nouveau statut de la commande"
    )
    payment_status = serializers.ChoiceField(
        choices=['unpaid', 'pending', 'paid'],
        required=False,
        help_text="Nouveau statut de paiement (unpaid, pending, paid)"
    )


class OrderStatusUpdateResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    message = serializers.CharField()
    order = OrderSerializer()


class OrderUnnotifiedGetResponseSerializer(serializers.Serializer):
    has_new_orders = serializers.BooleanField()
    count = serializers.IntegerField()
    new_orders = OrderSerializer(many=True)


class OrderAcknowledgeInputSerializer(serializers.Serializer):
    order_refs = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        help_text="Liste des références de commandes à acquitter (ex: ['BMC-1234']). Obligatoire et non vide (D14) : seules les commandes affichées à l'admin doivent être acquittées."
    )


class OrderAcknowledgeResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    message = serializers.CharField()
    updated_count = serializers.IntegerField()


class ErrorResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=False)
    error = serializers.CharField(required=False)
    errors = serializers.DictField(required=False)

