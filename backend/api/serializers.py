import random
import string
from django.db import transaction
from rest_framework import serializers
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

    def get_items_count(self, obj):
        return sum(item.quantity for item in obj.items.all())


class OrderCreateItemInputSerializer(serializers.Serializer):
    id = serializers.CharField(help_text="Identifiant ou code de l'article (ex: tp-1 ou ID Django)")
    quantity = serializers.IntegerField(min_value=1, default=1)


class OrderCreateSerializer(serializers.Serializer):
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

    def create(self, validated_data):
        customer_name = validated_data['customer_name'].strip()
        phone = validated_data['phone'].strip()
        address = validated_data['address'].strip()
        notes = validated_data.get('notes', '').strip()
        payment_method = validated_data['payment_method']
        raw_items = validated_data['items']

        # Moteur de calcul des prix strict au niveau du backend
        validated_items = []
        total_amount = 0

        for raw in raw_items:
            item_ref = str(raw['id']).strip()
            qty = int(raw['quantity'])

            # Recherche par code ou par id Django
            menu_item = None
            if item_ref.isdigit():
                menu_item = MenuItem.objects.filter(id=int(item_ref), is_available=True).first()
            if not menu_item:
                menu_item = MenuItem.objects.filter(code=item_ref, is_available=True).first()

            if not menu_item:
                raise serializers.ValidationError({
                    'items': f"L'article référencé '{item_ref}' est introuvable ou indisponible au menu."
                })

            subtotal = menu_item.price * qty
            total_amount += subtotal

            validated_items.append({
                'menu_item': menu_item,
                'item_name': menu_item.name,
                'unit_price': menu_item.price,
                'quantity': qty,
                'subtotal': subtotal
            })

        # Génération d'une référence unique BMC-XXXX
        order_ref = None
        for _ in range(10):
            candidate = 'BMC-' + ''.join(random.choices(string.digits, k=4))
            if not Order.objects.filter(order_ref=candidate).exists():
                order_ref = candidate
                break
        if not order_ref:
            order_ref = f"BMC-{random.randint(1000, 9999)}"

        payment_status = 'pending' if payment_method in ['wave', 'orange_money'] else 'unpaid'

        # Création transactionnelle
        with transaction.atomic():
            order = Order.objects.create(
                order_ref=order_ref,
                customer_name=customer_name,
                phone=phone,
                address=address,
                notes=notes,
                payment_method=payment_method,
                payment_status=payment_status,
                total_amount=total_amount,
                status='pending',
                is_notified_to_admin=False
            )

            for item_data in validated_items:
                OrderItem.objects.create(
                    order=order,
                    menu_item=item_data['menu_item'],
                    item_name=item_data['item_name'],
                    unit_price=item_data['unit_price'],
                    quantity=item_data['quantity'],
                    subtotal=item_data['subtotal']
                )

        return order
