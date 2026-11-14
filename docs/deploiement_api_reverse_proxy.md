# Déploiement en production — URLs d'API relatives et Reverse Proxy

## 1. Contexte technique

Les applications frontend (`client_website` et `admin_app`) utilisent des URLs d'API relatives (`/api`) par défaut via la constante :
```typescript
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '')
```

### En environnement de développement
Le serveur de développement Vite (`vite.config.ts`) intègre un proxy qui redirige automatiquement toutes les requêtes préfixées par `/api` vers le serveur Django local (`http://127.0.0.1:8000`). Ce mécanisme évite les problèmes de Cross-Origin (CORS) en local.

---

## 2. Déploiement en production

Deux architectures sont possibles en production :

### Option A (Recommandée) : Reverse Proxy unifié (Même domaine)
Toutes les requêtes arrivent sur le même domaine/port. Le serveur web frontal (Nginx, Caddy ou Traefik) sert les fichiers statiques générés par Vite et transmet les requêtes `/api/` au serveur applicatif Django (Gunicorn / Uvicorn).

**Avantages :**
- Zéro configuration CORS requise pour les requêtes navigateur standard.
- Gestion simplifiée des certificats TLS/SSL.
- Pas de variable d'environnement de build nécessaire côté frontend (`/api` fonctionne directement).

#### Exemple de configuration Nginx :
```nginx
server {
    listen 443 ssl http2;
    server_name commande.bmcfood.sn;

    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/commande.bmcfood.sn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/commande.bmcfood.sn/privkey.pem;

    # Frontend Vite (Site Client ou Admin)
    root /var/www/bmc/client_website/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Django DRF
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }

    # Fichiers statiques Django (Admin Django & Swagger)
    location /static/ {
        alias /var/www/bmc/backend/staticfiles/;
    }
}
```

---

### Option B : API hébergée sur un domaine distinct

Si l'API Django est déployée sur un sous-domaine séparé (ex. `api.bmcfood.sn`) :

1. **Configuration Frontend :**
   Définir dans `.env.production` (ou injecter lors de la CI/CD) avant `npm run build` :
   ```env
   VITE_API_BASE_URL=https://api.bmcfood.sn/api
   ```

2. **Configuration Backend Django :**
   Renseigner les origines autorisées dans les variables d'environnement de production :
   ```env
   CORS_ALLOWED_ORIGINS=https://commande.bmcfood.sn,https://admin.bmcfood.sn
   ```

---

## 3. Exigences impératives de sécurité en production

### Variable `DJANGO_DEBUG=0`
En production, `DJANGO_DEBUG` doit impérativement être positionné à `0` (ou absent).
- **Hachage des mots de passe :** En mode développement (`DEBUG=True`), Django utilise `DevFastPBKDF2PasswordHasher` (10 000 itérations) pour éviter les blocages processeur sous Windows lors des tests et des connexions répétées. En production (`DJANGO_DEBUG=0`), ce hasheur rapide est strictement désactivé et Django utilise le standard `PBKDF2PasswordHasher` officiel (> 720 000 itérations).
- **Blocage de sécurité :** `DevFastPBKDF2PasswordHasher` refuse explicitement d'encoder tout mot de passe en dehors de l'environnement de développement ou des tests automatisés (`ImproperlyConfigured`).

### Variables obligatoires en production :
- `DJANGO_DEBUG=0`
- `DJANGO_SECRET_KEY` : Clé secrète cryptographique robuste et unique générée aléatoirement.
- `DJANGO_ALLOWED_HOSTS` : Liste des noms d'hôte autorisés (ex. `api.bmcfood.sn,commande.bmcfood.sn`).
- `DJANGO_SECURE_SSL_REDIRECT=1` (si la redirection TLS n'est pas gérée au niveau de Nginx).
