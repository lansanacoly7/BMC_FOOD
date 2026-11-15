from rest_framework.throttling import ScopedRateThrottle


class ProxiedScopedRateThrottle(ScopedRateThrottle):
    """
    Limitation de débit tenant compte de l'en-tête X-Forwarded-For
    derrière un reverse-proxy / load-balancer (Tâche 10).
    Extrait l'adresse IP originale du client.
    """

    def get_ident(self, request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        if xff:
            # L'adresse client réelle est la première IP de la chaîne X-Forwarded-For
            return xff.split(',')[0].strip()
        return super().get_ident(request)
