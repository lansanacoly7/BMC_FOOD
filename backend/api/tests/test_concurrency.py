"""
Tâche I11 : Test de concurrence réelle des références de commande (Threads simultanés).

Note d'architecture SQLite :
SQLite applique par conception un verrou exclusif au niveau fichier (WAL mode / exclusive lock)
lors des écritures. Pour garantir une concurrence sans faille sous forte charge :
1. `OrderCreateSerializer._create_order_with_unique_ref` s'exécute dans un bloc
   `transaction.atomic()` avec boucle de nouvelle tentative (ORDER_REF_MAX_ATTEMPTS = 25).
2. L'unicité est garantie au niveau du schéma par la contrainte `db_index=True, unique=True`
   sur `order_ref`.
3. Ce test prouve que N créations concurrentes simultanées produisent N références uniques
   sans aucun doublon ni erreur HTTP 500.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.test import TransactionTestCase
from rest_framework import status
from rest_framework.test import APIClient
from api.models import Category, MenuItem, Order


class OrderConcurrencyTests(TransactionTestCase):
    """
    Test de concurrence multithread réelle validant l'absence de collisions
    et la robustesse de l'assignation des références BMC-XXXXXX sous charge.
    """

    def setUp(self):
        from django.core.cache import cache
        cache.clear()

        Category.objects.all().delete()
        MenuItem.objects.all().delete()
        Order.objects.all().delete()

        self.category = Category.objects.create(name="Tacos panés", slug="tacos-panes")
        self.item = MenuItem.objects.create(
            category=self.category,
            code="tp-1",
            name="Tacos viande pané",
            price=3500,
            is_available=True
        )
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute('PRAGMA busy_timeout = 20000;')

    def _create_single_order(self, thread_idx):
        """Crée une commande client via un client HTTP indépendant."""
        from django.db import connection
        try:
            client = APIClient(REMOTE_ADDR=f'192.168.1.{10 + thread_idx}')
            payload = {
                "customer_name": f"Client Concurrence {thread_idx}",
                "phone": f"77{thread_idx:07d}"[:9],
                "address": f"Adresse {thread_idx}, Dakar",
                "payment_method": "cash",
                "items": [{"id": "tp-1", "quantity": 1}]
            }
            response = client.post('/api/orders/', payload, format='json')
            return response.status_code, response.data
        finally:
            connection.close()

    def test_concurrent_order_creations_yield_zero_duplicate_refs_and_zero_500(self):
        """
        Critère d'acceptation I11 :
        N créations simultanées en parallèle :
        - 0 erreur HTTP 500
        - N références générées
        - 0 doublon de référence (unicité stricte)
        """
        concurrency_workers = 8
        results = []

        with ThreadPoolExecutor(max_workers=concurrency_workers) as executor:
            futures = [
                executor.submit(self._create_single_order, i)
                for i in range(concurrency_workers)
            ]
            for future in as_completed(futures):
                results.append(future.result())

        status_codes = [code for code, _ in results]
        # Aucune erreur 500 (ni plantage serveur)
        self.assertNotIn(status.HTTP_500_INTERNAL_SERVER_ERROR, status_codes)

        # Toutes les créations réussissent avec 201
        self.assertTrue(
            all(code == status.HTTP_201_CREATED for code in status_codes),
            f"Statuts inattendus reçus : {status_codes}"
        )

        created_refs = [
            data['order']['order_ref']
            for code, data in results
            if code == status.HTTP_201_CREATED
        ]
        self.assertEqual(len(created_refs), concurrency_workers)

        # Assertion clé : 0 doublon de référence
        unique_refs = set(created_refs)
        self.assertEqual(
            len(unique_refs),
            len(created_refs),
            f"Collision détectée parmi les références générées : {created_refs}"
        )

        # Vérification en base de données
        db_refs = list(Order.objects.values_list('order_ref', flat=True))
        self.assertEqual(len(db_refs), concurrency_workers)
        self.assertEqual(len(set(db_refs)), concurrency_workers)
