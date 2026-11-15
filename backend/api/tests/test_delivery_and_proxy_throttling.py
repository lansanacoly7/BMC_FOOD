"""
Tests des fonctionnalités de sécurité et de proxy (Pathé Fall) :
- Throttling tenant compte de X-Forwarded-For derrière un reverse-proxy (ProxiedScopedRateThrottle).
- Vérification d'accès interdit (403) aux endpoints admin pour un compte Customer.
"""
from django.core.cache import cache
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient, APIRequestFactory

from api.models import Customer
from api.throttling import ProxiedScopedRateThrottle


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
