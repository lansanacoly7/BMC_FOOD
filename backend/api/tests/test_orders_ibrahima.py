"""Tests des tâches d'Ibrahima : I2 (contraintes), I3 (création), I4 (liste/détail/statut), I7 (accès/token).

Auth réelle par jeton (pas de force_authenticate). Les collisions de référence sont
simulées (SQLite ne permet pas de test de concurrence fiable).
"""
from unittest import mock

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from api import order_rules
from api.models import Category, MenuItem, Order, OrderItem

PW = "pw-test-12345"


class BaseCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cat = Category.objects.create(name="Tacos", slug="tacos")
        cls.cat = cat
        cls.tp1 = MenuItem.objects.create(category=cat, code="tp-1", name="Tacos viande pané", price=3500)
        cls.bg1 = MenuItem.objects.create(category=cat, code="bg-1", name="Burger complet", price=2000)
        cls.off = MenuItem.objects.create(category=cat, code="off-1", name="Indispo", price=1000, is_available=False)
        U = get_user_model()
        cls.staff = U.objects.create_user("chef", password=PW, is_staff=True)
        cls.plain = U.objects.create_user("client", password=PW)

    def setUp(self):
        self.anon = APIClient()
        self.admin = APIClient()
        self.admin.credentials(HTTP_AUTHORIZATION="Token " + Token.objects.create(user=self.staff).key)

    def payload(self, items, **kw):
        d = {"customer_name": "Test Client", "phone": "771067575", "address": "Ngor, Dakar",
             "payment_method": "wave", "items": items}
        d.update(kw)
        return d

    def post(self, items, **kw):
        return self.anon.post("/api/orders/", self.payload(items, **kw), format="json")

    def make_order(self, **kw):
        return self.post([{"id": "bg-1", "quantity": 1}], **kw).json()["order"]["order_ref"]


class CreateOrderTests(BaseCase):
    def test_creation_valide_calcule_le_total_cote_serveur(self):
        r = self.post([{"id": "tp-1", "quantity": 2}, {"id": "bg-1", "quantity": 1}])
        self.assertEqual(r.status_code, 201, r.content)
        o = r.json()["order"]
        self.assertEqual(o["total_amount"], 9000)
        self.assertRegex(o["order_ref"], r"^BMC-\d{4}$")
        self.assertEqual(o["payment_status"], "pending")  # wave

    def test_prix_et_total_falsifies_sont_ignores(self):
        r = self.post([{"id": "tp-1", "quantity": 1, "price": 1, "unit_price": 1, "subtotal": 1}],
                      total_amount=1, price=1)
        self.assertEqual(r.status_code, 201, r.content)
        o = r.json()["order"]
        self.assertEqual(o["total_amount"], 3500)
        self.assertEqual(o["items"][0]["unit_price"], 3500)

    def test_paniers_invalides_refuses_sans_creer_de_commande(self):
        cas = {
            "panier vide": [],
            "article inconnu": [{"id": "zz-9", "quantity": 1}],
            "article indisponible": [{"id": "off-1", "quantity": 1}],
            "quantité 0": [{"id": "tp-1", "quantity": 0}],
            "quantité négative": [{"id": "tp-1", "quantity": -3}],
            "quantité 1.5": [{"id": "tp-1", "quantity": 1.5}],
            "quantité 2.0": [{"id": "tp-1", "quantity": 2.0}],
            "quantité chaîne": [{"id": "tp-1", "quantity": "2"}],
            "quantité booléenne": [{"id": "tp-1", "quantity": True}],
            "quantité 21": [{"id": "tp-1", "quantity": 21}],
        }
        for nom, items in cas.items():
            with self.subTest(nom):
                avant = Order.objects.count()
                r = self.post(items)
                body = r.json()
                self.assertEqual(r.status_code, 400, body)
                self.assertIs(body["success"], False)
                self.assertIn("error", body)
                self.assertIn("errors", body)
                self.assertEqual(Order.objects.count(), avant)

    def test_doublons_fusionnes_puis_maximum_verifie(self):
        r = self.post([{"id": "tp-1", "quantity": 15}, {"id": "tp-1", "quantity": 10}])
        self.assertEqual(r.status_code, 400, r.content)
        r = self.post([{"id": "tp-1", "quantity": 2}, {"id": str(self.tp1.id), "quantity": 3},
                       {"id": "tp-1", "quantity": 1}])
        o = r.json()["order"]
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(len(o["items"]), 1)
        self.assertEqual(o["items"][0]["quantity"], 6)
        self.assertEqual(o["total_amount"], 21000)

    def test_plus_de_30_lignes_distinctes_refuse(self):
        many = [MenuItem.objects.create(category=self.cat, code=f"x-{i}", name=f"X{i}", price=100)
                for i in range(31)]
        r = self.post([{"id": m.code, "quantity": 1} for m in many])
        self.assertEqual(r.status_code, 400, r.content)

    def test_champ_client_invalide_et_corps_non_objet(self):
        r = self.post([{"id": "tp-1", "quantity": 1}], customer_name="")
        self.assertEqual(r.status_code, 400)
        self.assertIn("customer_name", r.json()["errors"])
        self.assertEqual(self.anon.post("/api/orders/", [1, 2], format="json").status_code, 400)

    def test_collision_de_reference_retentee(self):
        existing = self.make_order()
        seq = iter([existing, existing, existing, "BMC-9999"])
        with mock.patch.object(order_rules, "generate_order_ref", lambda: next(seq)):
            r = self.post([{"id": "bg-1", "quantity": 1}])
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["order"]["order_ref"], "BMC-9999")

    def test_references_epuisees_donnent_503_sans_commande(self):
        existing = self.make_order()
        n = Order.objects.count()
        with mock.patch.object(order_rules, "generate_order_ref", lambda: existing):
            r = self.post([{"id": "bg-1", "quantity": 1}])
        self.assertEqual(r.status_code, 503, r.content)
        self.assertIs(r.json()["success"], False)
        self.assertEqual(Order.objects.count(), n)

    def test_atomicite_rollback_si_echec_sur_les_lignes(self):
        n = Order.objects.count()
        with mock.patch("api.serializers.OrderItem.objects.bulk_create", side_effect=RuntimeError("boom")):
            with self.assertRaises(RuntimeError):
                self.post([{"id": "bg-1", "quantity": 1}])
        self.assertEqual(Order.objects.count(), n)


class ConstraintTests(BaseCase):
    def _order(self):
        return Order.objects.get(order_ref=self.make_order())

    def test_contraintes_base_de_donnees(self):
        o = self._order()
        for label, kw in [("quantité 0", dict(quantity=0, unit_price=10, subtotal=0)),
                          ("sous-total incohérent", dict(quantity=2, unit_price=10, subtotal=999))]:
            with self.subTest(label), self.assertRaises(IntegrityError), transaction.atomic():
                OrderItem.objects.create(order=o, menu_item=self.off, item_name="x", **kw)

    def test_deux_lignes_du_meme_article_refusees(self):
        o = Order.objects.create(order_ref="BMC-0001", customer_name="a", phone="1", address="a",
                                 payment_method="cash", total_amount=7000)
        kw = dict(order=o, menu_item=self.tp1, item_name="a", unit_price=3500, quantity=1, subtotal=3500)
        OrderItem.objects.create(**kw)
        with self.assertRaises(IntegrityError), transaction.atomic():
            OrderItem.objects.create(**kw)


class AccessTests(BaseCase):
    def test_anonyme_refuse_401_sur_routes_admin(self):
        ref = self.make_order()
        cas = [("get", "/api/orders/", None), ("get", f"/api/orders/{ref}/", None),
               ("patch", f"/api/orders/{ref}/status/", {"status": "confirmed"}),
               ("patch", f"/api/daily-special/{self.tp1.id}/toggle/", {}),
               ("get", "/api/orders/events/unnotified/", None),
               ("post", "/api/orders/events/unnotified/", {})]
        for method, url, body in cas:
            with self.subTest(f"{method} {url}"):
                c = getattr(self.anon, method)
                r = c(url, body, format="json") if body is not None else c(url)
                self.assertEqual(r.status_code, 401)
                self.assertIs(r.json()["success"], False)

    def test_routes_publiques(self):
        for url in ("/api/health/", "/api/menu/", "/api/daily-special/"):
            with self.subTest(url):
                self.assertEqual(self.anon.get(url).status_code, 200)

    def test_jeton_invalide_nempeche_pas_le_menu(self):
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION="Token invalide")
        self.assertEqual(c.get("/api/menu/").status_code, 200)

    def test_token_reel_staff_ok_nonstaff_refuse(self):
        r = self.anon.post("/api/auth/token/", {"username": "client", "password": PW}, format="json")
        self.assertEqual(r.status_code, 403, r.content)
        r = self.anon.post("/api/auth/token/", {"username": "chef", "password": "mauvais"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIs(r.json()["success"], False)
        r = self.anon.post("/api/auth/token/", {"username": "chef", "password": PW}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION="Token " + r.json()["token"])
        self.assertEqual(c.get("/api/orders/").status_code, 200)

    def test_nonstaff_avec_jeton_403(self):
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION="Token " + Token.objects.create(user=self.plain).key)
        self.assertEqual(c.get("/api/orders/").status_code, 403)

    def test_detail_liste_filtre_staff(self):
        ref = self.make_order()
        self.assertEqual(self.admin.get(f"/api/orders/{ref}/").status_code, 200)
        r = self.admin.get("/api/orders/BMC-0000/")
        self.assertEqual(r.status_code, 404)
        self.assertEqual(r.json()["code"], "not_found")
        self.assertEqual(self.admin.get("/api/orders/?status=pending").status_code, 200)
        r = self.admin.get("/api/orders/?status=nimportequoi")
        self.assertEqual(r.status_code, 400)
        self.assertIn("status", r.json()["errors"])

    def test_limitation_de_debit_sur_token(self):
        # le throttle utilise le cache : on repart d'un cache vide
        from django.core.cache import cache
        cache.clear()
        codes = [APIClient().post("/api/auth/token/", {"username": "x", "password": "y"}, format="json").status_code
                 for _ in range(15)]
        self.assertIn(429, codes)
        cache.clear()


class StatusTransitionTests(BaseCase):
    def patch(self, ref, body):
        return self.admin.patch(f"/api/orders/{ref}/status/", body, format="json")

    def test_chaine_complete_puis_final(self):
        ref = self.make_order(payment_method="cash")
        self.assertEqual(Order.objects.get(order_ref=ref).payment_status, "unpaid")
        for st in ("confirmed", "preparing", "delivering", "delivered"):
            r = self.patch(ref, {"status": st})
            self.assertEqual(r.status_code, 200, r.content)
            self.assertEqual(r.json()["order"]["status"], st)
        for refuse in ("pending", "cancelled"):
            r = self.patch(ref, {"status": refuse})
            self.assertEqual(r.status_code, 400, r.content)
        self.assertEqual(r.json()["success"], False)
        r = self.patch(ref, {"status": "delivered"})
        self.assertEqual(r.status_code, 200)
        self.assertIn("Aucun changement", r.json()["message"])

    def test_saut_refuse_et_entrees_invalides(self):
        ref = self.make_order(payment_method="cash")
        r = self.patch(ref, {"status": "preparing"})
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Order.objects.get(order_ref=ref).status, "pending")
        for body in ({"status": "xyz"}, {"status": 5}, {"payment_status": "nope"}, {}, [1]):
            with self.subTest(body):
                self.assertEqual(self.patch(ref, body).status_code, 400)
        self.assertEqual(self.patch("BMC-0000", {"status": "confirmed"}).status_code, 404)

    def test_tout_ou_rien_statut_et_paiement(self):
        ref = self.make_order(payment_method="cash")
        r = self.patch(ref, {"status": "confirmed", "payment_status": "pending"})
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()["order"]["payment_status"], "pending")
        r = self.patch(ref, {"status": "preparing", "payment_status": "unpaid"})
        cur = Order.objects.get(order_ref=ref)
        self.assertEqual(r.status_code, 400)
        self.assertEqual((cur.status, cur.payment_status), ("confirmed", "pending"))

    def test_paiement_pending_paid_final_et_annulation(self):
        ref = self.make_order(payment_method="cash")
        self.patch(ref, {"status": "confirmed", "payment_status": "pending"})
        self.assertEqual(self.patch(ref, {"payment_status": "paid"}).status_code, 200)
        self.assertEqual(self.patch(ref, {"payment_status": "unpaid"}).status_code, 400)
        self.assertEqual(self.patch(ref, {"status": "cancelled"}).status_code, 200)
        self.assertEqual(self.patch(ref, {"status": "confirmed"}).status_code, 400)

    def test_especes_payees_apres_livraison(self):
        ref = self.make_order(payment_method="cash")
        for st in ("confirmed", "preparing", "delivering", "delivered"):
            self.patch(ref, {"status": st})
        self.assertEqual(self.patch(ref, {"payment_status": "paid"}).status_code, 200)

    def test_unicite_des_references(self):
        for _ in range(5):
            self.make_order()
        refs = list(Order.objects.values_list("order_ref", flat=True))
        self.assertEqual(len(refs), len(set(refs)))
