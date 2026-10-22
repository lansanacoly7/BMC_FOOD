"""
Tests d'expiration et durcissement du jeton d'administration (I16).

Vérifie :
1. Authentification réussie avec un jeton valide dans le délai imparti.
2. Échec (401 Unauthorized) lorsqu'un jeton a dépassé sa durée de vie (TTL).
3. Suppression du jeton périmé de la base de données.
4. Régénération transparente d'un jeton valide lors du re-login via `StaffTokenView`.
5. Prise en compte de la durée de vie configurable (`BMC_TOKEN_TTL_SECONDS`).
6. Désactivation de l'expiration si `BMC_TOKEN_TTL_SECONDS <= 0`.
"""
from datetime import timedelta
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient


class AuthTokenExpirationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff_user = User.objects.create_user(
            username='staff_test',
            password='Password123!',
            is_staff=True,
        )
        self.token = Token.objects.create(user=self.staff_user)

    def test_valid_token_allows_access(self):
        """Un jeton récent permet l'accès aux endpoints d'administration."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, 200)

    def test_expired_token_denies_access_and_is_deleted(self):
        """Un jeton dont l'âge dépasse le TTL est rejeté avec 401 et supprimé."""
        # Vieillir artificiellement le jeton de 48h (TTL par défaut = 24h)
        Token.objects.filter(pk=self.token.pk).update(
            created=timezone.now() - timedelta(hours=48)
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.data.get('success'))
        self.assertIn('expiré', response.data.get('error', ''))

        # Vérifier que le jeton périmé a bien été supprimé
        self.assertFalse(Token.objects.filter(pk=self.token.pk).exists())

    def test_login_refreshes_expired_token(self):
        """Se reconnecter via StaffTokenView regénère un jeton valide si l'ancien est expiré."""
        Token.objects.filter(pk=self.token.pk).update(
            created=timezone.now() - timedelta(days=5)
        )
        old_key = self.token.key

        login_res = self.client.post(
            '/api/auth/token/',
            {'username': 'staff_test', 'password': 'Password123!'},
            format='json',
        )
        self.assertEqual(login_res.status_code, 200)
        new_key = login_res.data['token']
        self.assertNotEqual(old_key, new_key)

        # Le nouveau jeton fonctionne immédiatement
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {new_key}')
        access_res = self.client.get('/api/orders/')
        self.assertEqual(access_res.status_code, 200)

    @override_settings(BMC_TOKEN_TTL_SECONDS=3600)
    def test_configurable_ttl_setting(self):
        """Le TTL est configurable via la variable / setting BMC_TOKEN_TTL_SECONDS."""
        # Vieillir de 2h (supérieur à 3600s = 1h)
        Token.objects.filter(pk=self.token.pk).update(
            created=timezone.now() - timedelta(hours=2)
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, 401)

    @override_settings(BMC_TOKEN_TTL_SECONDS=0)
    def test_ttl_disabled_when_zero_or_negative(self):
        """Si le TTL est <= 0, l'expiration automatique est désactivée."""
        Token.objects.filter(pk=self.token.pk).update(
            created=timezone.now() - timedelta(days=365)
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, 200)
