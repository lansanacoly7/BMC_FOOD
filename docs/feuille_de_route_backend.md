# Feuille de Route — Faction Backend & API

> **Responsable Faction** : Ibrahima Khalilou Diallo  
> **Contributeur** : Pathé Fall (Assistance Backend)  
> **Supervision & Audit** : Lansana Coly (Lead Technique)  
> **Dépôt Git** : `BMC_FOOD` | **Branches de travail** : `feature/backend/*`

---

## 1. Principes & Autonomie de l'Équipe

> [!NOTE]
> **Flexibilité du Dispatching** :  
> En tant que Responsable Backend, **Ibrahima Khalilou Diallo** pilote l'architecture de données et l'API. Il a toute liberté pour répartir les tâches ci-dessous avec **Pathé Fall**, selon leurs affinités (ex : Ibrahima sur le moteur de prix et l'architecture des modèles, Pathé sur les migrations, le script de seed, les endpoints d'alertes et les tests unitaires).

---

## 2. Stack Technique Obligatoire
- **Framework** : `Python 3.13` + `Django 5`
- **API REST** : `Django REST Framework (DRF)`
- **CORS** : `django-cors-headers`
- **Base de Données** : `SQLite` (fichier `bmc_orders.sqlite3` pour la démo)

---

## 3. Chantiers & Spécifications Métier

### Chantier B1 — Modèles de Données & Relations
1. **`Category`** : `name`, `slug`, `icon`.
2. **`MenuItem`** :
   - `category` (ForeignKey vers Category)
   - `code` (identifiant unique pour les commandes : `tp-1`, `bg-1`, etc.)
   - `name`, `description`, `price` (en F CFA), `image_url`
   - `is_available` (booléen)
   - `is_daily_special` (booléen : **Plat du Jour**)
   - `popular` (booléen : best-sellers)
3. **`Order`** :
   - `order_ref` (référence unique visible client : `BMC-XXXX`)
   - `customer_name`, `phone`, `address`, `notes`
   - `payment_method` (`cash`, `wave`, `orange_money`)
   - `payment_status` (`unpaid`, `pending`, `paid`)
   - `total_amount` (montant total calculé obligatoirement par le serveur)
   - `status` (`pending`, `confirmed`, `preparing`, `delivering`, `delivered`, `cancelled`)
   - `is_notified_to_admin` (booléen pour le suivi des alertes sonores/push)
   - `created_at`
4. **`OrderItem`** :
   - `order` (ForeignKey), `menu_item` (ForeignKey), `item_name`, `unit_price`, `quantity`, `subtotal`

---

### Chantier B2 — Moteur Absolu de Tarification (Règle Métier Sécurité)
- **Le navigateur / client ne doit JAMAIS pouvoir définir le prix d'un article.**
- Le payload de commande reçu contient uniquement :
  ```json
  {
    "customer_name": "Lansana Coly",
    "phone": "77 106 75 75",
    "address": "Ngor, Dakar",
    "payment_method": "wave",
    "items": [
      { "id": "tp-1", "quantity": 2 }
    ]
  }
  ```
- Le sérialiseur Django doit :
  1. Vérifier l'existence et la disponibilité de chaque `MenuItem` dans la base.
  2. Récupérer le `price` officiel en base.
  3. Calculer `subtotal = price * quantity` et `total_amount = sum(subtotals)`.
  4. Créer la commande et les lignes de commande dans un bloc `transaction.atomic()`.

---

### Chantier B3 — Catalogue Authentique BMC FOOD & Plat du Jour
- Implémenter une commande de seed (`python manage.py seed_bmc`) insérant les 32 produits réels :
  - **Tacos panés** (Viande: 3 500, Poulet: 3 500, Mixte: 4 000, Jambon: 3 000 F CFA)
  - **Tacos jambon pané** (Viande: 4 500, Poulet: 4 500, Mixte: 5 000 F CFA)
  - **Tacos Royal pané** (Viande jambon royal: 5 000, Mixte jambon royal: 6 000 F CFA...)
  - **Tacos Hot Dog pané** (4 500 à 6 000 F CFA)
  - **Tacos XL pané** (6 000 F CFA)
  - **Burgers** (Complet: 2 000, Double: 2 500, Jambon: 2 500, Royal: 3 000 F CFA)
  - **Tacos simples** (2 000 à 5 000 F CFA)
  - Sauces associées (Fromagère, Samouraï, Algérienne, Barbecue, etc.)
- Assigner un plat emblématique (ex : *Tacos mixte jambon royal pané*) avec `is_daily_special = True`.

---

### Chantier B4 — Endpoints API REST
1. `GET /api/health/` : Contrôle d'état de l'API.
2. `GET /api/menu/` : Liste structurée des catégories et des plats disponibles.
3. `GET /api/daily-special/` : Retourne le ou les Plats du Jour actuels.
4. `PATCH /api/daily-special/<id>/toggle/` : Bascule l'état Plat du Jour (utilisé par l'Admin).
5. `POST /api/orders/` : Création et recalcul côté serveur d'une commande (Espèces, Wave, OM).
6. `GET /api/orders/` : Liste de toutes les commandes pour l'admin (avec filtres de statut).
7. `GET /api/orders/<ref>/` : Détail complet d'une commande avec ses articles.
8. `PATCH /api/orders/<ref>/status/` : Mise à jour du statut (`preparing`, `delivering`, etc.).
9. `GET /api/orders/events/unnotified/` : Retourne les commandes créées non encore notifiées à l'admin (pour déclencher la sonnerie et la notification push).
10. `POST /api/orders/events/unnotified/` : Marque les commandes comme notifiées (acquittement par l'admin).

---

## 4. Livrables Attendus pour l'Audit de Qualité

1. **Modèles et migrations Django sans conflits**.
2. **Calcul des prix infalsifiable** testé et validé.
3. **Endpoints testés** (Postman ou curl) avec gestion des erreurs 400 et 404 claires.
4. **Base SQLite pré-remplie** avec les données exactes du restaurant.
