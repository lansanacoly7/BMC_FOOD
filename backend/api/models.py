import django
from django.contrib.auth.models import User
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


class DeliveryArea(models.Model):
    slug = models.SlugField(
        max_length=80,
        unique=True,
        db_index=True,
        help_text="Identifiant stable du quartier (ex: grand-yoff)",
    )
    name = models.CharField(max_length=120, unique=True)
    zone = models.PositiveSmallIntegerField(help_text="Numéro de zone (1 à 9)")
    zone_label = models.CharField(max_length=80, blank=True, default='')
    fee = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Frais en F CFA ; null si destination éloignée (prix confirmé par téléphone)",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Quartier de livraison'
        verbose_name_plural = 'Quartiers de livraison'
        ordering = ['zone', 'name']

    def __str__(self):
        fee_label = f"{self.fee} F CFA" if self.fee is not None else "À confirmer par téléphone"
        return f"Zone {self.zone} — {self.name} ({fee_label})"


class Order(models.Model):
    ORDER_TYPE_CHOICES = [
        ('delivery', 'Livraison'),
        ('pickup', 'À emporter'),
    ]

    PAYMENT_CHOICES = [
        ('cash', 'Espèces à la livraison'),
        ('wave', 'Wave'),
        ('orange_money', 'Orange Money'),
    ]

    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('preparing', 'En préparation (Cuisine)'),
        ('ready', 'Prête (Comptoir)'),
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

    FULFILLMENT_CHOICES = [
        ('delivery', 'Livraison à domicile'),
        ('pickup', 'À emporter (sur place)'),
    ]

    order_ref = models.CharField(max_length=20, unique=True, db_index=True)
    customer_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30)
    order_type = models.CharField(max_length=20, choices=ORDER_TYPE_CHOICES, default='delivery', db_index=True)
    delivery_area = models.CharField(
        max_length=80,
        blank=True,
        default='',
        help_text="Identifiant du quartier de livraison (ex: grand-yoff)",
    )
    delivery_fee = models.PositiveIntegerField(
        null=True,
        blank=True,
        default=0,
        help_text="Frais de livraison en F CFA (null si à confirmer par téléphone)",
    )
    address = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    has_allergy = models.BooleanField(
        default=False,
        help_text="Indique si le client a signalé une allergie alimentaire",
    )
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='cash')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')
    subtotal = models.PositiveIntegerField(
        default=0,
        help_text="Sous-total des articles hors livraison en F CFA, calculé par le serveur",
    )
    total_amount = models.PositiveIntegerField(help_text="Montant total en F CFA, calculé par le serveur")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    cancel_reason = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="Motif d'annulation de la commande",
    )
    idempotency_key = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Clé d'idempotence (en-tête Idempotency-Key) anti-doublon",
    )
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

    def save(self, *args, **kwargs):
        update_fields = kwargs.get('update_fields')
        if update_fields is None and self.subtotal == 0 and self.total_amount:
            fee = self.delivery_fee or 0
            if self.total_amount >= fee:
                self.subtotal = self.total_amount - fee
        super().save(*args, **kwargs)

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


class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile', null=True, blank=True)
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30, unique=True, db_index=True)
    address = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.phone})"


class RestaurantSettings(models.Model):
    """
    Configuration opérationnelle et interrupteur d'urgence du restaurant (ligne unique / singleton).
    Permet à l'administration de mettre la cuisine en pause ou de fermer le restaurant manuellement.
    """
    manual_closed = models.BooleanField(
        default=False,
        help_text="Fermeture manuelle ou pause cuisine activée par l'administration."
    )
    closed_message = models.TextField(
        blank=True,
        default="",
        help_text="Message explicatif affiché aux clients lors d'une fermeture manuelle ou pause."
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Paramètres du restaurant"
        verbose_name_plural = "Paramètres du restaurant"

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj

    def __str__(self):
        state = "Fermé / Pause" if self.manual_closed else "Ouvert / Normal"
        return f"RestaurantSettings ({state})"
