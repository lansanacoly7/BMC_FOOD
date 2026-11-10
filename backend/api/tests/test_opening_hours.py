"""
Tests des horaires d'ouverture du restaurant BMC Food.

Règle métier :
- Ouvert du Mardi au Dimanche, de 11h00 à 02h00 du matin (fuseau Africa/Dakar).
- Fermé tous les jours entre 02h00 et 11h00 du matin.
- Fermé toute la journée du Lundi à partir de 02h00 jusqu'au Mardi 11h00.
"""
from datetime import datetime
from unittest import mock
from zoneinfo import ZoneInfo
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient
from api import order_rules
from api.models import Category, MenuItem


class OpeningHoursLogicTests(TestCase):
    def _dakar_dt(self, year, month, day, hour, minute):
        return datetime(year, month, day, hour, minute, tzinfo=ZoneInfo('Africa/Dakar'))

    def test_mardi_nominal_ouvert(self):
        # Mardi 2026-11-10 à 14h30 -> OUVERT
        dt = self._dakar_dt(2026, 11, 10, 14, 30)
        self.assertTrue(order_rules.is_restaurant_open(dt))

    def test_mardi_ouverture_exacte_11h(self):
        # Mardi à 11h00 pile -> OUVERT
        dt = self._dakar_dt(2026, 11, 10, 11, 0)
        self.assertTrue(order_rules.is_restaurant_open(dt))

    def test_mardi_matin_ferme(self):
        # Mardi à 09h30 -> FERMÉ
        dt = self._dakar_dt(2026, 11, 10, 9, 30)
        self.assertFalse(order_rules.is_restaurant_open(dt))

    def test_nuit_mardi_a_mercredi_ouvert(self):
        # Mercredi à 01h15 (service du mardi soir) -> OUVERT
        dt = self._dakar_dt(2026, 11, 11, 1, 15)
        self.assertTrue(order_rules.is_restaurant_open(dt))

    def test_nuit_mardi_a_mercredi_fermeture_2h(self):
        # Mercredi à 02h05 -> FERMÉ
        dt = self._dakar_dt(2026, 11, 11, 2, 5)
        self.assertFalse(order_rules.is_restaurant_open(dt))

    def test_dimanche_soir_ouvert(self):
        # Dimanche 2026-11-15 à 22h00 -> OUVERT
        dt = self._dakar_dt(2026, 11, 15, 22, 0)
        self.assertTrue(order_rules.is_restaurant_open(dt))

    def test_nuit_dimanche_a_lundi_ouvert(self):
        # Lundi 2026-11-16 à 01h30 (service du dimanche soir jusqu'à 2h) -> OUVERT
        dt = self._dakar_dt(2026, 11, 16, 1, 30)
        self.assertTrue(order_rules.is_restaurant_open(dt))

    def test_lundi_apres_2h_ferme(self):
        # Lundi 2026-11-16 à 02h15 -> FERMÉ
        dt = self._dakar_dt(2026, 11, 16, 2, 15)
        self.assertFalse(order_rules.is_restaurant_open(dt))

    def test_lundi_apres_midi_ferme(self):
        # Lundi 2026-11-16 à 15h00 (jour de fermeture hebdomadaire) -> FERMÉ
        dt = self._dakar_dt(2026, 11, 16, 15, 0)
        self.assertFalse(order_rules.is_restaurant_open(dt))

    def test_nuit_lundi_a_mardi_ferme(self):
        # Mardi 2026-11-17 à 01h00 (le lundi soir était fermé) -> FERMÉ
        dt = self._dakar_dt(2026, 11, 17, 1, 0)
        self.assertFalse(order_rules.is_restaurant_open(dt))


class OrderCreationOpeningHoursTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        cat = Category.objects.create(name="Tacos", slug="tacos")
        self.item = MenuItem.objects.create(category=cat, code="tp-1", name="Tacos", price=3500)

    @override_settings(BMC_ENFORCE_OPENING_HOURS=True)
    def test_order_creation_refused_when_closed(self):
        """Une commande passée pendant les heures de fermeture est rejetée avec 400."""
        # Simuler un lundi à 16h00 (fermé)
        lundi_dt = datetime(2026, 11, 16, 16, 0, tzinfo=ZoneInfo('Africa/Dakar'))
        payload = {
            "customer_name": "Moussa Diop",
            "phone": "77 123 45 67",
            "address": "Fann Résidence",
            "payment_method": "cash",
            "items": [{"id": "tp-1", "quantity": 1}]
        }

        with mock.patch('django.utils.timezone.now', return_value=lundi_dt):
            res = self.client.post('/api/orders/', payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(res.data.get('success'))
            self.assertIn('fermé', res.data.get('error', '').lower())

    @override_settings(BMC_ENFORCE_OPENING_HOURS=True)
    def test_order_creation_accepted_when_open(self):
        """Une commande passée pendant les heures d'ouverture est acceptée avec 201."""
        # Simuler un vendredi à 20h00 (ouvert)
        vendredi_dt = datetime(2026, 11, 13, 20, 0, tzinfo=ZoneInfo('Africa/Dakar'))
        payload = {
            "customer_name": "Moussa Diop",
            "phone": "77 123 45 67",
            "address": "Fann Résidence",
            "payment_method": "cash",
            "items": [{"id": "tp-1", "quantity": 1}]
        }

        with mock.patch('django.utils.timezone.now', return_value=vendredi_dt):
            res = self.client.post('/api/orders/', payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
            self.assertTrue(res.data.get('success'))
