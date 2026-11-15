# Guide de déploiement pas à pas sur un VPS (Ubuntu 24.04) — BMC FOOD

Ce guide s'adresse à toute personne qui héberge le projet sur un serveur privé virtuel (VPS) neuf sous **Ubuntu 24.04 LTS**, sans expertise DevOps préalable. Chaque étape est autonome et chaque commande est directement copiable.

> **Architecture réseau retenue** : reverse proxy unifié **Caddy** (HTTPS automatique Let's Encrypt) avec l'API en chemin relatif `/api`, conformément à [`docs/deploiement_api_reverse_proxy.md`](deploiement_api_reverse_proxy.md).
> - Site client : `https://bmcfood.sn` (et redirection `www.bmcfood.sn` → `bmcfood.sn`)
> - Application Admin & KDS Cuisine : `https://admin.bmcfood.sn` (sous-domaine dédié documenté dans [`deploy/Caddyfile`](../deploy/Caddyfile))
> - API Django REST + Gunicorn : `127.0.0.1:8000` (jamais exposée directement sur Internet), accessible via `/api/*` sur les deux domaines.

### Prérequis DNS avant de commencer
Dans l'interface de votre bureau d'enregistrement de nom de domaine (OVH, Cloudflare, LWS, Namecheap, etc.), créez 3 enregistrements DNS de type `A` pointant vers l'adresse IP publique IPv4 de votre VPS :
- `bmcfood.sn` (ou `@`) → `<IP_DU_VPS>`
- `www.bmcfood.sn` → `<IP_DU_VPS>`
- `admin.bmcfood.sn` → `<IP_DU_VPS>`

*(Remplacez `bmcfood.sn` et `admin.bmcfood.sn` par votre propre nom de domaine partout dans ce guide.)*

---

## 1. Créer le serveur et sécuriser l'accès

Dimensionnement recommandé : **Ubuntu 24.04 LTS**, **2 vCPU**, **2 à 4 Go de RAM**, 25 Go de disque minimum.

### 1.1 Première connexion et création d'un utilisateur administrateur non-root
Connectez-vous d'abord en `root` (ou avec l'utilisateur fourni par l'hébergeur) :
```bash
ssh root@<IP_DU_VPS>
```

Mettez le système à jour et réglez le fuseau horaire (Dakar = UTC+0 / `Africa/Dakar`) :
```bash
apt update && apt upgrade -y
timedatectl set-timezone Africa/Dakar
```

Créez un utilisateur administrateur `deploy` avec droits `sudo` et copiez votre clé SSH publique (si vous n'avez pas encore de clé SSH sur votre PC, générez-la localement avec `ssh-keygen -t ed25519` et collez le contenu de `~/.ssh/id_ed25519.pub` dans `/home/deploy/.ssh/authorized_keys`) :
```bash
adduser --gecos "" deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys 2>/dev/null || true
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

**Test obligatoire dans un deuxième terminal** avant de bloquer `root` :
```bash
ssh deploy@<IP_DU_VPS>
sudo id
```
Si `sudo id` répond `uid=0(root)`, continuez dans la session `deploy` (ou en `sudo`).

### 1.2 Durcir SSH et activer le pare-feu (UFW)
Désactivez la connexion `root` et l'authentification par mot de passe SSH :
```bash
sudo tee /etc/ssh/sshd_config.d/99-bmc-hardening.conf > /dev/null <<'EOF'
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
EOF
sudo sshd -t && sudo systemctl reload ssh
```

Activez le pare-feu UFW en n'ouvrant que SSH (22), HTTP (80, requis par Let's Encrypt) et HTTPS (443) :
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose
```

---

## 2. Installer Python, PostgreSQL, Caddy et Node.js

Exécutez les commandes suivantes depuis votre session `deploy` :

```bash
# Outils de base, diagnostic DNS, Python 3.12 + venv, PostgreSQL et ACL
sudo apt update
sudo apt install -y git curl gnupg ca-certificates acl dnsutils \
  python3 python3-venv python3-pip postgresql postgresql-contrib
```

Installez **Node.js 22 LTS** (Vite 8 et TypeScript 6 exigent Node >= 20.19 ; la version par défaut d'Ubuntu est trop ancienne) :
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Installez **Caddy v2** depuis le dépôt officiel :
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Vérifiez que tous les outils répondent correctement :
```bash
python3 --version
node -v
npm -v
psql --version
caddy version
```

---

## 3. Créer la base et l'utilisateur PostgreSQL

Choisissez un mot de passe robuste (sans caractères spéciaux posant problème dans une URL comme `@`, `:`, `/`, `#`, ou encodez-les en URL). Créez l'utilisateur `bmc_user` et la base `bmc_food` :

```bash
sudo -u postgres psql <<'SQL'
CREATE USER bmc_user WITH PASSWORD 'REMPLACER_PAR_MOT_DE_PASSE_POSTGRES_FORT';
CREATE DATABASE bmc_food OWNER bmc_user ENCODING 'UTF8';
ALTER ROLE bmc_user SET client_encoding TO 'utf8';
ALTER ROLE bmc_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE bmc_user SET timezone TO 'Africa/Dakar';
SQL
```

Vérifiez la connexion locale par mot de passe (tapez le mot de passe choisi quand `psql` le demande) :
```bash
psql -U bmc_user -h 127.0.0.1 -d bmc_food -c "\conninfo"
```

---

## 4. Récupérer le code, créer l'utilisateur système et installer les dépendances

Créez l'utilisateur système dédié `bmc` (sans accès shell ni droits `sudo`) qui exécutera l'API Gunicorn :
```bash
sudo adduser --system --group --no-create-home bmc
```

Clonez le dépôt dans `/var/www/bmc` et attribuez les droits :
```bash
sudo mkdir -p /var/www/bmc
sudo git clone https://github.com/lansanacoly7/BMC_FOOD.git /var/www/bmc
sudo chown -R bmc:bmc /var/www/bmc
```

Créez l'environnement virtuel Python et installez les dépendances du backend ainsi que Gunicorn :
```bash
sudo -u bmc python3 -m venv /var/www/bmc/venv
sudo -u bmc /var/www/bmc/venv/bin/pip install --upgrade pip
sudo -u bmc /var/www/bmc/venv/bin/pip install -r /var/www/bmc/backend/requirements.txt gunicorn
```

---

## 5. Configurer les variables d'environnement

Placez le fichier d'environnement en dehors du dépôt Git (`/etc/bmc/backend.env`) afin qu'aucune mise à jour Git ne touche aux secrets :

```bash
sudo mkdir -p /etc/bmc
sudo cp /var/www/bmc/deploy/env.production.example /etc/bmc/backend.env
```

Générez une clé secrète Django aléatoire unique :
```bash
/var/www/bmc/venv/bin/python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Éditez `/etc/bmc/backend.env` avec `sudo nano /etc/bmc/backend.env` et vérifiez chaque ligne :
- `DJANGO_DEBUG=0`
- `DJANGO_SECRET_KEY=<coller_la_cle_generee_ci_dessus>`
- `DJANGO_ALLOWED_HOSTS=bmcfood.sn,www.bmcfood.sn,admin.bmcfood.sn` (avec votre vrai domaine)
- `CORS_ALLOWED_ORIGINS=https://bmcfood.sn,https://admin.bmcfood.sn`
- `DATABASE_URL=postgres://bmc_user:<MOT_DE_PASSE_POSTGRES>@127.0.0.1:5432/bmc_food`
- `DJANGO_SECURE_SSL_REDIRECT=0` (Caddy redirige déjà HTTP → HTTPS ; ne pas mettre `1` sans `SECURE_PROXY_SSL_HEADER`)
- `DJANGO_SECURE_HSTS_SECONDS=31536000`
- `BMC_API_DOCS_PUBLIC=0`

Verrouillez les permissions du fichier de secrets :
```bash
sudo chown root:bmc /etc/bmc/backend.env
sudo chmod 640 /etc/bmc/backend.env
```

---

## 6. Initialiser la base de données, le cache, le catalogue et l'administrateur

Préparez les répertoires statiques et médias :
```bash
sudo -u bmc mkdir -p /var/www/bmc/backend/staticfiles /var/www/bmc/backend/media
```

Exécutez les commandes Django d'initialisation dans `/var/www/bmc/backend` en chargeant `/etc/bmc/backend.env` :
```bash
sudo -u bmc bash -c '
set -euo pipefail
set -a
source /etc/bmc/backend.env
set +a
cd /var/www/bmc/backend
/var/www/bmc/venv/bin/python manage.py migrate --noinput
/var/www/bmc/venv/bin/python manage.py createcachetable
/var/www/bmc/venv/bin/python manage.py seed_bmc
'
```

> **Note sur `collectstatic`** : si `STATIC_ROOT` est configuré dans `backend/bmc_backend/settings.py` (`STATIC_ROOT = BASE_DIR / 'staticfiles'`), exécutez également :
> ```bash
> sudo -u bmc bash -c 'set -a && source /etc/bmc/backend.env && set +a && cd /var/www/bmc/backend && /var/www/bmc/venv/bin/python manage.py collectstatic --noinput'
> ```
> Sans `STATIC_ROOT` dans `settings.py`, Django refuse `collectstatic` ; l'API REST, le site client et l'application admin Vite fonctionnent néanmoins intégralement (les fichiers statiques des frontends sont servis directement depuis `dist/` par Caddy).

Créez le compte administrateur initial pour accéder à `https://admin.bmcfood.sn` :
```bash
sudo -u bmc bash -c '
set -a && source /etc/bmc/backend.env && set +a
cd /var/www/bmc/backend
/var/www/bmc/venv/bin/python manage.py createsuperuser
'
```

*(Important : en production, ne relancez jamais `seed_bmc --reset` après la mise en ligne, sous peine d'écraser les prix et disponibilités modifiés par le gérant.)*

---

## 7. Construire les deux sites, installer Caddy et activer le service

### 7.1 Construire `client_website` et `admin_app`
Utilisez le script fourni (en laissant `VITE_API_BASE_URL=/api` par défaut, comme documenté dans [`docs/deploiement_api_reverse_proxy.md`](deploiement_api_reverse_proxy.md)) :
```bash
sudo -u bmc bash -c 'cd /var/www/bmc && VITE_ADMIN_URL=https://admin.bmcfood.sn/ bash deploy/build_frontends.sh'
```

Assurez-vous que l'utilisateur système `caddy` peut traverser et lire les fichiers générés :
```bash
sudo chmod 755 /var/www/bmc /var/www/bmc/client_website /var/www/bmc/admin_app /var/www/bmc/backend
sudo chmod -R o+rX /var/www/bmc/client_website/dist /var/www/bmc/admin_app/dist /var/www/bmc/backend/staticfiles /var/www/bmc/backend/media
```

### 7.2 Installer et démarrer le service systemd backend (`gunicorn`)
```bash
sudo cp /var/www/bmc/deploy/bmc-backend.service /etc/systemd/system/bmc-backend.service
sudo systemctl daemon-reload
sudo systemctl enable --now bmc-backend
sudo systemctl status bmc-backend --no-pager
```

### 7.3 Installer et valider `Caddyfile`
```bash
sudo cp /var/www/bmc/deploy/Caddyfile /etc/caddy/Caddyfile
# Si votre domaine n'est pas bmcfood.sn, adaptez /etc/caddy/Caddyfile avec :
# sudo sed -i 's/bmcfood\.sn/votre-domaine.sn/g' /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable caddy
sudo systemctl reload caddy
sudo systemctl status caddy --no-pager
```

---

## 8. Vérifications finales avant ouverture

1. **Santé de l'API et certificat HTTPS** :
   ```bash
   curl -fsS https://bmcfood.sn/api/health/
   echo ""
   curl -fsS https://admin.bmcfood.sn/api/health/
   echo ""
   ```
   Réponse attendue : JSON contenant `"status":"ok"` sur les deux hôtes, sans erreur de certificat TLS.

2. **Documentation API fermée au public** (`BMC_API_DOCS_PUBLIC=0`) :
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://bmcfood.sn/api/docs/
   ```
   Doit renvoyer `401` ou `403` (jamais `200`).

3. **Commande de test de bout en bout** :
   - Ouvrez `https://bmcfood.sn`, vérifiez le chargement des photos du menu et du hero vidéo.
   - Passez une commande test (paiement en espèces, téléphone fictif ou du gérant avec note `"TEST DEPLOIEMENT"`).
   - Ouvrez `https://admin.bmcfood.sn`, connectez-vous avec les identifiants créés via `createsuperuser` à l'étape 6, et vérifiez que la commande apparaît en temps réel dans le KDS.
   - Annulez la commande test côté admin (ou vérifiez qu'aucune fausse commande n'est laissée active en cuisine).

---

## 9. Mise à jour du site et retour en arrière

### 9.1 Déployer une nouvelle version
```bash
# 1. Sauvegarder la base avant toute modification (voir docs/restauration.md)
sudo bash /var/www/bmc/deploy/backup.sh

# 2. Noter la version en cours au cas où un rollback serait nécessaire
sudo -u bmc git -C /var/www/bmc rev-parse --short HEAD

# 3. Récupérer le code, mettre à jour dépendances, base et frontends
sudo -u bmc git -C /var/www/bmc pull --ff-only
sudo -u bmc /var/www/bmc/venv/bin/pip install -r /var/www/bmc/backend/requirements.txt
sudo -u bmc bash -c '
set -euo pipefail
set -a && source /etc/bmc/backend.env && set +a
cd /var/www/bmc/backend
/var/www/bmc/venv/bin/python manage.py migrate --noinput
/var/www/bmc/venv/bin/python manage.py seed_bmc
'
sudo -u bmc bash -c 'cd /var/www/bmc && VITE_ADMIN_URL=https://admin.bmcfood.sn/ bash deploy/build_frontends.sh'
sudo chmod -R o+rX /var/www/bmc/client_website/dist /var/www/bmc/admin_app/dist

# 4. Redémarrer le backend et vérifier la santé
sudo systemctl restart bmc-backend
sudo systemctl reload caddy
curl -fsS https://bmcfood.sn/api/health/
```

### 9.2 Retour en arrière (rollback)
Si la nouvelle version échoue :
```bash
# 1. Revenir au commit précédent noté avant la mise à jour
sudo -u bmc git -C /var/www/bmc checkout <ANCIEN_COMMIT_SHA>

# 2. Si une migration de base avait été appliquée : restaurer la sauvegarde (voir docs/restauration.md)
# 3. Reconstruire les frontends et redémarrer Gunicorn
sudo -u bmc bash -c 'cd /var/www/bmc && VITE_ADMIN_URL=https://admin.bmcfood.sn/ bash deploy/build_frontends.sh'
sudo systemctl restart bmc-backend
curl -fsS https://bmcfood.sn/api/health/
```

---

## 10. Dépannage : les 5 problèmes les plus probables

### 1. Erreur `502 Bad Gateway` sur `/api/*`
- **Symptôme** : le site s'affiche mais les plats ou commandes renvoient une erreur 502.
- **Cause probable** : le service `bmc-backend` (Gunicorn) n'est pas démarré ou plante au démarrage (`DJANGO_SECRET_KEY` manquante, `DATABASE_URL` invalide).
- **Diagnostic et correction** :
  ```bash
  sudo systemctl status bmc-backend --no-pager
  sudo journalctl -u bmc-backend -n 80 --no-pager
  ```
  Corrigez `/etc/bmc/backend.env` puis lancez `sudo systemctl restart bmc-backend`.

### 2. HTTPS ne s'active pas (erreur certificat Let's Encrypt / timeout)
- **Symptôme** : le navigateur affiche une erreur SSL ou `caddy` échoue à obtenir un certificat.
- **Cause probable** : les DNS `A` ne pointent pas encore vers l'IP du VPS, ou les ports `80`/`443` sont bloqués (UFW ou pare-feu du fournisseur cloud).
- **Diagnostic et correction** :
  ```bash
  dig +short bmcfood.sn admin.bmcfood.sn
  sudo ufw status
  sudo journalctl -u caddy -n 50 --no-pager
  ```

### 3. Page blanche ou images cassées (`403 Forbidden` / `404 Not Found`)
- **Symptôme** : le site ou l'admin est vide, ou les images `/assets/...` retournent `403`.
- **Cause probable** : l'utilisateur système `caddy` n'a pas les droits de lecture/traversée sur `dist/`, ou le build frontend n'a pas été exécuté.
- **Diagnostic et correction** :
  ```bash
  namei -l /var/www/bmc/client_website/dist/index.html
  sudo chmod -R o+rX /var/www/bmc/client_website/dist /var/www/bmc/admin_app/dist
  sudo systemctl reload caddy
  ```

### 4. Erreur `400 Bad Request` (`Invalid HTTP_HOST`) ou blocage CORS
- **Symptôme** : l'API renvoie 400 ou le navigateur indique un refus CORS.
- **Cause probable** : le domaine réel utilisé dans le navigateur n'est pas listé dans `DJANGO_ALLOWED_HOSTS` ou `CORS_ALLOWED_ORIGINS` dans `/etc/bmc/backend.env`, ou le build frontend a conservé un `VITE_API_BASE_URL` pointant sur `localhost` (vérifier [`docs/deploiement_api_reverse_proxy.md`](deploiement_api_reverse_proxy.md)).
- **Diagnostic et correction** : mettez à jour `/etc/bmc/backend.env`, relancez `build_frontends.sh` avec `VITE_API_BASE_URL=/api`, puis `sudo systemctl restart bmc-backend`.

### 5. Boucle de redirection infinie (`ERR_TOO_MANY_REDIRECTS`) ou erreur `bmc_cache` / `429`
- **Symptôme** : redirections sans fin sur l'API, ou erreur 500 indiquant `relation "bmc_cache" does not exist`.
- **Cause probable** : `DJANGO_SECURE_SSL_REDIRECT=1` a été activé derrière Caddy (qui termine déjà le HTTPS), ou `python manage.py createcachetable` a été oublié à l'étape 6.
- **Diagnostic et correction** : vérifiez `DJANGO_SECURE_SSL_REDIRECT=0` dans `/etc/bmc/backend.env`, lancez `manage.py createcachetable`, puis `sudo systemctl restart bmc-backend`.
