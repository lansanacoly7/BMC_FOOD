"""I10 : la migration 0002 doit réussir sur une base déjà remplie (doublons, quantités nulles, sous-totaux faux)."""
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase

BEFORE = [('api', '0001_initial')]
AFTER = [('api', '0002_payment_status_choices_indexes_constraints')]


class Migration0002PopulatedDatabaseTests(TransactionTestCase):
    def migrate(self, target):
        executor = MigrationExecutor(connection)
        executor.migrate(target)
        return executor.loader.project_state(target).apps

    def setUp(self):
        self.migrate(BEFORE)

    def tearDown(self):
        # laisse la base de test à jour pour les autres tests
        self.migrate(MigrationExecutor(connection).loader.graph.leaf_nodes())

    def test_doublons_fusionnes_et_donnees_nettoyees(self):
        apps = self.migrate(BEFORE)
        Category, MenuItem, Order, OrderItem = (
            apps.get_model('api', n) for n in ('Category', 'MenuItem', 'Order', 'OrderItem'))
        cat = Category.objects.create(name='T', slug='t')
        a = MenuItem.objects.create(category=cat, code='a-1', name='A', price=100)
        b = MenuItem.objects.create(category=cat, code='b-1', name='B', price=50)
        o = Order.objects.create(order_ref='BMC-0001', customer_name='x', phone='1', address='a',
                                 payment_method='cash', total_amount=400)
        OrderItem.objects.create(order=o, menu_item=a, item_name='A', unit_price=100, quantity=1, subtotal=100)
        OrderItem.objects.create(order=o, menu_item=a, item_name='A', unit_price=100, quantity=2, subtotal=200)
        OrderItem.objects.create(order=o, menu_item=b, item_name='B', unit_price=50, quantity=0, subtotal=0)
        OrderItem.objects.create(order=o, menu_item=b, item_name='B', unit_price=50, quantity=2, subtotal=999)

        apps = self.migrate(AFTER)
        OrderItem = apps.get_model('api', 'OrderItem')
        Order = apps.get_model('api', 'Order')
        rows = {r.menu_item_id: r for r in OrderItem.objects.all()}
        self.assertEqual(len(rows), 2)
        self.assertEqual((rows[a.id].quantity, rows[a.id].subtotal), (3, 300))   # 1 + 2 fusionnées
        self.assertEqual((rows[b.id].quantity, rows[b.id].subtotal), (2, 100))   # ligne à 0 supprimée, sous-total recalculé
        self.assertEqual(Order.objects.get(order_ref='BMC-0001').total_amount, 400)  # montant facturé inchangé
