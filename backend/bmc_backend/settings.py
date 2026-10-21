"""
Configuration Django — BMC FOOD.

Sécurisée par défaut : sans variable d'environnement, `DEBUG` est désactivé et le
démarrage échoue explicitement si `DJANGO_SECRET_KEY` ou `DJANGO_ALLOWED_HOSTS`
manquent. En développement, définir `DJANGO_DEBUG=true` (voir `backend/.env.example`).
Aucune valeur secrète ne doit être écrite dans ce fichier ni dans le dépôt.
"""
import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Fichier `.env` local optionnel (ignoré par Git). Les variables déjà présentes
# dans l'environnement ont priorité.
load_dotenv(BASE_DIR / '.env')


def env_bool(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'on')


def env_list(name, default=None):
    value = os.environ.get(name)
    if value is None or not value.strip():
        return list(default or [])
    return [part.strip() for part in value.split(',') if part.strip()]


# --- Environnement ---------------------------------------------------------
DEBUG = env_bool('DJANGO_DEBUG', False)

# Clé de développement NON SECRÈTE, utilisée uniquement si DEBUG est actif.
_DEV_ONLY_SECRET_KEY = 'django-insecure-dev-only-never-use-in-production'

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '').strip()
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = _DEV_ONLY_SECRET_KEY
    else:
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY est obligatoire lorsque DJANGO_DEBUG n'est pas activé."
        )

ALLOWED_HOSTS = env_list(
    'DJANGO_ALLOWED_HOSTS',
    default=['localhost', '127.0.0.1', '[::1]'] if DEBUG else [],
)
if not DEBUG and not ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        "DJANGO_ALLOWED_HOSTS est obligatoire lorsque DJANGO_DEBUG n'est pas activé."
    )

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'drf_spectacular',

    # Local apps
    'api.apps.ApiConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'bmc_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'bmc_backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.environ.get('BMC_DB_PATH') or (BASE_DIR / 'bmc_orders.sqlite3'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Dakar'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- CORS ------------------------------------------------------------------
# CORS n'est PAS de l'authentification : il limite seulement les origines
# navigateur autorisées. En développement, les ports Vite par défaut sont permis.
_DEV_CORS_ORIGINS = [
    f'http://{host}:{port}'
    for host in ('localhost', '127.0.0.1')
    for port in (5173, 5174, 5175)
]
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS', default=_DEV_CORS_ORIGINS if DEBUG else [])
CORS_ALLOW_CREDENTIALS = False  # Authentification par jeton (en-tête), pas par cookie.

# --- Sécurité (production) -------------------------------------------------
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_SSL_REDIRECT = env_bool('DJANGO_SECURE_SSL_REDIRECT', False)
    SECURE_HSTS_SECONDS = int(os.environ.get('DJANGO_SECURE_HSTS_SECONDS', '0') or 0)

# --- Django REST Framework -------------------------------------------------
# Sécurisé par défaut : toute vue sans `permission_classes` explicite est réservée
# au staff. Les accès publics sont déclarés explicitement dans `api/urls.py`.
_RENDERERS = ['rest_framework.renderers.JSONRenderer']
if DEBUG:
    _RENDERERS.append('rest_framework.renderers.BrowsableAPIRenderer')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAdminUser',
    ],
    'DEFAULT_RENDERER_CLASSES': _RENDERERS,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'api.exceptions.bmc_exception_handler',
    'DEFAULT_THROTTLE_RATES': {
        'auth': os.environ.get('BMC_AUTH_THROTTLE_RATE', '10/min'),
    },
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%SZ',
}

# --- Documentation OpenAPI (Swagger) ---------------------------------------
# Publique en développement ; en production, réservée aux membres du staff
# connectés (session Django admin) sauf si BMC_API_DOCS_PUBLIC=true.
API_DOCS_PUBLIC = env_bool('BMC_API_DOCS_PUBLIC', DEBUG)

SPECTACULAR_SETTINGS = {
    'TITLE': 'BMC FOOD — API REST',
    'DESCRIPTION': (
        "API de commande de BMC FOOD (Dakar).\n\n"
        "Les prix sont toujours calculés côté serveur : le client n'envoie que "
        "l'identifiant de l'article et la quantité.\n\n"
        "Les endpoints d'administration exigent l'en-tête "
        "`Authorization: Token <jeton>` (jeton obtenu via `POST /api/auth/token/`)."
    ),
    'VERSION': '2.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SERVE_PERMISSIONS': (
        ['rest_framework.permissions.AllowAny']
        if API_DOCS_PUBLIC
        else ['rest_framework.permissions.IsAdminUser']
    ),
    'SERVE_AUTHENTICATION': (
        [] if API_DOCS_PUBLIC else ['rest_framework.authentication.SessionAuthentication']
    ),
    'COMPONENT_SPLIT_REQUEST': True,
}
