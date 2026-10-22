import django
from django.db import models
from django.db.models import F, Q


def _check_constraint(condition, name):
    """CheckConstraint compatible Django 5.0 (`check`) et 5.1+ (`condition`)."""
    key = 'condition' if django.VERSION >= (5, 1) else 'check'
    return models.CheckConstraint(name=name, **{key: condition})

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, default='Utensils')

    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering = ['name']

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    code = models.CharField(max_length=50, unique=True, help_text="Identifiant unique de commande (ex: tp-1, bg-1)")
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.PositiveIntegerField(help_text="Prix en Francs CFA (F CFA) - Source de vérité")
    image_url = models.CharField(max_length=255, blank=True, default='')
    is_available = models.BooleanField(default=True)
    is_daily_special = models.BooleanField(default=False, help_text="Marqué comme le Plat du Jour mis en avant")
    popular = models.BooleanField(default=False, help_text="Article best-seller")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Article du menu'
        verbose_name_plural = 'Articles du menu'
        ordering = ['category', 'price']

    def __str__(self):
        return f"{self.name} — {self.price} F CFA"


class Order(models.Model):
    PAYMENT_CHOICES = [
        ('cash', 'Espèces à la livraison'),
        ('wave', 'Wave'),
        ('orange_money', 'Orange Money'),
    ]

    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('preparing', 'En préparation (Cuisine)'),
        ('delivering', 'En cours de livraison'),
        ('delivered', 'Livrée'),
        ('cancelled', 'Annulée'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Non payée'),
        ('pending', 'Paiement en attente'),
        ('paid', 'Payée'),
        ('refund_pending', 'Remboursement en attente'),
    ]

    order_ref = models.CharField(max_length=20, unique=True, db_index=True)
    customer_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30)
    address = models.TextField()
    notes = models.TextField(blank=True, default='')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='cash')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')
    total_amount = models.PositiveIntegerField(help_text="Montant total en F CFA, calculé par le serveur")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    is_notified_to_admin = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Marqué à True dès que l'application admin a joué la sonnerie / push",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_ref} — {self.customer_name} ({self.total_amount} F CFA)"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    item_name = models.CharField(max_length=150)
    unit_price = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.PositiveIntegerField()

    class Meta:
        verbose_name = 'Ligne de commande'
        verbose_name_plural = 'Lignes de commande'
        constraints = [
            # Une seule ligne par article et par commande (les doublons sont fusionnés par le moteur de prix).
            models.UniqueConstraint(fields=['order', 'menu_item'], name='uniq_orderitem_order_menu_item'),
            _check_constraint(Q(quantity__gte=1), 'orderitem_quantity_gte_1'),
            # Cohérence monétaire : sous-total = prix unitaire x quantité.
            _check_constraint(Q(subtotal=F('unit_price') * F('quantity')), 'orderitem_subtotal_consistent'),
        ]

    def __str__(self):
        return f"{self.quantity}x {self.item_name} ({self.subtotal} F CFA)"
