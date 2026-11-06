"""
Tests de l'authentification et de l'espace client (Choix 2).

Vérifie :
1. Inscription client (POST /api/auth/customer/register/) avec numéro sénégalais normalisé.
2. Rejet des inscriptions invalides (téléphone incorrect, mot de passe trop court, doublon).
3. Connexion client (POST /api/auth/customer/login/) et génération de jeton API.
4. Échec de connexion si mot de passe incorrect.
5. Impossibilité pour un compte client d'accéder au jeton d'administration (StaffTokenView).
6. Consultation et mise à jour du profil client (GET/PATCH /api/auth/customer/profile/).
"""
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from api.models import Customer, Order


class CustomerAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_customer_register_nominal_201(self):
        """Inscription client réussie avec numéro sénégalais."""
        payload = {
            'name': 'Fatou Ndiaye',
            'phone': '+221 77 856 13 13',
            'password': 'MonMotDePasse123',
            'address': 'Mermoz Pyrotechnie, Dakar'
        }
        res = self.client.post('/api/auth/customer/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data.get('success'))
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['phone'], '778561313')
        self.assertEqual(res.data['user']['name'], 'Fatou Ndiaye')

        # Vérifier en base
        customer = Customer.objects.filter(phone='778561313').first()
        self.assertIsNotNone(customer)
        self.assertFalse(customer.user.is_staff)

    def test_customer_register_duplicate_phone_fails_400(self):
        """Impossible d'enregistrer deux comptes avec le même numéro de téléphone."""
        payload = {
            'name': 'Client Un',
            'phone': '778561313',
            'password': 'Password123'
        }
        self.client.post('/api/auth/customer/register/', payload, format='json')

        # Deuxième tentative
        res2 = self.client.post('/api/auth/customer/register/', payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res2.data.get('success'))
        self.assertIn('existe déjà', res2.data.get('error', ''))

    def test_customer_register_invalid_phone_fails_400(self):
        """Rejet si le numéro n'est pas un numéro sénégalais valide."""
        payload = {
            'name': 'Client Invalide',
            'phone': '0612345678', # Numéro français, non sénégalais
            'password': 'Password123'
        }
        res = self.client.post('/api/auth/customer/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('invalide', res.data.get('error', ''))

    def test_customer_register_short_password_fails_400(self):
        """Rejet si le mot de passe fait moins de 4 caractères."""
        payload = {
            'name': 'Client Test',
            'phone': '778561313',
            'password': '123'
        }
        res = self.client.post('/api/auth/customer/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_customer_login_nominal_200(self):
        """Connexion réussie avec numéro et mot de passe."""
        # Créer le compte
        self.client.post('/api/auth/customer/register/', {
            'name': 'Amadou Diallo',
            'phone': '76 543 21 00',
            'password': 'Password123'
        }, format='json')

        # Se connecter
        login_res = self.client.post('/api/auth/customer/login/', {
            'phone': '+221 76 543 21 00',
            'password': 'Password123'
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertTrue(login_res.data.get('success'))
        self.assertIn('token', login_res.data)
        self.assertEqual(login_res.data['user']['name'], 'Amadou Diallo')

    def test_customer_login_wrong_password_fails_400(self):
        """Connexion rejetée avec mauvais mot de passe."""
        self.client.post('/api/auth/customer/register/', {
            'name': 'Amadou Diallo',
            'phone': '76 543 21 00',
            'password': 'BonMotDePasse'
        }, format='json')

        res = self.client.post('/api/auth/customer/login/', {
            'phone': '765432100',
            'password': 'MauvaisMotDePasse'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('incorrect', res.data.get('error', ''))

    def test_customer_cannot_obtain_staff_token_403(self):
        """Un compte client ne peut pas obtenir de jeton d'administration."""
        self.client.post('/api/auth/customer/register/', {
            'name': 'Client Normal',
            'phone': '77 123 45 67',
            'password': 'Password123'
        }, format='json')

        staff_res = self.client.post('/api/auth/token/', {
            'username': '771234567',
            'password': 'Password123'
        }, format='json')
        self.assertEqual(staff_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_customer_profile_get_and_patch(self):
        """Consultation et modification du profil client authentifié."""
        reg = self.client.post('/api/auth/customer/register/', {
            'name': 'Awa Fall',
            'phone': '78 111 22 33',
            'password': 'Password123',
            'address': 'Almadies'
        }, format='json')
        token = reg.data['token']

        # Consultation avec jeton
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        profile_res = self.client.get('/api/auth/customer/profile/')
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data['user']['name'], 'Awa Fall')
        self.assertEqual(profile_res.data['user']['address'], 'Almadies')

        # Modification d'adresse
        patch_res = self.client.patch('/api/auth/customer/profile/', {
            'address': 'Plateau, Rue Carnot'
        }, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['user']['address'], 'Plateau, Rue Carnot')

