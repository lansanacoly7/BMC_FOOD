import json
import os
import re
from django.conf import settings
from django.contrib.auth.models import User
from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import Category, MenuItem
from .serializers import MenuItemSerializer

PROMOTIONS_FILE = os.path.join(settings.BASE_DIR, 'promotions.json')

DEFAULT_PROMOTIONS = [
    {
        "id": 1,
        "code": "tp-1",
        "name": "Tacos viande pané",
        "category": "Tacos panés",
        "price": 3500,
        "discountPercent": 20,
        "isPromo": True,
        "image_url": "/images/products/tacos-viande-pane.webp",
        "description": "Viande hachée assaisonnée, frites fraîches, sauce fromagère maison et panure croustillante."
    },
    {
        "id": 5,
        "code": "bg-1",
        "name": "Burger BMC Complet",
        "category": "Burgers",
        "price": 2500,
        "discountPercent": 15,
        "isPromo": True,
        "image_url": "/images/products/burger-bmc-complet.webp",
        "description": "Steak pur bœuf braisé minute, cheddar fondant, œuf à cheval, oignons et sauce secrète."
    }
]

def load_promotions():
    if not os.path.exists(PROMOTIONS_FILE):
        save_promotions(DEFAULT_PROMOTIONS)
        return DEFAULT_PROMOTIONS
    try:
        with open(PROMOTIONS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return DEFAULT_PROMOTIONS

def save_promotions(data):
    with open(PROMOTIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@extend_schema(exclude=True)
class PromotionsView(APIView):
    """Gestion des promotions partagées entre l'administration et le site client."""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminUser()]

    @extend_schema(summary="Obtenir les promotions actives", tags=["Promotions"], operation_id="promotions_list")
    def get(self, request):
        promos = load_promotions()
        return Response({
            'success': True,
            'count': len(promos),
            'promotions': promos
        })

    @extend_schema(summary="Enregistrer ou mettre à jour les promotions", tags=["Promotions"], operation_id="promotions_update")
    def post(self, request):
        data = request.data
        if isinstance(data, dict) and 'promotions' in data:
            data = data['promotions']
        if not isinstance(data, list):
            return Response({'success': False, 'error': "Une liste de promotions est requise."}, status=status.HTTP_400_BAD_REQUEST)

        save_promotions(data)
        return Response({
            'success': True,
            'message': "Promotions enregistrées avec succès.",
            'count': len(data),
            'promotions': data
        })


@extend_schema(exclude=True)
class MenuItemCreateView(APIView):
    """Création d'un nouveau plat dans le catalogue BMC Food."""
    permission_classes = [IsAdminUser]

    @extend_schema(summary="Créer un nouveau plat", tags=["Catalogue"], operation_id="menu_item_create_custom")
    def post(self, request):
        data = request.data
        name = (data.get('name') or '').strip()
        if not name:
            return Response({'success': False, 'error': "Le nom du plat est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

        price = data.get('price')
        try:
            price = int(price)
            if price <= 0:
                raise ValueError()
        except (TypeError, ValueError):
            return Response({'success': False, 'error': "Le prix doit être un entier positif (F CFA)."}, status=status.HTTP_400_BAD_REQUEST)

        category_val = data.get('category')
        category = None
        if isinstance(category_val, int):
            category = Category.objects.filter(pk=category_val).first()
        elif isinstance(category_val, str) and category_val.strip():
            category = Category.objects.filter(name__iexact=category_val.strip()).first() or Category.objects.filter(slug__iexact=category_val.strip()).first()

        if not category:
            category = Category.objects.first()
            if not category:
                category = Category.objects.create(name='Spécialités', slug='specialites')

        code = (data.get('code') or '').strip()
        if not code:
            base_code = slugify(name)[:10] or 'plat'
            count = MenuItem.objects.count() + 1
            code = f"{base_code}-{count}"
            while MenuItem.objects.filter(code=code).exists():
                count += 1
                code = f"{base_code}-{count}"

        image_url = (data.get('image_url') or '').strip() or '/images/products/tacos-viande-pane.webp'
        description = (data.get('description') or '').strip()
        is_available = bool(data.get('is_available', True))
        is_daily_special = bool(data.get('is_daily_special', False))
        popular = bool(data.get('popular', False))

        item = MenuItem.objects.create(
            name=name,
            code=code,
            category=category,
            price=price,
            description=description,
            image_url=image_url,
            is_available=is_available,
            is_daily_special=is_daily_special,
            popular=popular
        )

        return Response({
            'success': True,
            'message': f"Le plat « {item.name} » a été ajouté au catalogue.",
            'item': MenuItemSerializer(item).data
        }, status=status.HTTP_201_CREATED)


@extend_schema(exclude=True)
class StaffListView(APIView):
    """Gestion des comptes employés de l'administration (Cuisine, Caisse, Manager)."""
    permission_classes = [IsAdminUser]

    @extend_schema(summary="Lister les employés", tags=["Personnel"], operation_id="staff_list")
    def get(self, request):
        users = User.objects.filter(is_staff=True).order_by('-date_joined')
        data = [
            {
                'id': u.id,
                'username': u.username,
                'role': u.first_name or 'Employé',
                'email': u.email,
                'is_active': u.is_active,
                'is_superuser': u.is_superuser,
                'date_joined': u.date_joined.isoformat(),
            }
            for u in users
        ]
        return Response({'success': True, 'count': len(data), 'staff': data})

    @extend_schema(summary="Créer un compte employé", tags=["Personnel"], operation_id="staff_create")
    def post(self, request):
        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''
        role = (request.data.get('role') or request.data.get('first_name') or 'Cuisine').strip()

        if not username:
            return Response({'success': False, 'error': "L'identifiant est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 4:
            return Response({'success': False, 'error': "Le mot de passe doit comporter au moins 4 caractères."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username__iexact=username).exists():
            return Response({'success': False, 'error': f"L'identifiant « {username} » est déjà utilisé."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=role,
            is_staff=True
        )

        return Response({
            'success': True,
            'message': f"Compte employé « {username} » ({role}) créé avec succès.",
            'staff_member': {
                'id': user.id,
                'username': user.username,
                'role': user.first_name,
                'email': user.email,
                'is_active': user.is_active,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined.isoformat(),
            }
        }, status=status.HTTP_201_CREATED)


@extend_schema(exclude=True)
class StaffDetailView(APIView):
    """Suppression d'un compte employé."""
    permission_classes = [IsAdminUser]

    @extend_schema(summary="Supprimer un compte employé", tags=["Personnel"], operation_id="staff_delete")
    def delete(self, request, pk=None):
        if not pk:
            return Response({'success': False, 'error': "ID requis."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(pk=pk, is_staff=True)
        except User.DoesNotExist:
            return Response({'success': False, 'error': "Compte employé introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if user.pk == request.user.pk:
            return Response({'success': False, 'error': "Vous ne pouvez pas supprimer votre propre compte actif."}, status=status.HTTP_400_BAD_REQUEST)

        username = user.username
        user.delete()
        return Response({'success': True, 'message': f"Le compte employé « {username} » a été supprimé."})


# Alias rétrocompatible
StaffManagementView = StaffListView
