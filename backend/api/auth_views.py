"""
Authentification de l'administration (I7).

Stratégie validée (D1) : jeton DRF (`Authorization: Token <jeton>`) pour un compte
staff Django ; les endpoints d'administration exigent `IsAdminUser`. Aucun compte
n'est créé par le code : créer un compte staff avec
`python manage.py createsuperuser`.
"""
import re
from datetime import timedelta
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .api_schemas import AuthTokenRequestSerializer, AuthTokenResponseSerializer, ErrorEnvelopeSerializer
from .authentication import get_token_ttl_seconds
from .models import Customer, Order
from .serializers import OrderSerializer

PHONE_REGEX = re.compile(r'^(?:\+221|00221)?([73]\d{8})$')


def clean_phone_number(raw_phone: str) -> str:
    """Nettoie et valide un numéro sénégalais au format standard 9 chiffres (ex: 778561313)."""
    cleaned = re.sub(r'[\s\.\-\(\)]', '', str(raw_phone or '').strip())
    match = PHONE_REGEX.match(cleaned)
    if not match:
        return ''
    return match.group(1)


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

        ttl = get_token_ttl_seconds()
        with transaction.atomic():
            token, created = Token.objects.select_for_update().get_or_create(user=user)
            if not created and ttl > 0:
                if token.created < timezone.now() - timedelta(seconds=ttl):
                    token.delete()
                    token = Token.objects.create(user=user)

        return Response({'success': True, 'token': token.key, 'username': user.get_username()})


class CustomerRegisterView(APIView):
    """Inscription autonome d'un client avec numéro de téléphone sénégalais."""
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        data = request.data
        if not isinstance(data, dict):
            return Response({'success': False, 'error': "Un objet JSON est attendu."}, status=status.HTTP_400_BAD_REQUEST)

        name = str(data.get('name', '')).strip()
        phone_raw = str(data.get('phone', '')).strip()
        password = str(data.get('password', '')).strip()
        address = str(data.get('address', '')).strip()

        if not name:
            return Response({'success': False, 'error': "Veuillez indiquer votre prénom et votre nom."}, status=status.HTTP_400_BAD_REQUEST)

        phone = clean_phone_number(phone_raw)
        if not phone:
            return Response({'success': False, 'error': "Numéro de téléphone sénégalais invalide (ex: 77 856 13 13)."}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 4:
            return Response({'success': False, 'error': "Le mot de passe doit comporter au moins 4 caractères."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=phone).exists():
            return Response({'success': False, 'error': "Un compte existe déjà avec ce numéro de téléphone. Veuillez vous connecter."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.create_user(
                username=phone,
                first_name=name,
                password=password,
                is_staff=False
            )
            customer, _ = Customer.objects.update_or_create(
                phone=phone,
                defaults={'user': user, 'name': name, 'address': address}
            )
            token = Token.objects.create(user=user)

        return Response({
            'success': True,
            'message': "Compte créé avec succès. Bienvenue chez BMC Food !",
            'token': token.key,
            'user': {
                'name': customer.name,
                'phone': customer.phone,
                'address': customer.address
            }
        }, status=status.HTTP_201_CREATED)


class CustomerLoginView(APIView):
    """Connexion autonome d'un client avec téléphone + mot de passe."""
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        data = request.data
        if not isinstance(data, dict):
            return Response({'success': False, 'error': "Un objet JSON est attendu."}, status=status.HTTP_400_BAD_REQUEST)

        ident = str(data.get('identifier') or data.get('phone') or data.get('username') or '').strip()
        password = str(data.get('password', '')).strip()

        if not ident or not password:
            return Response({'success': False, 'error': "Veuillez renseigner votre numéro de téléphone et votre mot de passe."}, status=status.HTTP_400_BAD_REQUEST)

        phone = clean_phone_number(ident)
        lookup_username = phone if phone else ident

        user = authenticate(request=request, username=lookup_username, password=password)
        if not user:
            return Response({'success': False, 'error': "Numéro de téléphone ou mot de passe incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        customer = Customer.objects.filter(Q(user=user) | Q(phone=phone)).first() if phone else Customer.objects.filter(user=user).first()
        name = customer.name if customer else (user.first_name or user.username)
        address = customer.address if customer else ''

        ttl = get_token_ttl_seconds()
        with transaction.atomic():
            token, created = Token.objects.select_for_update().get_or_create(user=user)
            if not created and ttl > 0:
                if token.created < timezone.now() - timedelta(seconds=ttl):
                    token.delete()
                    token = Token.objects.create(user=user)

        return Response({
            'success': True,
            'message': "Connexion réussie. Bienvenue chez BMC Food.",
            'token': token.key,
            'user': {
                'name': name,
                'phone': phone or user.username,
                'address': address
            }
        })


class CustomerProfileView(APIView):
    """Profil du client connecté et historique de ses commandes."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        customer = Customer.objects.filter(user=user).first()
        name = customer.name if customer else (user.first_name or user.username)
        phone = customer.phone if customer else user.username
        address = customer.address if customer else ''

        orders = Order.objects.filter(phone=phone).prefetch_related('items__menu_item').order_by('-created_at')[:20]

        return Response({
            'success': True,
            'user': {
                'name': name,
                'phone': phone,
                'address': address
            },
            'orders_count': orders.count(),
            'orders': OrderSerializer(orders, many=True).data
        })

    def patch(self, request):
        user = request.user
        customer, _ = Customer.objects.get_or_create(user=user, defaults={'phone': user.username, 'name': user.first_name or user.username})
        name = request.data.get('name')
        address = request.data.get('address')
        if name is not None:
            customer.name = str(name).strip()
            user.first_name = customer.name
            user.save(update_fields=['first_name'])
        if address is not None:
            customer.address = str(address).strip()
        customer.save()

        return Response({
            'success': True,
            'message': "Profil mis à jour avec succès.",
            'user': {
                'name': customer.name,
                'phone': customer.phone,
                'address': customer.address
            }
        })

