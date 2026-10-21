# Feuille de Route & Guide de Travail — Faction Backend & API

> **Responsable Faction** : Ibrahima Khalilou Diallo  
> **Contributeur** : Pathé Fall (Assistance Backend)  
> **Supervision & Validation PR** : Lansana Coly (Lead Technique)  
> **Dépôt GitHub** : [https://github.com/lansanacoly7/BMC_FOOD](https://github.com/lansanacoly7/BMC_FOOD)

---

## 1. Comment Travailler sur GitHub & Où Mettre Vos Fichiers

### 📁 Emplacement Obligatoire des Fichiers
Tout le code Python et Django doit être impérativement placé dans le dossier `backend/` :

```text
BMC_FOOD/
├── backend/                  <-- [METTRE ICI TOUT LE CODE BACKEND DJANGO]
│   ├── api/                  # Application API REST (models.py, views.py, serializers.py, urls.py)
│   │   ├── migrations/       # Fichiers de migrations Django
│   │   └── management/       # Commande seed_bmc.py
│   ├── bmc_backend/          # Configuration Django (settings.py, urls.py, wsgi.py)
│   ├── manage.py             # Script de commande Django
│   ├── requirements.txt      # Dépendances Python
│   └── bmc_orders.sqlite3    # Base de données locale de démo (exclue de Git)
│
└── docs/                     # Documentation et feuilles de route
```

> [!WARNING]
> **Ce qu'il ne faut JAMAIS committer** :
> Les dossiers `venv/`, `__pycache__/`, `*.sqlite3` et `.env` sont strictement exclus par `.gitignore`. Ne jamais tenter de committer votre environnement virtuel ni votre base de test locale.

---

### 🌿 Branches de Travail Assignées
Le backend dispose de sa branche dédiée. Vous ne travaillez **JAMAIS sur `main`** :

- **Branche principale Backend** : `feature/backend/setup-and-pricing`
- **Sous-branches autorisées** : Si vous découpez une tâche entre vous (ex : Ibrahima sur les serializers, Pathé sur les tests), créez une sous-branche :
  ```bash
  git checkout -b feature/backend/nom-de-votre-tache
  ```

---

### 🛠️ Commandes Git Pas à Pas pour l'Équipe Backend

#### 1. Cloner le projet (la première fois)
```bash
git clone https://github.com/lansanacoly7/BMC_FOOD.git
cd BMC_FOOD
git fetch --all
```

#### 2. Se positionner sur la branche Backend
```bash
git checkout feature/backend/setup-and-pricing
git pull origin develop
```

#### 3. Coder et faire des commits réguliers et clairs
Faites des commits atomiques au format standard :
- `feat(backend): ajout du modele MenuItem avec is_daily_special`
- `feat(api): recalcul strict des montants dans OrderCreateSerializer`
- `fix(orders): validation du moyen de paiement wave et orange_money`
- `feat(events): endpoint pour notifier les commandes entrantes a l'admin`

Exemple de commande :
```bash
git add backend/
git commit -m "feat(api): recalcul infalsifiable des prix cote serveur"
```

#### 4. Pousser son travail sur GitHub
```bash
git push origin feature/backend/setup-and-pricing
```

#### 5. Ouvrir une Pull Request (PR) pour faire valider son travail
Une fois votre module fonctionnel et testé :
1. Allez sur GitHub : [https://github.com/lansanacoly7/BMC_FOOD/pulls](https://github.com/lansanacoly7/BMC_FOOD/pulls)
2. Cliquez sur **« New pull request »**.
3. Base : **`develop`** (⚠️ **JAMAIS `main`**).
4. Compare : votre branche (ex : `feature/backend/setup-and-pricing`).
5. Assignez **Lansana Coly** en Reviewer.

---

## 2. Principes & Autonomie de la Faction Backend

> [!NOTE]
> **Autonomie d'Organisation** :  
> En tant que Responsable Backend, **Ibrahima Khalilou Diallo** pilote l'architecture de données et l'API. Il a toute liberté pour répartir les tâches avec **Pathé Fall**, selon leurs affinités (ex : Ibrahima sur le moteur de prix et l'architecture des modèles, Pathé sur les migrations, le script de seed, les endpoints d'alertes et les tests).

---

## 3. Stack Technique Obligatoire
- **Framework** : `Python 3.13` + `Django 5`
- **API REST** : `Django REST Framework (DRF)`
- **CORS** : `django-cors-headers`
- **Base de Données** : `SQLite` (fichier `bmc_orders.sqlite3` pour la démo)

---

## 4. Chantiers & Spécifications Métier

### Chantier B1 — Modèles de Données & Relations
1. **`Category`** : `name`, `slug`, `icon`.
2. **`MenuItem`** :
   - `category` (ForeignKey vers Category)
   - `code` (identifiant unique : `tp-1`, `bg-1`, etc.)
   - `name`, `description`, `price` (en F CFA), `image_url`
   - `is_available` (booléen)
   - `is_daily_special` (booléen : **Plat du Jour**)
   - `popular` (booléen : best-sellers)
3. **`Order`** :
   - `order_ref` (référence unique : `BMC-XXXX`)
   - `customer_name`, `phone`, `address`, `notes`
   - `payment_method` (`cash`, `wave`, `orange_money`)
   - `payment_status` (`unpaid`, `pending`, `paid`)
   - `total_amount` (montant recalculé obligatoirement par le serveur)
   - `status` (`pending`, `confirmed`, `preparing`, `delivering`, `delivered`, `cancelled`)
   - `is_notified_to_admin` (booléen pour le suivi de la sonnerie et push)
   - `created_at`
4. **`OrderItem`** :
   - `order` (ForeignKey), `menu_item` (ForeignKey), `item_name`, `unit_price`, `quantity`, `subtotal`

---

### Chantier B2 — Moteur Absolu de Tarification (Règle Sécurité)
- **Le navigateur / client ne doit JAMAIS pouvoir définir le prix d'un article.**
- Le sérialiseur Django doit :
  1. Vérifier l'existence et la disponibilité de chaque `MenuItem` dans la base.
  2. Récupérer le `price` officiel en base.
  3. Calculer `subtotal = price * quantity` et `total_amount = sum(subtotals)`.
  4. Créer la commande et les lignes de commande dans un bloc `transaction.atomic()`.

---

### Chantier B3 — Catalogue Authentique BMC FOOD & Plat du Jour
- La commande de seed (`python manage.py seed_bmc`) insère les 32 produits réels :
  - **Tacos panés** (3 000 à 4 000 F CFA)
  - **Tacos jambon pané** (4 500 à 5 000 F CFA)
  - **Tacos Royal pané** (4 000 à 6 000 F CFA)
  - **Tacos Hot Dog pané** (4 500 à 6 000 F CFA)
  - **Tacos XL pané** (6 000 F CFA)
  - **Burgers** (2 000 à 3 000 F CFA)
  - **Tacos simples** (2 000 à 5 000 F CFA)
- Assigner un plat emblématique avec `is_daily_special = True`.

---

### Chantier B4 — Endpoints API REST
1. `GET /api/health/` : État du serveur.
2. `GET /api/menu/` : Liste des catégories et plats.
3. `GET /api/daily-special/` : Retourne le Plat du Jour actuel.
4. `PATCH /api/daily-special/<id>/toggle/` : Active / désactive le Plat du Jour (utilisé par l'Admin).
5. `POST /api/orders/` : Création et recalcul côté serveur (Espèces, Wave, OM).
6. `GET /api/orders/` : Liste des commandes pour l'admin (avec filtres de statut).
7. `GET /api/orders/<ref>/` : Détail complet d'une commande avec ses articles.
8. `PATCH /api/orders/<ref>/status/` : Mise à jour du statut.
9. `GET /api/orders/events/unnotified/` : Commandes non encore notifiées (déclencheur pour l'alerte sonore et push).
10. `POST /api/orders/events/unnotified/` : Acquittement de l'alerte par l'admin.

---

## 5. Critères d'Audit par Lansana Coly
- [ ] Tout le code backend est bien confiné dans `backend/`.
- [ ] Modèles et migrations sans conflits.
- [ ] Calcul des prix infalsifiable vérifié.
- [ ] Endpoints testés et documentés.
- [ ] PR propre ouverte vers `develop`.
