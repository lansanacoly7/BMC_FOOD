import re
from io import StringIO
from django.core.management import call_command
from django.test import TestCase
from api.models import Category, MenuItem


class SeedBmcCommandTests(TestCase):
    """
    Tests de validation pour les exigences P10 (seed non-destructif et drapeau --reset)
    et P12 (format des URLs d'images et unicité des slugs).
    """

    def setUp(self):
        Category.objects.all().delete()
        MenuItem.objects.all().delete()

    def test_seed_creates_official_catalog(self):
        """Vérifie que le seed peuple fidèlement les 7 catégories et 32 articles officiels."""
        out = StringIO()
        call_command('seed_bmc', reset=True, stdout=out)

        self.assertEqual(Category.objects.count(), 7)
        self.assertEqual(MenuItem.objects.count(), 32)

        special = MenuItem.objects.filter(is_daily_special=True)
        self.assertEqual(special.count(), 1)
        self.assertEqual(special.first().code, 'trp-3')

    def test_seed_image_url_format_and_slug_uniqueness(self):
        """
        Validation P12 :
        1. Chaque article possède une URL d'image renseignée.
        2. Format strictement conforme à : /images/products/<slug>.webp.
        3. Tous les slugs d'images sont 100% uniques sans collision.
        """
        call_command('seed_bmc', reset=True, stdout=StringIO())

        items = MenuItem.objects.all()
        self.assertEqual(items.count(), 32)

        image_pattern = re.compile(r"^/images/products/([a-z0-9\-]+)\.webp$")
        seen_slugs = set()

        for item in items:
            self.assertTrue(item.image_url, f"L'article {item.code} n'a pas d'image_url")
            match = image_pattern.match(item.image_url)
            self.assertIsNotNone(
                match,
                f"L'URL {item.image_url} de l'article {item.code} ne respecte pas le format /images/products/<slug>.webp"
            )
            slug = match.group(1)
            self.assertNotIn(
                slug,
                seen_slugs,
                f"Collision de slug détectée sur {slug} pour l'article {item.code}"
            )
            seen_slugs.add(slug)

        self.assertEqual(len(seen_slugs), 32)

    def test_seed_non_destructive_preserves_admin_modifications(self):
        """
        Validation P10 :
        En l'absence de l'option --reset, relancer le seed NE DOIT PAS écraser :
        - le prix modifié
        - la description personnalisée
        - la disponibilité (mise hors stock)
        - le statut de plat du jour défini par l'admin
        """
        call_command('seed_bmc', reset=True, stdout=StringIO())

        # Modification manuelle simulant des actions de l'administrateur
        item = MenuItem.objects.get(code='tp-1')
        item.price = 9999
        item.description = "Recette secrète modifiée par le chef"
        item.is_available = False
        item.is_daily_special = True
        item.save()

        # Un autre article dont le statut de plat du jour a été retiré
        trp3 = MenuItem.objects.get(code='trp-3')
        trp3.is_daily_special = False
        trp3.save()

        # Exécution du seed SANS --reset
        call_command('seed_bmc', stdout=StringIO())

        # Vérification de la persistance stricte
        item.refresh_from_db()
        self.assertEqual(item.price, 9999, "Le prix personnalisé a été écrasé !")
        self.assertEqual(item.description, "Recette secrète modifiée par le chef")
        self.assertFalse(item.is_available, "La disponibilité hors-stock a été écrasée !")
        self.assertTrue(item.is_daily_special, "Le statut Plat du Jour a été écrasé !")

        trp3.refresh_from_db()
        self.assertFalse(trp3.is_daily_special, "Le désengagement du plat du jour a été écrasé !")

    def test_seed_reset_restores_initial_catalog(self):
        """
        Validation P10 :
        Lorsque --reset est explicitement passé, le catalogue est réinitialisé aux valeurs
        par défaut d'origine.
        """
        call_command('seed_bmc', reset=True, stdout=StringIO())

        item = MenuItem.objects.get(code='tp-1')
        item.price = 9999
        item.description = "Modifié"
        item.is_available = False
        item.save()

        # Exécution avec --reset
        call_command('seed_bmc', reset=True, stdout=StringIO())

        item.refresh_from_db()
        self.assertEqual(item.price, 3500)
        self.assertEqual(item.description, "Viande hachée assaisonnée, frites croustillantes, sauce fromagère maison et panure dorée.")
        self.assertTrue(item.is_available)
