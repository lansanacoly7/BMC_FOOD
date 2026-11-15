"""
Tests complets des tâches V1 de Pathé Fall (Section 2 de docs/taches_v1.md) :
1. Interrupteur de fermeture manuelle et pause cuisine :
   - Modèle RestaurantSettings (singleton).
   - Endpoint PATCH /api/admin/settings/ (accessible uniquement avec jeton admin).
   - GET /api/health/ expose is_open, accepting_orders et closed_message.
   - Refus des commandes quand manual_closed=True.
   - Refus des commandes après 01h30 (dernière commande à 01h30 incluse).
2. Garde-fous de commande :
   - Téléphone sénégalais valide avec normalisation en +221...
   - Rejet des numéros invalides / non sénégalais.
   - Plafond de montant maximal de commande (250 000 F CFA).
   - Longueur maximale de la note (500 caractères).
   - Quantité totale maximale d'articles par commande (50 articles).
"""
from datetime import datetime
from unittest import mock
from zoneinfo import ZoneInfo
from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from api import order_rules
from api.models import Category, Customer, MenuItem, Order, RestaurantSettings


class RestaurantSettingsAndHealthTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Admin user
        self.admin_user = User.objects.create_superuser(username="admin_pathe", password="AdminPassword123")
        self.admin_token = Token.objects.create(user=self.admin_user)

        # Normal customer
        self.client_user = User.objects.create_user(username="779990011", password="UserPassword123")
        self.customer = Customer.objects.create(user=self.client_user, name="Client Test", phone="779990011")
        self.customer_token = Token.objects.create(user=self.client_user)

        # Réinitialiser les réglages
        RestaurantSettings.objects.all().delete()

    def test_settings_singleton_creation(self):
        """RestaurantSettings.get_settings() crée ou retourne toujours une ligne unique."""
        settings_1 = RestaurantSettings.get_settings()
        self.assertFalse(settings_1.manual_closed)
        self.assertEqual(settings_1.closed_message, "")

        settings_1.manual_closed = True
        settings_1.closed_message = "Cuisine en pause 15 min"
        settings_1.save()

        settings_2 = RestaurantSettings.get_settings()
        self.assertEqual(settings_1.pk, settings_2.pk)
        self.assertTrue(settings_2.manual_closed)
        self.assertEqual(settings_2.closed_message, "Cuisine en pause 15 min")

    def test_admin_settings_patch_requires_admin(self):
        """PATCH /api/admin/settings/ requiert un jeton d'administrateur (401 / 403 sinon)."""
        # 1. Anonyme -> 401
        res_anon = self.client.patch('/api/admin/settings/', {'manual_closed': True}, format='json')
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Client ordinaire -> 403
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.customer_token.key}')
        res_cust = self.client.patch('/api/admin/settings/', {'manual_closed': True}, format='json')
        self.assertEqual(res_cust.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Administrateur -> 200
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        res_admin = self.client.patch('/api/admin/settings/', {
            'manual_closed': True,
            'closed_message': 'Rupture temporaire de gaz, réouverture imminente.'
        }, format='json')
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
        self.assertTrue(res_admin.data['manual_closed'])
        self.assertEqual(res_admin.data['closed_message'], 'Rupture temporaire de gaz, réouverture imminente.')

    def test_health_check_reflects_manual_closure_and_message(self):
        """GET /api/health/ expose accepting_orders=False et closed_message quand manual_closed=True."""
        # Configurer fermeture manuelle
        settings_obj = RestaurantSettings.get_settings()
        settings_obj.manual_closed = True
        settings_obj.closed_message = "Pause cuisine jusqu'à 20h"
        settings_obj.save()

        res = self.client.get('/api/health/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('is_open', res.data)
        self.assertFalse(res.data['accepting_orders'])
        self.assertEqual(res.data['closed_message'], "Pause cuisine jusqu'à 20h")


class OrderClosureAndHoursTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        cat = Category.objects.create(name="Tacos", slug="tacos")
        self.item = MenuItem.objects.create(category=cat, code="tp-1", name="Tacos", price=3500)
        RestaurantSettings.objects.all().delete()

    def _dakar_dt(self, year, month, day, hour, minute):
        return datetime(year, month, day, hour, minute, tzinfo=ZoneInfo('Africa/Dakar'))

    def test_order_rejected_when_manual_closed_is_true(self):
        """Une commande est rejetée avec 400 si l'interrupteur manuel de pause cuisine est activé."""
        settings_obj = RestaurantSettings.get_settings()
        settings_obj.manual_closed = True
        settings_obj.closed_message = "Cuisine complète, pause de 30 minutes."
        settings_obj.save()

        payload = {
            "customer_name": "Awa Ndiaye",
            "phone": "77 123 45 67",
            "address": "Fann Résidence",
            "payment_method": "cash",
            "items": [{"id": "tp-1", "quantity": 1}]
        }
        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data.get('success'))
        self.assertIn("Cuisine complète", str(res.data))

    @override_settings(BMC_ENFORCE_OPENING_HOURS=True)
    def test_last_order_at_01h30_accepted(self):
        """À 01h30 pile (nuit de service), les commandes sont encore acceptées (dernière commande à 01h30 incluse)."""
        # Mercredi 01h30 (service du mardi soir)
        dt_0130 = self._dakar_dt(2026, 11, 11, 1, 30)
        payload = {
            "customer_name": "Samba Diop",
            "phone": "77 123 45 67",
            "address": "Plateau",
            "payment_method": "cash",
            "items": [{"id": "tp-1", "quantity": 1}]
        }
        with mock.patch('django.utils.timezone.now', return_value=dt_0130):
            res = self.client.post('/api/orders/', payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
            self.assertTrue(res.data.get('success'))

    @override_settings(BMC_ENFORCE_OPENING_HOURS=True)
    def test_order_at_01h31_refused(self):
        """À 01h31 (après 01h30), les commandes sont refusées."""
        # Mercredi 01h31
        dt_0131 = self._dakar_dt(2026, 11, 11, 1, 31)
        payload = {
            "customer_name": "Samba Diop",
            "phone": "77 123 45 67",
            "address": "Plateau",
            "payment_method": "cash",
            "items": [{"id": "tp-1", "quantity": 1}]
        }
        with mock.patch('django.utils.timezone.now', return_value=dt_0131):
            res = self.client.post('/api/orders/', payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(res.data.get('success'))
            self.assertIn("fermé", str(res.data).lower())


class OrderSafeguardsTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        cat = Category.objects.create(name="Tacos", slug="tacos")
        self.item = MenuItem.objects.create(category=cat, code="tp-1", name="Tacos", price=3500)
        self.cher = MenuItem.objects.create(category=cat, code="tp-cher", name="Plateau Géant", price=30000)
        RestaurantSettings.objects.all().delete()

    @override_settings(BMC_ENFORCE_OPENING_HOURS=False)
    def test_phone_normalized_to_senegal_format(self):
        """Le téléphone est normalisé au format international standard +221XXXXXXXXX."""
        test_cases = [
            ("77 123 45 67", "+221771234567"),
            ("+221 76 543 21 00", "+221765432100"),
            ("00221 78 999 88 77", "+221789998877"),
            ("701112233", "+221701112233"),
        ]
        for raw_phone, expected in test_cases:
            payload = {
                "customer_name": "Client Test",
                "phone": raw_phone,
                "address": "Almadies",
                "payment_method": "cash",
                "items": [{"id": "tp-1", "quantity": 1}]
            }
            res = self.client.post('/api/orders/', payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
            order_ref = res.data['order']['order_ref']
            order = Order.objects.get(order_ref=order_ref)
            self.assertEqual(order.phone, expected)

    @override_settings(BMC_ENFORCE_OPENING_HOURS=False)
    def test_invalid_phone_rejected_400(self):
        """Un numéro non sénégalais ou mal formaté est rejeté avec 400."""
        invalid_phones = [
            "0612345678",      # Numéro français
            "+33612345678",    # Numéro français
            "12345",           # Trop court
            "abcdefghij",      # Texte
            "881234567",       # Préfixe invalide au Sénégal
        ]
        for bad_phone in invalid_phones:
            payload = {
                "customer_name": "Client Test",
                "phone": bad_phone,
                "address": "Almadies",
                "payment_method": "cash",
                "items": [{"id": "tp-1", "quantity": 1}]
            }
            res = self.client.post('/api/orders/', payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(res.data.get('success'))
            self.assertIn('phone', str(res.data).lower())

    @override_settings(BMC_ENFORCE_OPENING_HOURS=False)
    def test_maximum_order_amount_ceiling_rejected_400(self):
        """Une commande dépassant le plafond maximal de 250 000 F CFA est rejetée."""
        # 9 x 30 000 = 270 000 F CFA (> 250 000 F)
        payload = {
            "customer_name": "Gros Client",
            "phone": "77 123 45 67",
            "address": "Dakar",
            "payment_method": "cash",
            "items": [{"id": "tp-cher", "quantity": 9}]
        }
        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data.get('success'))
        self.assertIn("plafond", str(res.data).lower())

    @override_settings(BMC_ENFORCE_OPENING_HOURS=False)
    def test_note_length_ceiling_rejected_400(self):
        """Une note dépassant 500 caractères est rejetée avec 400."""
        long_note = "A" * 501
        payload = {
            "customer_name": "Client Bavard",
            "phone": "77 123 45 67",
            "address": "Dakar",
            "notes": long_note,
            "payment_method": "cash",
            "items": [{"id": "tp-1", "quantity": 1}]
        }
        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data.get('success'))
        self.assertIn("note", str(res.data).lower())

    @override_settings(BMC_ENFORCE_OPENING_HOURS=False)
    def test_total_quantity_ceiling_rejected_400(self):
        """Une commande dont la quantité totale dépasse 50 articles est rejetée avec 400."""
        # Max quantity per line is 20, so 3 lines of 18 = 54 articles (> 50 articles total)
        cat = Category.objects.first()
        item2 = MenuItem.objects.create(category=cat, code="tp-2", name="Tacos 2", price=3000)
        item3 = MenuItem.objects.create(category=cat, code="tp-3", name="Tacos 3", price=3000)

        payload = {
            "customer_name": "Client Traiteur",
            "phone": "77 123 45 67",
            "address": "Dakar",
            "payment_method": "cash",
            "items": [
                {"id": "tp-1", "quantity": 18},
                {"id": "tp-2", "quantity": 18},
                {"id": "tp-3", "quantity": 18},
            ]
        }
        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data.get('success'))
        self.assertIn("quantité totale", str(res.data).lower())

