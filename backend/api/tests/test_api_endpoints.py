from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient
from api.models import Category, MenuItem, Order, OrderItem

class ApiEndpointsHTTPTests(TestCase):
    """
    Tâche P6 & P14 : Tests automatisés de conformité HTTP, permissions et authentification
    par jeton réel sur tous les endpoints B4.
    Couvre 100% des endpoints : cas nominaux (200/201), cas d'erreur (400, 404) et sécurité (401/403).
    """

    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.client = APIClient()

        # Utilisateur administrateur pour tester les endpoints protégés
        self.admin_user = User.objects.create_superuser(
            username='admin_bmc',
            email='admin@bmcfood.sn',
            password='admin_secure_password_2026'
        )
        self.admin_token, _ = Token.objects.get_or_create(user=self.admin_user)

        # Utilisateur classique (non admin / non staff)
        self.regular_user = User.objects.create_user(
            username='client_user',
            email='client@bmcfood.sn',
            password='client_secure_password_2026'
        )
        self.regular_token, _ = Token.objects.get_or_create(user=self.regular_user)

        # Données de menu
        self.category = Category.objects.create(name="Burgers", slug="burgers", icon="Beef")
        self.item_burger = MenuItem.objects.create(
            category=self.category,
            code="bg-1",
            name="Burger complet",
            price=2000,
            is_available=True,
            is_daily_special=False
        )
        self.item_special = MenuItem.objects.create(
            category=self.category,
            code="trp-3",
            name="Tacos mixte jambon royal pané",
            price=6000,
            is_available=True,
            is_daily_special=True
        )
        self.item_unavailable = MenuItem.objects.create(
            category=self.category,
            code="bg-epuise",
            name="Burger indisponible",
            price=2500,
            is_available=False,
            is_daily_special=False
        )

        # Commande de test
        self.order = Order.objects.create(
            order_ref="BMC-1001",
            customer_name="Aissatou Diallo",
            phone="77 444 33 22",
            address="Fann Résidence",
            payment_method="wave",
            payment_status="pending",
            total_amount=6000,
            status="pending",
            is_notified_to_admin=False
        )
        OrderItem.objects.create(
            order=self.order,
            menu_item=self.item_special,
            item_name=self.item_special.name,
            unit_price=self.item_special.price,
            quantity=1,
            subtotal=6000
        )

    # ------------------------------------------------------------------------
    # 1. GET /api/health/
    # ------------------------------------------------------------------------
    def test_health_check_nominal_200(self):
        """GET /api/health/ renvoie 200, status 'ok' et heure serveur"""
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'ok')
        self.assertIn('server_time', response.data)
        self.assertIn('version', response.data)

    # ------------------------------------------------------------------------
    # 2. GET /api/menu/
    # ------------------------------------------------------------------------
    def test_menu_nominal_returns_only_available_items(self):
        """GET /api/menu/ renvoie 200 et exclut formellement les articles indisponibles"""
        response = self.client.get('/api/menu/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        items = response.data.get('items', [])
        item_codes = [i['code'] for i in items]
        self.assertIn('bg-1', item_codes)
        self.assertIn('trp-3', item_codes)
        self.assertNotIn('bg-epuise', item_codes)

    # ------------------------------------------------------------------------
    # 3. GET /api/daily-special/ (Tâche P15 & Repli Gracieux)
    # ------------------------------------------------------------------------
    def test_daily_special_get_nominal_200(self):
        """GET /api/daily-special/ renvoie le Plat du Jour configuré sans repli"""
        response = self.client.get('/api/daily-special/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertFalse(response.data.get('is_fallback'))
        specials = response.data.get('daily_specials', [])
        self.assertEqual(len(specials), 1)
        self.assertEqual(specials[0]['code'], 'trp-3')

    def test_daily_special_fallback_to_best_seller_when_none_configured(self):
        """Critère P15 : repli gracieux sur le premier best-seller disponible si aucun plat du jour"""
        self.item_special.is_daily_special = False
        self.item_special.save()

        self.item_burger.popular = True
        self.item_burger.save()

        response = self.client.get('/api/daily-special/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertTrue(response.data.get('is_fallback'), "Le flag is_fallback doit valoir True")
        specials = response.data.get('daily_specials', [])
        self.assertEqual(len(specials), 1)
        self.assertEqual(specials[0]['code'], 'bg-1')

    def test_daily_special_empty_when_no_special_and_no_popular_available(self):
        """Critère P15 : retour propre (count: 0, liste vide) si aucun plat du jour ni best-seller"""
        MenuItem.objects.update(is_daily_special=False, popular=False)

        response = self.client.get('/api/daily-special/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertFalse(response.data.get('is_fallback'))
        self.assertEqual(response.data.get('count'), 0)
        self.assertEqual(response.data.get('daily_specials'), [])

    # ------------------------------------------------------------------------
    # 4. PATCH /api/daily-special/<id>/toggle/ (Tâche P3)
    # ------------------------------------------------------------------------
    def test_toggle_daily_special_nominal_admin(self):
        """PATCH toggle par admin réussit (200) et active le plat"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(
            f'/api/daily-special/{self.item_burger.id}/toggle/',
            {'is_daily_special': True},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item_burger.refresh_from_db()
        self.assertTrue(self.item_burger.is_daily_special)

        # Règle D5 : l'ancien plat du jour a été automatiquement désactivé
        self.item_special.refresh_from_db()
        self.assertFalse(self.item_special.is_daily_special)

    def test_toggle_daily_special_non_boolean_fails_400(self):
        """Critère P3 : valeur non booléenne (ex: string 'false') renvoie 400"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(
            f'/api/daily-special/{self.item_burger.id}/toggle/',
            {'is_daily_special': 'false'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('booléen', response.data.get('error', '').lower())

    def test_toggle_daily_special_unavailable_item_fails_400(self):
        """Critère P3 : article indisponible ne peut pas être désigné plat du jour -> 400"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(
            f'/api/daily-special/{self.item_unavailable.id}/toggle/',
            {'is_daily_special': True},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_toggle_daily_special_unknown_id_fails_404(self):
        """PATCH toggle avec ID inexistant renvoie 404"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch('/api/daily-special/99999/toggle/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_toggle_daily_special_anonymous_refused_401_or_403(self):
        """Critère P3 : accès non autorisé refusé aux utilisateurs non-admin"""
        self.client.force_authenticate(user=None)
        response = self.client.patch(
            f'/api/daily-special/{self.item_burger.id}/toggle/',
            {'is_daily_special': True},
            format='json'
        )
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    # ------------------------------------------------------------------------
    # 5. POST /api/orders/
    # ------------------------------------------------------------------------
    def test_create_order_nominal_201(self):
        """POST /api/orders/ nominal renvoie 201 avec référence BMC-XXXX"""
        payload = {
            "customer_name": "Cheikh Anta",
            "phone": "77 555 44 33",
            "address": "Sacré Cœur 3",
            "payment_method": "orange_money",
            "items": [{"id": "bg-1", "quantity": 2}]
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(response.data['order']['total_amount'], 4000)

    def test_create_order_invalid_payload_fails_400(self):
        """POST /api/orders/ sans nom de client renvoie 400"""
        payload = {
            "phone": "77 555 44 33",
            "address": "Sacré Cœur",
            "items": [{"id": "bg-1", "quantity": 1}]
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------------
    # 6. GET /api/orders/
    # ------------------------------------------------------------------------
    def test_orders_list_admin_nominal_200(self):
        """GET /api/orders/ par admin renvoie 200 et la liste des commandes"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data.get('count'), 1)

    def test_orders_list_status_filter_valid_and_invalid(self):
        """GET /api/orders/?status= valide renvoie 200, statut invalide renvoie 400"""
        self.client.force_authenticate(user=self.admin_user)
        res_valid = self.client.get('/api/orders/?status=pending')
        self.assertEqual(res_valid.status_code, status.HTTP_200_OK)

        res_invalid = self.client.get('/api/orders/?status=statut_inexistant')
        self.assertEqual(res_invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_orders_list_anonymous_refused(self):
        """GET /api/orders/ anonyme refusé (401/403)"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/orders/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    # ------------------------------------------------------------------------
    # 7. GET /api/orders/<ref_or_id>/
    # ------------------------------------------------------------------------
    def test_order_detail_by_ref_and_id_nominal_200(self):
        """GET /api/orders/<ref>/ et <id>/ renvoient 200 pour le staff (données personnelles, I7)"""
        self.client.force_authenticate(user=self.admin_user)
        res_ref = self.client.get(f'/api/orders/{self.order.order_ref}/')
        self.assertEqual(res_ref.status_code, status.HTTP_200_OK)
        self.assertEqual(res_ref.data['order']['order_ref'], self.order.order_ref)

        res_id = self.client.get(f'/api/orders/{self.order.id}/')
        self.assertEqual(res_id.status_code, status.HTTP_200_OK)

    def test_order_detail_unknown_fails_404(self):
        """GET /api/orders/<ref> inconnue renvoie 404"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/orders/BMC-999999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_order_detail_anonymous_refused_401(self):
        """Le détail contient nom/téléphone/adresse : refusé sans authentification (I7)"""
        self.client.force_authenticate(user=None)
        response = self.client.get(f'/api/orders/{self.order.order_ref}/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    # ------------------------------------------------------------------------
    # 8. PATCH /api/orders/<ref>/status/
    # ------------------------------------------------------------------------
    def test_order_status_update_nominal_admin_200(self):
        """PATCH /api/orders/<ref>/status/ par admin met à jour statut et paiement"""
        self.client.force_authenticate(user=self.admin_user)
        # Règle D2 : pas de saut de statut, on passe par 'confirmed'
        self.client.patch(f'/api/orders/{self.order.order_ref}/status/', {'status': 'confirmed'}, format='json')
        response = self.client.patch(
            f'/api/orders/{self.order.order_ref}/status/',
            {'status': 'preparing', 'payment_status': 'paid'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'preparing')
        self.assertEqual(self.order.payment_status, 'paid')

    def test_order_status_update_invalid_status_fails_400(self):
        """PATCH statut invalide renvoie 400"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(
            f'/api/orders/{self.order.order_ref}/status/',
            {'status': 'statut_interdit_xyz'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_order_status_update_invalid_payment_status_fails_400(self):
        """PATCH paiement invalide renvoie 400"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(
            f'/api/orders/{self.order.order_ref}/status/',
            {'payment_status': 'paiement_fantaisiste'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_order_status_update_anonymous_refused(self):
        """PATCH statut par utilisateur anonyme refusé (401/403)"""
        self.client.force_authenticate(user=None)
        response = self.client.patch(
            f'/api/orders/{self.order.order_ref}/status/',
            {'status': 'preparing'},
            format='json'
        )
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    # ------------------------------------------------------------------------
    # 9. GET /api/orders/events/unnotified/ (Tâche P4)
    # ------------------------------------------------------------------------
    def test_unnotified_events_get_nominal_200(self):
        """Critère P4 : Commande créée visible dans unnotified jusqu'à acquittement"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/orders/events/unnotified/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('has_new_orders'))
        orders = response.data.get('new_orders', [])
        refs = [o['order_ref'] for o in orders]
        self.assertIn(self.order.order_ref, refs)

    def test_unnotified_events_get_anonymous_refused(self):
        """Critère P4 : Endpoint alertes non public (401/403 si anonyme)"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/orders/events/unnotified/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    # ------------------------------------------------------------------------
    # 10. POST /api/orders/events/unnotified/ (Tâche P4)
    # ------------------------------------------------------------------------
    def test_unnotified_events_post_targeted_acknowledgment(self):
        """Critère P4 : Acquittement ciblé n'affecte que les références fournies"""
        self.client.force_authenticate(user=self.admin_user)

        # Création d'une seconde commande non notifiée
        order2 = Order.objects.create(
            order_ref="BMC-1002",
            customer_name="Maimouna Sall",
            phone="77 888 77 66",
            address="Grand Dakar",
            payment_method="cash",
            total_amount=3500,
            status="pending",
            is_notified_to_admin=False
        )

        # Acquitter UNIQUEMENT self.order.order_ref ("BMC-1001")
        response = self.client.post(
            '/api/orders/events/unnotified/',
            {'order_refs': [self.order.order_ref]},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        order2.refresh_from_db()

        self.assertTrue(self.order.is_notified_to_admin)
        # order2 n'a PAS été acquittée !
        self.assertFalse(order2.is_notified_to_admin)

    def test_unnotified_events_post_global_acknowledgment_without_refs(self):
        """Critère P4 & Règle D14 : Acquittement sans références acquitte toutes les alertes"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post('/api/orders/events/unnotified/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertTrue(self.order.is_notified_to_admin)

    def test_unnotified_events_post_malformed_order_refs_fails_400(self):
        """Critère P4 : order_refs non liste (ex: chaîne au lieu de liste) -> 400"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            '/api/orders/events/unnotified/',
            {'order_refs': 'BMC-1001'}, # Erreur : chaîne au lieu de liste !
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('liste', response.data.get('error', '').lower())

    def test_unnotified_events_post_empty_order_refs_fails_400(self):
        """Critère P14 & Règle D14 : Liste order_refs vide refusée avec 400"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            '/api/orders/events/unnotified/',
            {'order_refs': []},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('vide', response.data.get('error', '').lower())
        self.order.refresh_from_db()
        self.assertFalse(self.order.is_notified_to_admin)

    def test_unnotified_events_post_anonymous_refused(self):
        """Critère P4 : POST acquittement refusé aux anonymes (401/403)"""
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/orders/events/unnotified/', {}, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    # ------------------------------------------------------------------------
    # 11. Authentification par jeton réel (Tâche P14)
    # ------------------------------------------------------------------------
    def test_real_token_authentication_success_on_protected_endpoints(self):
        """
        Validation P14 :
        Vérifie qu'un client HTTP utilisant un vrai jeton DRF via l'en-tête
        'Authorization: Token <cle>' accède avec succès aux endpoints administrateur.
        """
        token_client = APIClient()
        token_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        # Accès à la liste des commandes
        res_orders = token_client.get('/api/orders/')
        self.assertEqual(res_orders.status_code, status.HTTP_200_OK)

        # Accès au détail complet de la commande
        res_detail = token_client.get(f'/api/orders/{self.order.order_ref}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)

        # Accès aux alertes non notifiées
        res_alerts = token_client.get('/api/orders/events/unnotified/')
        self.assertEqual(res_alerts.status_code, status.HTTP_200_OK)

        # Bascule du Plat du Jour
        res_toggle = token_client.patch(
            f'/api/daily-special/{self.item_burger.id}/toggle/',
            {'is_daily_special': True},
            format='json'
        )
        self.assertEqual(res_toggle.status_code, status.HTTP_200_OK)

    def test_real_token_authentication_regular_user_fails_403(self):
        """Validation P14 : Le jeton d'un utilisateur non-staff est rejeté avec 403"""
        token_client = APIClient()
        token_client.credentials(HTTP_AUTHORIZATION=f'Token {self.regular_token.key}')

        res_orders = token_client.get('/api/orders/')
        self.assertEqual(res_orders.status_code, status.HTTP_403_FORBIDDEN)

        res_alerts = token_client.get('/api/orders/events/unnotified/')
        self.assertEqual(res_alerts.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_token_fails_401(self):
        """Validation P14 : Un jeton invalide ou corrompu est rejeté avec 401"""
        token_client = APIClient()
        token_client.credentials(HTTP_AUTHORIZATION='Token faux_jeton_inexistant_99999')

        response = token_client.get('/api/orders/events/unnotified/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_real_token_via_endpoint_and_consume_it(self):
        """
        Validation P14 :
        Obtention d'un jeton réel via POST /api/auth/token/ et réutilisation
        immédiate pour consommer l'API protégée.
        """
        auth_client = APIClient()
        login_res = auth_client.post(
            '/api/auth/token/',
            {'username': 'admin_bmc', 'password': 'admin_secure_password_2026'},
            format='json'
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        token_key = login_res.data.get('token')
        self.assertTrue(token_key, "Le jeton n'a pas été retourné par /api/auth/token/")

        # Consommation avec le jeton fraîchement délivré
        auth_client.credentials(HTTP_AUTHORIZATION=f'Token {token_key}')
        res = auth_client.get('/api/orders/events/unnotified/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
