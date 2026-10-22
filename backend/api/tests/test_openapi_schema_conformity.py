"""
Tâche I17 : Vérification C1 — Schéma OpenAPI ↔ Réponses réelles.

Valide que le schéma généré par drf-spectacular est 100% conforme sans erreur,
et que les réponses HTTP effectives de chaque endpoint respectent rigoureusement
la structure attendue par le contrat d'interface.
"""
from io import StringIO
from django.core.management import call_command
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from api.models import Category, MenuItem, Order, OrderItem


class OpenApiSchemaConformityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Burgers", slug="burgers", icon="Beef")
        self.item = MenuItem.objects.create(
            category=self.category,
            code="bg-1",
            name="Burger complet",
            price=2000,
            is_available=True,
            is_daily_special=True,
            popular=True,
            image_url="/images/products/burger-complet.webp"
        )
        self.order = Order.objects.create(
            order_ref="BMC-123456",
            customer_name="Fatou Ndiaye",
            phone="77 123 45 67",
            address="Almadies, Dakar",
            payment_method="wave",
            payment_status="paid",
            status="confirmed",
            total_amount=2000
        )
        OrderItem.objects.create(
            order=self.order,
            menu_item=self.item,
            item_name=self.item.name,
            unit_price=self.item.price,
            quantity=1,
            subtotal=2000
        )

    def test_spectacular_validate_zero_errors_and_zero_warnings(self):
        """Critère I17 : spectacular --validate s'exécute sans aucune erreur."""
        out = StringIO()
        call_command('spectacular', '--validate', stdout=out)
        output = out.getvalue()
        self.assertIn("openapi", output.lower())

    def test_health_response_conforms_to_schema(self):
        r = self.client.get('/api/health/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        for field in ('status', 'service', 'version', 'server_time'):
            self.assertIn(field, data, f"Champ manquant dans health: {field}")
        self.assertEqual(data['status'], 'ok')

    def test_menu_response_conforms_to_schema(self):
        r = self.client.get('/api/menu/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        for field in ('success', 'total_items', 'categories', 'items'):
            self.assertIn(field, data, f"Champ manquant dans menu: {field}")
        self.assertTrue(data['success'])

    def test_daily_special_response_conforms_to_schema(self):
        r = self.client.get('/api/daily-special/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        for field in ('success', 'count', 'is_fallback', 'daily_specials'):
            self.assertIn(field, data, f"Champ manquant dans daily-special: {field}")

    def test_track_order_response_conforms_to_schema_without_personal_data(self):
        r = self.client.get(f'/api/orders/track/{self.order.order_ref}/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        expected_fields = {
            'success', 'order_ref', 'status', 'status_label',
            'payment_status', 'payment_status_label', 'total_amount',
            'created_at', 'items_count', 'items'
        }
        for field in expected_fields:
            self.assertIn(field, data, f"Champ requis manquant dans track: {field}")

        # Exclusion formelle des données personnelles
        for forbidden in ('customer_name', 'phone', 'address', 'notes'):
            self.assertNotIn(forbidden, data, f"Fuite de données personnelles: {forbidden}")
