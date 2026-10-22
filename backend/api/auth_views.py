"""
Authentification de l'administration (I7).

Stratégie validée (D1) : jeton DRF (`Authorization: Token <jeton>`) pour un compte
staff Django ; les endpoints d'administration exigent `IsAdminUser`. Aucun compte
n'est créé par le code : créer un compte staff avec
`python manage.py createsuperuser`.
"""
from drf_spectacular.utils import extend_schema
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from datetime import timedelta
from django.utils import timezone
from .api_schemas import AuthTokenRequestSerializer, AuthTokenResponseSerializer, ErrorEnvelopeSerializer
from .authentication import get_token_ttl_seconds


class StaffTokenView(ObtainAuthToken):
    """Échange identifiant + mot de passe d'un compte staff contre un jeton d'API (I7, I16)."""
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'  # limite de tentatives (protection contre la force brute)

    @extend_schema(
        request=AuthTokenRequestSerializer,
        responses={
            200: AuthTokenResponseSerializer,
            400: ErrorEnvelopeSerializer,
            403: ErrorEnvelopeSerializer,
            429: ErrorEnvelopeSerializer,
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        if not user.is_staff:
            raise PermissionDenied("Ce compte n'a pas accès à l'administration.")

        token, created = Token.objects.get_or_create(user=user)
        ttl = get_token_ttl_seconds()
        if not created and ttl > 0:
            if token.created < timezone.now() - timedelta(seconds=ttl):
                token.delete()
                token = Token.objects.create(user=user)

        return Response({'success': True, 'token': token.key, 'username': user.get_username()})

