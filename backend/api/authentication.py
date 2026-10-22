"""
Authentification personnalisée avec expiration configurable (I16).

Permet de limiter la durée de vie des jetons d'administration générés par DRF authtoken.
La durée de vie est configurable via la variable d'environnement `BMC_TOKEN_TTL_SECONDS`
ou le paramètre Django `BMC_TOKEN_TTL_SECONDS`.
Par défaut : 86 400 secondes (24 heures).
Si la valeur est <= 0, l'expiration est désactivée.
"""
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


def get_token_ttl_seconds() -> int:
    """Retourne la durée de vie du jeton en secondes (configurable via env/settings)."""
    return getattr(settings, 'BMC_TOKEN_TTL_SECONDS', 24 * 3600)


class ExpiringTokenAuthentication(TokenAuthentication):
    """
    Jeton d'authentification DRF avec vérification d'expiration.

    Si le jeton a dépassé sa durée de validité (par rapport à sa date de création),
    il est supprimé et une exception `AuthenticationFailed` (401) est levée.
    """

    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)

        ttl_seconds = get_token_ttl_seconds()
        if ttl_seconds > 0:
            now = timezone.now()
            if token.created < now - timedelta(seconds=ttl_seconds):
                # Supprimer le jeton expiré pour forcer une réauthentification via StaffTokenView
                token.delete()
                raise AuthenticationFailed("Le jeton d'authentification a expiré. Veuillez vous reconnecter.")

        return user, token
