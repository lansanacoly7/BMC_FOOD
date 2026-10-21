# Backend API — BMC FOOD

> **Projet** : BMC FOOD — Plateforme de commande en ligne et gestion de cuisine  
> **Faction Backend** : Ibrahima Khalilou Diallo (Lead Backend) & Pathé Fall (Assistance Backend)  
> **Supervision** : Lansana Coly (Chef de Projet & Lead Technique) — Teranga Labs  
> **Framework** : Django 5 / Django REST Framework (DRF) — Python 3.13  

---

## 1. Prérequis & Environnement

- **Python** : version `3.13` recommandée (testé et validé avec `Python 3.13.3`).
- **Gestionnaire de paquets** : `pip`.
- **Base de données** : SQLite 3 (`backend/bmc_orders.sqlite3` générée automatiquement par les migrations et le seed).

---

## 2. Guide d'Installation de Zéro (Pas à Pas)

### Étape 1 : Cloner le dépôt et se positionner dans le dossier backend
```bash
git clone https://github.com/lansanacoly7/BMC_FOOD.git
cd BMC_FOOD/backend
```

### Étape 2 : Créer et activer l'environnement virtuel (recommandé)
```bash
# Sur Windows (PowerShell) :
python -m venv venv
.\venv\Scripts\Activate.ps1

# Sur Linux / macOS :
python3 -m venv venv
source venv/bin/activate
```

### Étape 3 : Installer les dépendances
```bash
pip install -r requirements.txt
```

### Étape 4 : Variables d'Environnement (Configuration Sécurisée)
Le projet utilise un fichier `.env` local (ignoré par Git) ou des variables d'environnement système.
Un modèle est fourni dans `backend/.env.example`.

Pour initialiser rapidement votre environnement de développement :
```bash
# Sur Linux / macOS :
cp .env.example .env

# Sur Windows (PowerShell) :
Copy-Item .env.example .env
```
Activez ensuite `DJANGO_DEBUG=true` dans votre fichier `.env` ou directement dans votre terminal.

| Variable | Description | Valeur par défaut en Dev (`DJANGO_DEBUG=true`) | Configuration Production (`DJANGO_DEBUG=false`) |
|---|---|---|---|
| `DJANGO_DEBUG` | Active le mode débogage Django | `false` (définir explicitement à `true` en dev) | `false` |
| `DJANGO_SECRET_KEY` | Clé secrète cryptographique Django | Clé interne jetable de dev si `DJANGO_DEBUG=true` | **Obligatoire** (générée aléatoirement) |
| `DJANGO_ALLOWED_HOSTS` | Hôtes HTTP autorisés (séparés par des virgules) | `localhost,127.0.0.1,[::1]` | **Obligatoire** (ex. `api.bmcfood.sn`) |
| `CORS_ALLOWED_ORIGINS` | Origines frontend autorisées par CORS | Ports Vite de dev (`5173`, `5174`, `5175`) | **Obligatoire** (ex. `https://bmcfood.sn,https://admin.bmcfood.sn`) |
| `BMC_DB_PATH` | Emplacement du fichier SQLite | `backend/bmc_orders.sqlite3` | Chemin personnalisé absolu ou persistant |

> [!CAUTION]
> Par sécurité, sans `DJANGO_DEBUG=true`, le serveur Django refuse de démarrer si `DJANGO_SECRET_KEY` ou `DJANGO_ALLOWED_HOSTS` ne sont pas fournis. Aucun secret de production ne doit être committé dans le dépôt Git.

### Étape 5 : Appliquer les migrations de la base de données
```bash
# Sur Windows (PowerShell) si .env n'est pas utilisé :
$env:DJANGO_DEBUG="True"; python manage.py migrate

# Avec le fichier .env configuré (DJANGO_DEBUG=true) :
python manage.py migrate
```

### Étape 6 : Peupler le catalogue officiel BMC FOOD (Seed Idempotent)
```bash
python manage.py seed_bmc
```
> La commande insère de façon 100% idempotente les **32 articles réels** et les **7 catégories officielles** du restaurant BMC FOOD, et configure le **Plat du Jour** emblématique (`trp-3` : *Tacos mixte jambon royal pané*). Relancer la commande met à jour les données sans créer de doublons. L'option `--reset` permet de forcer la réinitialisation des prix et disponibilités aux valeurs du catalogue initial.

### Étape 7 : Créer un compte administrateur (pour l'application Admin)
```bash
python manage.py createsuperuser
```

---

## 3. Démarrage du Serveur & Documentation Swagger

### Lancement du serveur de développement
```bash
# Vérifiez que DJANGO_DEBUG=true est actif (.env ou terminal)
python manage.py runserver
```
L'API est accessible localement sur `http://127.0.0.1:8000/`.

### Documentation interactive Swagger / OpenAPI
- **Interface Swagger UI** : [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- **Schéma OpenAPI brut (JSON/YAML)** : [http://127.0.0.1:8000/api/schema/](http://127.0.0.1:8000/api/schema/)

---

## 4. Exécution de la Suite de Tests Automatisés

La suite de tests automatisée couvre l'ensemble des modules (moteur de prix, endpoints HTTP, authentification par jeton, plat du jour, règles métier et flux de commandes) :

```bash
# Lancer la totalité des tests :
# Sur Windows (PowerShell) :
$env:DJANGO_DEBUG="True"; python manage.py test api

# Sur Linux / macOS :
DJANGO_DEBUG=true python manage.py test api

# Lancer uniquement les tests du moteur de prix :
python manage.py test api.tests.test_pricing

# Lancer uniquement les tests d'endpoints HTTP :
python manage.py test api.tests.test_api_endpoints
```

---

## 5. Exemples Rejouables avec `curl`

### 1. Contrôle de santé (Health Check)
```bash
curl -X GET http://127.0.0.1:8000/api/health/
```
*Réponse attendue (200 OK) :*
```json
{
  "status": "ok",
  "service": "BMC Food Django REST API",
  "version": "2.0.0",
  "server_time": "2026-10-21T05:00:00Z"
}
```

### 2. Consulter le menu officiel complet
```bash
curl -X GET http://127.0.0.1:8000/api/menu/
```

### 3. Consulter le Plat du Jour
```bash
curl -X GET http://127.0.0.1:8000/api/daily-special/
```

### 4. Activer / Désactiver le Plat du Jour (Admin)
```bash
curl -X PATCH http://127.0.0.1:8000/api/daily-special/1/toggle/ \
     -u "admin_bmc:admin_secure_password_2026" \
     -H "Content-Type: application/json" \
     -d '{"is_daily_special": true}'
```

### 5. Passer une commande client (Recalcul 100% serveur des prix)
```bash
curl -X POST http://127.0.0.1:8000/api/orders/ \
     -H "Content-Type: application/json" \
     -d '{
       "customer_name": "Lansana Coly",
       "phone": "77 106 75 75",
       "address": "Ngor, Dakar",
       "payment_method": "wave",
       "items": [
         {"id": "tp-1", "quantity": 2},
         {"id": "bg-1", "quantity": 1}
       ]
     }'
```
*Réponse attendue (201 Created) :*
```json
{
  "success": true,
  "message": "Commande créée avec succès !",
  "order": {
    "order_ref": "BMC-4821",
    "customer_name": "Lansana Coly",
    "total_amount": 9000,
    "payment_method": "wave",
    "payment_status": "pending",
    "status": "pending"
  }
}
```

### 6. Consulter les alertes de commandes non encore notifiées (Admin)
```bash
curl -X GET http://127.0.0.1:8000/api/orders/events/unnotified/ \
     -u "admin_bmc:admin_secure_password_2026"
```

### 7. Acquitter une alerte de commande ciblée (Admin)
```bash
curl -X POST http://127.0.0.1:8000/api/orders/events/unnotified/ \
     -u "admin_bmc:admin_secure_password_2026" \
     -H "Content-Type: application/json" \
     -d '{"order_refs": ["BMC-4821"]}'
```

### 8. Faire évoluer le statut d'une commande (Admin Cuisine / Livraison)
```bash
curl -X PATCH http://127.0.0.1:8000/api/orders/BMC-4821/status/ \
     -u "admin_bmc:admin_secure_password_2026" \
     -H "Content-Type: application/json" \
     -d '{"status": "preparing", "payment_status": "paid"}'
```
