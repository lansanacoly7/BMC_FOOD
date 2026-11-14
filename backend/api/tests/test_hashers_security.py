"""
Tests de sécurité des hashers de mot de passe (Point 5 du correctif).
Vérifie que le hasher de développement accéléré (10 000 itérations)
ne peut JAMAIS être actif en production (DEBUG=False).
"""
import importlib
import os
import sys
from unittest.mock import patch

from django.contrib.auth.hashers import PBKDF2PasswordHasher
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, override_settings

from api.hashers import DevFastPBKDF2PasswordHasher


class PasswordHasherSecurityTests(SimpleTestCase):
    def test_dev_hasher_refuses_encoding_when_debug_false(self):
        """DevFastPBKDF2PasswordHasher lève une ImproperlyConfigured en production hors tests."""
        hasher = DevFastPBKDF2PasswordHasher()
        with override_settings(DEBUG=False, TESTING=False):
            with patch.object(sys, 'argv', ['manage.py', 'runserver']):
                with self.assertRaises(ImproperlyConfigured):
                    hasher.encode("secret_password", "some_salt")

    def test_production_hashers_setting_excludes_dev_fast_hasher(self):
        """
        Quand DJANGO_DEBUG est désactivé (production), la configuration
        PASSWORD_HASHERS ne contient pas DevFastPBKDF2PasswordHasher.
        """
        test_env = {
            "DJANGO_DEBUG": "0",
            "DJANGO_SECRET_KEY": "test-prod-key-never-used-in-real-production",
            "DJANGO_ALLOWED_HOSTS": "example.com",
        }
        with patch.dict(os.environ, test_env):
            import bmc_backend.settings as bmc_settings
            importlib.reload(bmc_settings)
            try:
                self.assertFalse(bmc_settings.DEBUG)
                self.assertNotIn(
                    "api.hashers.DevFastPBKDF2PasswordHasher",
                    bmc_settings.PASSWORD_HASHERS,
                    "DevFastPBKDF2PasswordHasher est présent dans PASSWORD_HASHERS alors que DEBUG=False !"
                )
            finally:
                # Restaurer le module settings à son état de test d'origine
                importlib.reload(bmc_settings)

    def test_standard_pbkdf2_iterations_in_production(self):
        """Le hasher standard PBKDF2 de production possède au moins 100 000 itérations."""
        standard_hasher = PBKDF2PasswordHasher()
        self.assertGreaterEqual(
            standard_hasher.iterations,
            100000,
            "Le hasher PBKDF2 officiel de production doit comporter au moins 100 000 itérations."
        )
