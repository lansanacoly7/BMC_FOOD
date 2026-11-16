"""Tests unitaires pour la commande bootstrap_staff."""

import os
from io import StringIO
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase


class BootstrapStaffCommandTests(TestCase):
    def test_skips_when_password_not_configured(self):
        out = StringIO()
        with patch.dict(os.environ, {"BMC_BOOTSTRAP_ADMIN_PASSWORD": ""}, clear=False):
            call_command("bootstrap_staff", stdout=out)
        self.assertFalse(User.objects.filter(is_staff=True).exists())
        self.assertIn("ignoré", out.getvalue())

    def test_creates_superuser_once_when_missing(self):
        out = StringIO()
        with patch.dict(
            os.environ,
            {
                "BMC_BOOTSTRAP_ADMIN_USER": "gerant",
                "BMC_BOOTSTRAP_ADMIN_PASSWORD": "StrongTempPassword2026!",
            },
            clear=False,
        ):
            call_command("bootstrap_staff", stdout=out)
            self.assertTrue(User.objects.filter(username="gerant", is_staff=True, is_superuser=True).exists())

            # Un deuxième appel est sans effet et ne duplique pas ni ne réinitialise.
            out2 = StringIO()
            call_command("bootstrap_staff", stdout=out2)
            self.assertEqual(User.objects.filter(is_staff=True).count(), 1)
            self.assertIn("déjà présent", out2.getvalue())
