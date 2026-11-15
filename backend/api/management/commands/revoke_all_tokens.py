"""Commande Django pour révoquer l'ensemble des jetons d'authentification DRF."""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    """Supprime tous les jetons DRF actifs après confirmation explicite (--yes)."""

    help = (
        "Révoque tous les jetons d'authentification existants (staff et clients). "
        "Nécessite --yes pour confirmer l'opération."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Confirme la suppression de tous les jetons d'authentification actifs.",
        )

    def handle(self, *args, **options):
        total = Token.objects.count()
        if not options.get("yes"):
            raise CommandError(
                f"Opération annulée : {total} jeton(s) actif(s) conservé(s). "
                "Relancez avec --yes pour confirmer la révocation globale."
            )

        with transaction.atomic():
            _, per_model = Token.objects.all().delete()
        revoked = per_model.get(Token._meta.label, 0)

        self.stdout.write(
            self.style.SUCCESS(
                f"Révocation terminée : {revoked} jeton(s) d'authentification supprimé(s)."
            )
        )
