"""Commande d'initialisation sécurisée du premier compte administrateur depuis l'environnement."""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Crée un premier superutilisateur uniquement si aucun compte staff n'existe et que
    BMC_BOOTSTRAP_ADMIN_PASSWORD est fourni par l'environnement (aucun secret dans le code).
    """

    help = "Initialise un premier compte staff depuis BMC_BOOTSTRAP_ADMIN_USER/PASSWORD si absent."

    def handle(self, *args, **options):
        User = get_user_model()
        if User.objects.filter(is_staff=True).exists():
            self.stdout.write("Compte staff déjà présent : aucune création nécessaire.")
            return

        password = (os.environ.get("BMC_BOOTSTRAP_ADMIN_PASSWORD") or "").strip()
        if not password:
            self.stdout.write("BMC_BOOTSTRAP_ADMIN_PASSWORD non défini : bootstrap ignoré.")
            return

        username = (os.environ.get("BMC_BOOTSTRAP_ADMIN_USER") or "admin").strip() or "admin"
        email = (os.environ.get("BMC_BOOTSTRAP_ADMIN_EMAIL") or "").strip()

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Compte administrateur initial '{username}' créé."))
