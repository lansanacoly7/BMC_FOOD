"""Tests de la commande de révocation globale des jetons d'authentification."""

from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from rest_framework.authtoken.models import Token


class RevokeAllTokensCommandTests(TestCase):
    """Vérifie la sécurité et l'exécution de `manage.py revoke_all_tokens`."""

    def setUp(self):
        User = get_user_model()
        self.staff_user = User.objects.create_user(
            username="staff_test",
            password="MotDePasseTest!123",
            is_staff=True,
        )
        self.customer_user = User.objects.create_user(
            username="client_test",
            password="MotDePasseTest!123",
            is_staff=False,
        )
        Token.objects.create(user=self.staff_user)
        Token.objects.create(user=self.customer_user)

    def test_requires_yes_flag_and_preserves_tokens_without_confirmation(self):
        """Sans --yes, aucun jeton ne doit être supprimé."""
        with self.assertRaises(CommandError) as ctx:
            call_command("revoke_all_tokens")

        self.assertIn("--yes", str(ctx.exception))
        self.assertEqual(Token.objects.count(), 2)

    def test_revokes_all_tokens_when_confirmed_with_yes(self):
        """Avec --yes, tous les jetons (staff et client) sont supprimés et comptés."""
        out = StringIO()
        call_command("revoke_all_tokens", yes=True, stdout=out)

        self.assertEqual(Token.objects.count(), 0)
        self.assertIn("2 jeton(s)", out.getvalue())

    def test_revokes_when_no_token_exists_is_idempotent(self):
        """Relancer avec 0 jeton actif réussit proprement avec un compte à 0."""
        Token.objects.all().delete()
        out = StringIO()

        call_command("revoke_all_tokens", yes=True, stdout=out)

        self.assertEqual(Token.objects.count(), 0)
        self.assertIn("0 jeton(s)", out.getvalue())
