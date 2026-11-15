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
        from django.core.cache import cache
        cache.clear()
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

    def test_customer_login_throttled_at_11th_request_429(self):
        """La 11e tentative consécutive d'authentification depuis la même IP est bloquée avec HTTP 429."""
        from django.core.cache import cache
        cache.clear()

        # Envoi de 10 tentatives de connexion
        for _ in range(10):
            res = self.client.post('/api/auth/customer/login/', {
                'phone': '771234567',
                'password': 'badpassword'
            }, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # La 11e tentative doit renvoyer 429 Too Many Requests
        res_11 = self.client.post('/api/auth/customer/login/', {
            'phone': '771234567',
            'password': 'badpassword'
        }, format='json')
        self.assertEqual(res_11.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_customer_profile_lists_orders_normalized_with_country_code(self):
        """Le profil client (9 chiffres) retrouve les commandes stockées au format '+221XXXXXXXXX' ou espacé."""
        reg = self.client.post('/api/auth/customer/register/', {
            'name': 'Moussa Diop',
            'phone': '77 999 88 77',
            'password': 'Password123',
        }, format='json')
        self.assertEqual(reg.status_code, status.HTTP_201_CREATED)
        token = reg.data['token']

        Order.objects.create(
            order_ref='BMC-NORM01',
            customer_name='Moussa Diop',
            phone='+221779998877',
            payment_method='cash',
            subtotal=3500,
            total_amount=3500,
        )
        Order.objects.create(
            order_ref='BMC-NORM02',
            customer_name='Moussa Diop',
            phone='77 999 88 77',
            payment_method='wave',
            subtotal=2000,
            total_amount=2000,
        )
        Order.objects.create(
            order_ref='BMC-OTHER1',
            customer_name='Autre Client',
            phone='+221770001122',
            payment_method='cash',
            subtotal=2500,
            total_amount=2500,
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.get('/api/auth/customer/profile/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        refs = [o['order_ref'] for o in res.data['orders']]
        self.assertEqual(res.data['orders_count'], 2)
        self.assertIn('BMC-NORM01', refs)
        self.assertIn('BMC-NORM02', refs)
        self.assertNotIn('BMC-OTHER1', refs)

