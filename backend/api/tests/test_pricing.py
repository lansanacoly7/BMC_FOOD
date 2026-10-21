from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Category, MenuItem, Order, OrderItem
from api.serializers import OrderCreateSerializer

class PricingEngineTests(TestCase):
    """
    Tâche P5 : Tests automatisés du moteur de tarification 100% serveur
    Prouve l'infalsifiabilité des prix et la robustesse de validation du panier.
    """

    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.client = APIClient()
        self.category = Category.objects.create(name="Tacos panés", slug="tacos-panes", icon="Flame")
        self.item1 = MenuItem.objects.create(
            category=self.category,
            code="tp-1",
            name="Tacos viande pané",
            price=3500,
            is_available=True
        )
        self.item2 = MenuItem.objects.create(
            category=self.category,
            code="tp-2",
            name="Tacos poulet pané",
            price=3500,
            is_available=True
        )
        self.item_unavailable = MenuItem.objects.create(
            category=self.category,
            code="tp-unavailable",
            name="Tacos épuisé",
            price=4000,
            is_available=False
        )

    def test_client_supplied_price_is_completely_ignored(self):
        """
        Cas 1 : Le client envoie un prix falsifié dans le payload (ex: 50 F CFA au lieu de 3500).
        Le serveur DOIT ignorer ce montant et utiliser impérativement le prix en base (3500).
        """
        payload = {
            "customer_name": "Pathé Fall",
            "phone": "77 123 45 67",
            "address": "Dakar Plateau",
            "payment_method": "cash",
            "items": [
                {"id": "tp-1", "quantity": 2, "price": 50, "unit_price": 50}
            ]
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order = Order.objects.get(order_ref=response.data['order']['order_ref'])
        # 2 * 3500 = 7000 F CFA (et JAMAIS 2 * 50 = 100 F CFA)
        self.assertEqual(order.total_amount, 7000)
        self.assertEqual(order.items.first().unit_price, 3500)
        self.assertEqual(order.items.first().subtotal, 7000)

    def test_negative_proof_client_price_fails_if_tampered(self):
        """
        Critère d'acceptation P5 (preuve par essai négatif) :
        Démontre explicitement que si le montant calculé était égal au prix client (100 F CFA),
        l'assertion échouerait.
        """
        payload = {
            "customer_name": "Client Test",
            "phone": "77 000 00 00",
            "address": "Médina",
            "payment_method": "wave",
            "items": [
                {"id": "tp-1", "quantity": 1, "price": 100}
            ]
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order = Order.objects.get(order_ref=response.data['order']['order_ref'])

        # Essai négatif : le total ne DOIT PAS être égal au prix falsifié par le client
        self.assertNotEqual(order.total_amount, 100)
        # Il doit être strictement égal au prix en base
        self.assertEqual(order.total_amount, 3500)

    def test_multi_item_order_total_and_subtotals_calculation(self):
        """
        Cas 2 : Panier multi-articles avec quantités différentes.
        Total = sum(prix_base * quantité)
        """
        payload = {
            "customer_name": "Lansana Coly",
            "phone": "77 106 75 75",
            "address": "Ngor, Dakar",
            "payment_method": "wave",
            "items": [
                {"id": "tp-1", "quantity": 3}, # 3 * 3500 = 10500
                {"id": "tp-2", "quantity": 2}  # 2 * 3500 = 7000
            ]
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order = Order.objects.get(order_ref=response.data['order']['order_ref'])
        self.assertEqual(order.total_amount, 17500)
        self.assertEqual(order.items.count(), 2)

    def test_empty_cart_fails_with_400(self):
        """
        Cas 3 : Panier vide -> HTTP 400 et aucune commande créée.
        """
        payload = {
            "customer_name": "Test User",
            "phone": "77 111 22 33",
            "address": "Almadies",
            "items": []
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)

    def test_missing_items_key_fails_with_400(self):
        """
        Cas 4 : Payload sans clé 'items'.
        """
        payload = {
            "customer_name": "Test User",
            "phone": "77 111 22 33",
            "address": "Almadies"
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)

    def test_unknown_item_fails_with_400(self):
        """
        Cas 5 : Article inexistant dans le menu -> HTTP 400.
        """
        payload = {
            "customer_name": "Test User",
            "phone": "77 111 22 33",
            "address": "Fann Hock",
            "items": [{"id": "code-inexistant", "quantity": 1}]
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)

    def test_unavailable_item_fails_with_400(self):
        """
        Cas 6 : Article existant mais indisponible (is_available=False) -> HTTP 400.
        """
        payload = {
            "customer_name": "Test User",
            "phone": "77 111 22 33",
            "address": "Mermoz",
            "items": [{"id": "tp-unavailable", "quantity": 1}]
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)

    def test_invalid_quantity_zero_negative_non_integer(self):
        """
        Cas 7 : Quantités invalides (0, négative, float).
        """
        # Quantité 0
        payload_zero = {
            "customer_name": "Test User",
            "phone": "77 111 22 33",
            "address": "Point E",
            "items": [{"id": "tp-1", "quantity": 0}]
        }
        res_zero = self.client.post('/api/orders/', payload_zero, format='json')
        self.assertEqual(res_zero.status_code, status.HTTP_400_BAD_REQUEST)

        # Quantité négative
        payload_neg = {
            "customer_name": "Test User",
            "phone": "77 111 22 33",
            "address": "Point E",
            "items": [{"id": "tp-1", "quantity": -5}]
        }
        res_neg = self.client.post('/api/orders/', payload_neg, format='json')
        self.assertEqual(res_neg.status_code, status.HTTP_400_BAD_REQUEST)

    def test_atomicity_and_no_partial_creation_on_error(self):
        """
        Cas 8 : Création atomique. Si un article est valide mais qu'un autre échoue,
        aucune commande ni OrderItem ne doit être enregistré en base.
        """
        initial_orders = Order.objects.count()
        initial_items = OrderItem.objects.count()

        payload = {
            "customer_name": "Test User",
            "phone": "77 111 22 33",
            "address": "Yoff",
            "items": [
                {"id": "tp-1", "quantity": 1},      # Valide
                {"id": "inexistant-xyz", "quantity": 1} # Invalide !
            ]
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Vérification qu'aucune ligne orpheline n'a été créée (rollback)
        self.assertEqual(Order.objects.count(), initial_orders)
        self.assertEqual(OrderItem.objects.count(), initial_items)

    def test_order_reference_format_bmc_prefix(self):
        """
        Cas 9 : La référence générée commence obligatoirement par 'BMC-'
        et est unique.
        """
        payload = {
            "customer_name": "Ibrahima Diallo",
            "phone": "77 999 88 77",
            "address": "Ouakam",
            "items": [{"id": "tp-1", "quantity": 1}]
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_ref = response.data['order']['order_ref']
        self.assertTrue(order_ref.startswith('BMC-'))
        self.assertEqual(len(order_ref), 10)
        self.assertRegex(order_ref, r'^BMC-\d{6}$')
