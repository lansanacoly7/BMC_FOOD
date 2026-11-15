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
        from django.core.cache import cache
        cache.clear()
        self.anon = APIClient()
        self.admin = APIClient()
        self.admin.credentials(HTTP_AUTHORIZATION="Token " + Token.objects.create(user=self.staff).key)

    def tearDown(self):
        from django.core.cache import cache
        cache.clear()

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
        self.assertRegex(o["order_ref"], fr"^BMC-\d{{{order_rules.ORDER_REF_DIGITS}}}$")
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
        seq = iter([existing, existing, existing, "BMC-999999"])
        with mock.patch.object(order_rules, "generate_order_ref", lambda: next(seq)):
            r = self.post([{"id": "bg-1", "quantity": 1}])
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["order"]["order_ref"], "BMC-999999")

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
        self.assertEqual(r.json()["errors"]["detail"], [r.json()["error"]])
        self.assertEqual(self.admin.get("/api/orders/?status=pending").status_code, 200)
        r = self.admin.get("/api/orders/?status=nimportequoi")
        self.assertEqual(r.status_code, 400)
        self.assertIn("status", r.json()["errors"])

    def test_limitation_de_debit_sur_token(self):
        # le throttle utilise le cache : on repart d'un cache vide
        from django.core.cache import cache
        cache.clear()
        codes = [APIClient().post("/api/auth/token/", {"username": "x", "password": "y"}, format="json").status_code
                 for _ in range(65)]
        self.assertIn(429, codes)
        cache.clear()

    def test_limitation_de_debit_sur_order_create(self):
        """Critère I15 : Rejet 429 au-delà du seuil configuré sur POST /api/orders/."""
        from django.core.cache import cache
        cache.clear()
        # Seuil par défaut : 15 requêtes/minute
        codes = [self.post([{"id": "bg-1", "quantity": 1}]).status_code for _ in range(18)]
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
        # Sans cancel_reason, l'annulation admin est refusée (400)
        r_no_reason = self.patch(ref, {"status": "cancelled"})
        self.assertEqual(r_no_reason.status_code, 400)
        self.assertIn("cancel_reason", r_no_reason.json()["errors"])
        # Avec cancel_reason, l'annulation admin réussit (200)
        self.assertEqual(
            self.patch(ref, {"status": "cancelled", "cancel_reason": "Rupture de stock"}).status_code,
            200,
        )
        # Règle X4 / I14 : Commande annulée alors qu'elle était payée -> bascule automatique à refund_pending
        order_db = Order.objects.get(order_ref=ref)
        self.assertEqual(order_db.payment_status, "refund_pending")
        self.assertEqual(order_db.cancel_reason, "Rupture de stock")
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

    # --- I13 & X2 : Suivi de commande client minimal -------------------------
    def test_order_tracking_minimal_no_personal_data_200(self):
        """Critère I13 & X2 : Endpoint public sans aucune donnée personnelle."""
        ref = self.make_order()
        r = self.anon.get(f"/api/orders/track/{ref}/")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["order_ref"], ref)
        self.assertIn("status", data)
        self.assertIn("status_label", data)
        self.assertIn("payment_status", data)
        self.assertIn("total_amount", data)
        self.assertIn("items", data)
        self.assertIn("items_count", data)

        # Exclusion stricte de toute donnée personnelle (RGPD / Confidentialité)
        self.assertNotIn("customer_name", data)
        self.assertNotIn("phone", data)
        self.assertNotIn("address", data)
        self.assertNotIn("notes", data)

    def test_order_tracking_unknown_ref_fails_404_uniform(self):
        """Critère I13 : Référence inconnue renvoie un 404 uniforme anti-énumération."""
        r = self.anon.get("/api/orders/track/BMC-000000/")
        self.assertEqual(r.status_code, 404)
        self.assertFalse(r.json()["success"])

    # --- I18 : Pagination de la liste des commandes --------------------------
    def test_orders_pagination_page_and_page_size(self):
        """Critère I18 : Pagination ?page=&page_size= avec count préservé."""
        for _ in range(5):
            self.make_order()
        r = self.admin.get("/api/orders/?page=1&page_size=2")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["page_size"], 2)
        self.assertEqual(len(data["orders"]), 2)
        self.assertTrue(data["count"] >= 5)
        self.assertTrue(data["total_pages"] >= 3)


class OrderV1RulesTests(BaseCase):
    """Tests des règles métier V1 (docs/taches_v1.md — section 2, Ibrahima Khalilou Diallo)."""

    def test_v1_delivery_order_calculates_fee_and_total(self):
        """Mode livraison avec quartier connu : frais ajoutés au sous-total et has_allergy enregistré."""
        r = self.post(
            [{"id": "tp-1", "quantity": 2}],
            order_type="delivery",
            delivery_area="grand-yoff",
            address="Rue 10, en face de la pharmacie",
            has_allergy=True,
            notes="Allergie arachide",
        )
        self.assertEqual(r.status_code, 201, r.content)
        o = r.json()["order"]
        self.assertEqual(o["order_type"], "delivery")
        self.assertEqual(o["delivery_area"], "grand-yoff")
        self.assertEqual(o["delivery_fee"], 1000)
        self.assertEqual(o["subtotal"], 7000)
        self.assertEqual(o["total_amount"], 8000)
        self.assertIs(o["has_allergy"], True)
        self.assertEqual(o["cancel_reason"], "")

    def test_v1_delivery_zones_fees_and_distant_null_fee(self):
        """Vérifie la grille par quartier (zones 1 à 9) et le cas 'autre-destination-plus-eloignee' (fee=None)."""
        cas = [
            ("cite-mixta", 1000, 4500),
            ("liberte-6", 1500, 5000),
            ("parcelles-assainies", 1500, 5000),
            ("camberene", 2000, 5500),
            ("sacre-c-ur", 2000, 5500),
            ("sacre-coeur", 2000, 5500),
            ("almadies", 2500, 6000),
            ("gueule-tapee", 2500, 6000),
            ("pikine", 3000, 6500),
            ("keur-massar", 3000, 6500),
            ("rufisque", 3500, 7000),
            ("bargny", 3500, 7000),
            ("sebikotane", 4000, 7500),
            ("autre-destination-plus-eloignee", None, 3500),
        ]
        for slug, expected_fee, expected_total in cas:
            with self.subTest(slug=slug):
                from django.core.cache import cache
                cache.clear()
                r = self.post(
                    [{"id": "tp-1", "quantity": 1}],
                    order_type="delivery",
                    delivery_area=slug,
                    address="Quartier test, Dakar",
                )
                self.assertEqual(r.status_code, 201, r.content)
                o = r.json()["order"]
                self.assertEqual(o["subtotal"], 3500)
                self.assertEqual(o["delivery_fee"], expected_fee)
                self.assertEqual(o["total_amount"], expected_total)

    def test_v1_delivery_ignores_client_supplied_delivery_fee(self):
        """Le serveur ignore tout frais de livraison ou sous-total envoyé par le client."""
        r = self.post(
            [{"id": "tp-1", "quantity": 1}],
            order_type="delivery",
            delivery_area="almadies",
            address="Almadies Zone 12",
            delivery_fee=0,
            subtotal=100,
            total_amount=100,
        )
        self.assertEqual(r.status_code, 201, r.content)
        o = r.json()["order"]
        self.assertEqual(o["subtotal"], 3500)
        self.assertEqual(o["delivery_fee"], 2500)
        self.assertEqual(o["total_amount"], 6000)

    def test_v1_delivery_unknown_or_missing_area_and_address_fail_400(self):
        """En livraison : quartier inconnu, quartier manquant ou adresse manquante -> 400."""
        # Quartier inconnu
        r_unknown = self.post(
            [{"id": "tp-1", "quantity": 1}],
            order_type="delivery",
            delivery_area="quartier-imaginaire",
            address="Rue 10",
        )
        self.assertEqual(r_unknown.status_code, 400)
        self.assertIn("delivery_area", r_unknown.json()["errors"])

        # Quartier manquant lorsque order_type='delivery'
        r_missing_area = self.post(
            [{"id": "tp-1", "quantity": 1}],
            order_type="delivery",
            address="Rue 10",
        )
        self.assertEqual(r_missing_area.status_code, 400)
        self.assertIn("delivery_area", r_missing_area.json()["errors"])

        # Adresse manquante en mode livraison
        r_missing_addr = self.post(
            [{"id": "tp-1", "quantity": 1}],
            order_type="delivery",
            delivery_area="grand-yoff",
            address="",
        )
        self.assertEqual(r_missing_addr.status_code, 400)
        self.assertIn("address", r_missing_addr.json()["errors"])

    def test_v1_pickup_order_does_not_require_address_or_delivery_area(self):
        """En mode à emporter ('pickup'), l'adresse et le quartier sont facultatifs et delivery_fee vaut 0."""
        payload = {
            "customer_name": "Moussa Diop",
            "phone": "77 123 45 67",
            "order_type": "pickup",
            "payment_method": "cash",
            "items": [{"id": "bg-1", "quantity": 2}],
        }
        r = self.anon.post("/api/orders/", payload, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        o = r.json()["order"]
        self.assertEqual(o["order_type"], "pickup")
        self.assertEqual(o["address"], "")
        self.assertEqual(o["delivery_area"], "")
        self.assertEqual(o["delivery_fee"], 0)
        self.assertEqual(o["subtotal"], 4000)
        self.assertEqual(o["total_amount"], 4000)
        self.assertIs(o["has_allergy"], False)

    def test_v1_idempotency_key_prevents_duplicate_orders(self):
        """Un même en-tête Idempotency-Key ne crée qu'une seule commande (2e appel -> 200 OK avec la même commande)."""
        key = "550e8400-e29b-41d4-a716-446655440000"
        body = self.payload(
            [{"id": "tp-1", "quantity": 1}],
            order_type="delivery",
            delivery_area="grand-yoff",
        )
        before = Order.objects.count()

        r1 = self.anon.post("/api/orders/", body, format="json", HTTP_IDEMPOTENCY_KEY=key)
        self.assertEqual(r1.status_code, 201, r1.content)
        ref1 = r1.json()["order"]["order_ref"]
        self.assertEqual(Order.objects.count(), before + 1)

        r2 = self.anon.post("/api/orders/", body, format="json", HTTP_IDEMPOTENCY_KEY=key)
        self.assertEqual(r2.status_code, 200, r2.content)
        ref2 = r2.json()["order"]["order_ref"]
        self.assertEqual(ref1, ref2)
        self.assertEqual(Order.objects.count(), before + 1)

        # Une autre clé crée bien une nouvelle commande
        r3 = self.anon.post("/api/orders/", body, format="json", HTTP_IDEMPOTENCY_KEY="autre-cle-uuid")
        self.assertEqual(r3.status_code, 201, r3.content)
        self.assertNotEqual(r3.json()["order"]["order_ref"], ref1)
        self.assertEqual(Order.objects.count(), before + 2)

    def test_v1_tracking_includes_non_personal_fields_only(self):
        """GET /api/orders/track/<ref>/ inclut order_type, subtotal, delivery_fee et cancel_reason sans données personnelles."""
        r = self.post(
            [{"id": "tp-1", "quantity": 1}],
            order_type="delivery",
            delivery_area="grand-yoff",
            address="Cité Millionnaire",
        )
        ref = r.json()["order"]["order_ref"]

        track = self.anon.get(f"/api/orders/track/{ref}/")
        self.assertEqual(track.status_code, 200)
        data = track.json()
        self.assertEqual(data["order_ref"], ref)
        self.assertEqual(data["order_type"], "delivery")
        self.assertEqual(data["subtotal"], 3500)
        self.assertEqual(data["delivery_fee"], 1000)
        self.assertEqual(data["total_amount"], 4500)
        self.assertEqual(data["cancel_reason"], "")
        for forbidden in ("customer_name", "phone", "address", "notes"):
            self.assertNotIn(forbidden, data)

    def test_v1_client_cancel_only_when_pending_and_matching_phone(self):
        """POST /api/orders/<ref>/cancel/ : succès en pending avec bon téléphone, 400 si mauvais téléphone, 409 si plus en attente."""
        r = self.post(
            [{"id": "bg-1", "quantity": 1}],
            phone="77 106 75 75",
            order_type="pickup",
        )
        ref = r.json()["order"]["order_ref"]

        # Mauvais numéro -> 400
        r_bad_phone = self.anon.post(f"/api/orders/{ref}/cancel/", {"phone": "77 000 00 00"}, format="json")
        self.assertEqual(r_bad_phone.status_code, 400)
        self.assertIn("phone", r_bad_phone.json()["errors"])

        # Bon numéro (même formaté avec +221) -> 200 OK
        r_ok = self.anon.post(f"/api/orders/{ref}/cancel/", {"phone": "+221771067575"}, format="json")
        self.assertEqual(r_ok.status_code, 200, r_ok.content)
        self.assertEqual(r_ok.json()["order"]["status"], "cancelled")
        self.assertTrue(r_ok.json()["order"]["cancel_reason"])

        # Déjà annulée -> 409 Conflict
        r_again = self.anon.post(f"/api/orders/{ref}/cancel/", {"phone": "771067575"}, format="json")
        self.assertEqual(r_again.status_code, 409)

        # Commande déjà confirmée par la cuisine -> 409 Conflict
        ref2 = self.make_order(phone="77 106 75 75")
        self.admin.patch(f"/api/orders/{ref2}/status/", {"status": "confirmed"}, format="json")
        r_confirmed = self.anon.post(f"/api/orders/{ref2}/cancel/", {"phone": "77 106 75 75"}, format="json")
        self.assertEqual(r_confirmed.status_code, 409)
        self.assertEqual(Order.objects.get(order_ref=ref2).status, "confirmed")

    def test_v1_admin_confirm_payment_endpoint(self):
        """POST /api/admin/orders/<ref>/confirm-payment/ passe payment_status de pending/unpaid à paid."""
        ref_wave = self.make_order(payment_method="wave")
        self.assertEqual(Order.objects.get(order_ref=ref_wave).payment_status, "pending")

        # Anonyme refusé (401)
        self.assertEqual(self.anon.post(f"/api/admin/orders/{ref_wave}/confirm-payment/").status_code, 401)

        # Admin confirme le paiement Wave (pending -> paid)
        r_paid = self.admin.post(f"/api/admin/orders/{ref_wave}/confirm-payment/")
        self.assertEqual(r_paid.status_code, 200, r_paid.content)
        self.assertEqual(r_paid.json()["order"]["payment_status"], "paid")

        # Déjà payée -> 400
        self.assertEqual(self.admin.post(f"/api/admin/orders/{ref_wave}/confirm-payment/").status_code, 400)

        # Espèces (unpaid -> paid)
        ref_cash = self.make_order(payment_method="cash")
        self.assertEqual(Order.objects.get(order_ref=ref_cash).payment_status, "unpaid")
        r_cash = self.admin.post(f"/api/admin/orders/{ref_cash}/confirm-payment/")
        self.assertEqual(r_cash.status_code, 200, r_cash.content)
        self.assertEqual(r_cash.json()["order"]["payment_status"], "paid")
