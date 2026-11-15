"""
Tests des fonctionnalités ajoutées :
- Tâche 5 : Commande d'articles ajoutés (boissons, sauces, accompagnements, finger food, chawarma).
- Tâche 6 : Calcul des frais de livraison côté serveur selon la zone / quartier.
- Tâche 7 : Mode de retrait (delivery vs pickup).
- Tâche 10 : Throttling tenant compte de X-Forwarded-For derrière un reverse-proxy.
- Tâche 4 : Vérification d'accès interdit (403) aux endpoints admin pour un compte Customer.
"""
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient, APIRequestFactory

from api.models import Category, Customer, MenuItem, Order
from api.throttling import ProxiedScopedRateThrottle


class DeliveryAndFulfillmentTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

        cat = Category.objects.create(name="Tacos", slug="tacos")
        self.tacos = MenuItem.objects.create(category=cat, code="tp-1", name="Tacos", price=3500)
        self.boisson = MenuItem.objects.create(category=cat, code="bv-1", name="Boisson", price=800)
        self.sauce = MenuItem.objects.create(category=cat, code="sc-1", name="Sauce", price=500)
        self.frites = MenuItem.objects.create(category=cat, code="ac-1", name="Frites", price=1000)
        self.chawarma = MenuItem.objects.create(category=cat, code="sw-1", name="Chawarma", price=2000)

    @override_settings(BMC_ENFORCE_OPENING_HOURS=False)
    def test_order_with_delivery_fee_calculated_by_server(self):
        """Les frais de livraison sont calculés selon le quartier et ajoutés au total."""
        payload = {
            "customer_name": "Babacar Sow",
            "phone": "77 555 44 33",
            "address": "Grand Yoff, Dakar",
            "payment_method": "cash",
            "fulfillment_method": "delivery",
            "delivery_area": "grand-yoff",
            "items": [{"id": "tp-1", "quantity": 1}]  # 3500 F
        }
        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data.get('success'))

        order_data = res.data['order']
        self.assertEqual(order_data['fulfillment_method'], 'delivery')
        self.assertEqual(order_data['delivery_area'], 'grand-yoff')
        self.assertEqual(order_data['delivery_fee'], 1000)
        self.assertEqual(order_data['total_amount'], 4500)  # 3500 + 1000

    @override_settings(BMC_ENFORCE_OPENING_HOURS=False)
    def test_order_pickup_has_zero_delivery_fee(self):
        """Une commande à emporter (pickup) a des frais de livraison de 0 F."""
        payload = {
            "customer_name": "Aissatou Ba",
            "phone": "77 222 33 44",
            "address": "Retrait au comptoir",
            "payment_method": "cash",
            "fulfillment_method": "pickup",
            "delivery_area": "grand-yoff",  # ignoré car pickup
            "items": [{"id": "tp-1", "quantity": 2}]  # 7000 F
        }
        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        order_data = res.data['order']
        self.assertEqual(order_data['fulfillment_method'], 'pickup')
        self.assertEqual(order_data['delivery_fee'], 0)
        self.assertEqual(order_data['total_amount'], 7000)

    @override_settings(BMC_ENFORCE_OPENING_HOURS=False)
    def test_order_with_new_menu_items_succeeds(self):
        """Une commande contenant des boissons (bv-*), sauces (sc-*), accompagnements (ac-*) et chawarma (sw-1) réussit."""
        payload = {
            "customer_name": "Moustapha Fall",
            "phone": "78 999 88 77",
            "address": "Almadies",
            "payment_method": "cash",
            "fulfillment_method": "delivery",
            "delivery_area": "almadies",  # 2500 F
            "items": [
                {"id": "sw-1", "quantity": 1},  # 2000
                {"id": "bv-1", "quantity": 2},  # 1600
                {"id": "sc-1", "quantity": 1},  # 500
                {"id": "ac-1", "quantity": 1},  # 1000
            ]
        }
        # Total articles = 2000 + 1600 + 500 + 1000 = 5100 F
        # Frais livraison = 2500 F
        # Total = 7600 F
        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        order_data = res.data['order']
        self.assertEqual(order_data['delivery_fee'], 2500)
        self.assertEqual(order_data['total_amount'], 7600)


class ProxyThrottlingAndSecurityTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_proxied_throttle_ident_extracts_client_ip(self):
        """ProxiedScopedRateThrottle utilise la première IP de X-Forwarded-For."""
        throttle = ProxiedScopedRateThrottle()
        factory = APIRequestFactory()

        # Avec proxy X-Forwarded-For
        req_proxied = factory.get('/', HTTP_X_FORWARDED_FOR='197.234.219.12, 10.0.0.1', REMOTE_ADDR='127.0.0.1')
        ident = throttle.get_ident(req_proxied)
        self.assertEqual(ident, '197.234.219.12')

        # Sans proxy (direct)
        req_direct = factory.get('/', REMOTE_ADDR='192.168.1.50')
        ident_direct = throttle.get_ident(req_direct)
        self.assertEqual(ident_direct, '192.168.1.50')

    def test_customer_token_forbidden_on_admin_routes(self):
        """Un compte client authentifié ne peut accéder à aucune route réservée au staff/admin."""
        # Inscription client
        reg_res = self.client.post('/api/auth/customer/register/', {
            'name': 'Client Normal',
            'phone': '70 123 45 67',
            'password': 'Password123'
        }, format='json')
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        token = reg_res.data['token']

        # Utilisation du jeton client
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

        # 1. Liste complète des commandes (admin)
        res_orders = self.client.get('/api/orders/')
        self.assertEqual(res_orders.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Événements non notifiés (sonnerie cuisine)
        res_events = self.client.get('/api/orders/events/unnotified/')
        self.assertEqual(res_events.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Bascule plat du jour (admin)
        res_special = self.client.post('/api/daily-special/1/toggle/', {'is_daily_special': True}, format='json')
        self.assertEqual(res_special.status_code, status.HTTP_403_FORBIDDEN)
