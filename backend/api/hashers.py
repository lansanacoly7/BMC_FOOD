from django.contrib.auth.hashers import PBKDF2PasswordHasher

class DevFastPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """Hasher PBKDF2 avec nombre d'itérations adapté au développement local rapide."""
    iterations = 10000
