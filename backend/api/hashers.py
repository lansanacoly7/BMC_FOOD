import sys
from django.conf import settings
from django.contrib.auth.hashers import PBKDF2PasswordHasher
from django.core.exceptions import ImproperlyConfigured


class DevFastPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """
    Hasher PBKDF2 avec nombre d'itérations réduit (10 000) pour accélérer
    les tests et l'authentification en développement local (évite les blocages CPU sous Windows).
    Interdit strictement en production (DEBUG=False).
    """
    iterations = 10000

    def encode(self, password, salt, iterations=None):
        is_testing = getattr(settings, 'TESTING', False) or ('test' in sys.argv)
        if not getattr(settings, 'DEBUG', False) and not is_testing:
            raise ImproperlyConfigured(
                "DevFastPBKDF2PasswordHasher est strictement interdit en production (DEBUG=False)."
            )
        return super().encode(password, salt, iterations=iterations or self.iterations)
