# 📢 POINT D'ÉTAPE PROJET BMC FOOD — VALIDATION BACKEND & LANCEMENT INTÉGRATION FRONTEND

> **De** : Lansana Coly (Chef de Projet & Lead Technique)
> 
> 
> **À** : Toute l'équipe (Pathé Fall, El Hadji Massogui Diop, Maimouna Sall, Pape Aliou Sène, Ibrahima Diallo)
> 
> **Dépôt GitHub** : https://github.com/lansanacoly7/BMC_FOOD
> 

---

Salut à toute l'équipe,

Nous venons de franchir une étape majeure sur le projet BMC FOOD !

Suite à un audit complet du code et des livrables, l'API Backend est désormais **100% stabilisée, documentée et sécurisée** (87 tests unitaires au vert, conformité OpenAPI 3.0 et intégration continue CI).

Voici les directives opérationnelles pour chaque faction afin d'enchaîner directement sur l'intégration finale :

---

## ⚙️ 1. Pour la Faction Backend (Pathé Fall & Ibrahima Diallo)

Un grand bravo à **Pathé Fall** pour sa prise en main rigoureuse du rôle de Responsable Backend et la finalisation exemplaire des plans P10-P20 et I10-I22.

👉 **FEU VERT OFFICIEL POUR LA PULL REQUEST :**
Pathé, tu peux ouvrir dès maintenant la PR officielle sur GitHub :

1. Rends-toi sur : https://github.com/lansanacoly7/BMC_FOOD/pulls
2. Clique sur **« New pull request »**
3. Sélectionne :
    - Base branch : **`develop`** (⚠️ **JAMAIS `main`**)
    - Compare branch : **`feature/backend/setup-and-pricing`**
4. Titre de la PR :
`feat(backend): finalisation integrale du moteur de prix, 43 plats et securite (Plan 10/10)`
5. Assigne-moi en Reviewer (`lansanacoly7`) et assigne-toi (`pathe-21`).
6. Je validerai et fusionnerai la branche dès que les checks GitHub Actions seront passés.

---

## 🎨 2. Pour la Faction Frontend & Design (El Hadji Diop & Maimouna Sall)

L'API est prête pour le raccordement direct de vos deux applications : le **Site Client Mobile** (`client_website/`) et l'**App Admin Cuisine** (`admin_app/`).

### 📌 Repères d'Accès & Documentation :

- **Serveur local** : `http://localhost:8000/api/`
- **Swagger UI Interactif** (pour tester tous les endpoints au clic) : `http://localhost:8000/api/docs/`

---

### 📱 A. Câblage du Site Web Client (`client_website/`)

1. **Catalogue des 43 Plats Officiels (Maimouna - MS-2)** :
    - `GET /api/menu/` : Renvoie les 7 catégories et les 43 plats réels du restaurant.
    - Les images pointent directement vers `/images/products/<slug>.webp` (ex: `/images/products/tacos-viande-pane.webp`), déjà synchronisées dans votre dossier `public/images/products/`.
2. **Plat du Jour Dynamique (El Hadji & Maimouna - EH-1 / MS-2)** :
    - `GET /api/daily-special/` : Renvoie le plat du jour activé. Si aucun n'est coché en caisse, l'API bascule automatiquement sur le premier best-seller avec `"is_fallback": true` (votre bandeau n'est jamais vide).
3. **Validation Panier & Checkout (Maimouna & El Hadji - MS-3 / EH-2)** :
    - `POST /api/orders/`
    - **Body JSON attendu** :
        
        ```json
        {
          "customer_name": "Amadou Diallo",
          "phone": "778561313",
          "address": "Almadies, Dakar (près de la brioche dorée)",
          "notes": "Sans piment, sauce algérienne",
          "payment_method": "wave", // ou "orange_money", "cash"
          "items": [
            { "id": "tp-1", "quantity": 2 },
            { "id": "bg-1", "quantity": 1 }
          ]
        }
        ```
        
    - ⚠️ **Sécurité** : N'envoyez aucun prix côté client. Le backend lit les codes/quantités et recalcule les montants en base.
    - **Réponse 201** : Renvoie le total officiel et la référence unique à 6 chiffres : `BMC-XXXXXX` (ex: `BMC-849201`).
4. **Nouveau : Suivi de Commande Client / Tracker en 4 étapes (Maimouna)** :
    - `GET /api/orders/track/<ref>/` (ex: `GET /api/orders/track/BMC-849201/`)
    - Renvoie le statut (`En attente` ➔ `En cuisine` ➔ `En livraison` ➔ `Livrée`), les articles et le montant total, **sans aucune donnée privée** (ni nom, ni téléphone, ni adresse) pour une confidentialité totale.

---

### 🖥️ B. Câblage de l'Application Admin Cuisine (`admin_app/`)

1. **Connexion & Authentification (El Hadji - EH-3)** :
    - `POST /api/auth/token/` avec `{"username": "admin", "password": "..."}` pour récupérer le jeton DRF.
    - À passer dans le header de toutes les requêtes admin : `Authorization: Token <token>`.
2. **Détection des Nouvelles Commandes & Carillon Sonore (El Hadji - EH-3)** :
    - `GET /api/orders/events/unnotified/` (polling toutes les 5 secondes).
    - Dès que `has_new_orders: true`, déclenchez en boucle le carillon Web Audio et la notification push du navigateur !
3. **Acquittement & Arrêt du Bip (Maimouna & El Hadji - MS-4)** :
    - `POST /api/orders/events/unnotified/` avec un corps vide `{}` : acquitte toutes les commandes en attente et coupe la sonnerie immédiatement en 1 clic.
4. **Tableau de Bord & Changement de Statut (Maimouna - MS-4)** :
    - `GET /api/orders/?status=pending` (avec pagination optionnelle `?page=1&page_size=10`).
    - `PATCH /api/orders/<ref>/status/` avec `{"status": "preparing"}` (ou `delivering`, `delivered`, `cancelled`).
    - *(Règle : si une commande déjà payée est annulée, le paiement passe automatiquement à `refund_pending`)*.
5. **Switch Plat du Jour Restaurateur (Maimouna & Pape Aliou - MS-4 / PA-3)** :
    - `PATCH /api/daily-special/<id>/toggle/` pour changer le plat vedette depuis la caisse.

---

## 💼 3. Pour le Sponsor & Métier (Pape Aliou Sène)

- Le catalogue de 43 spécialités réelles de BMC Food est désormais intégralement présent en base.
- Les 4 nouveaux visuels de canettes que tu as ajoutés ont bien été réceptionnés sur `develop`.
- Dès qu'El Hadji et Maimouna ont relié le panier et le son de la cuisine, nous calerons notre **répétition générale chronométrée de 5 à 8 minutes** pour la présentation finale aux dirigeants du restaurant.

---

### 🎯 Prochaine Étape

1. **Pathé** soumet sa PR vers `develop`.
2. **El Hadji & Maimouna** connectent les flux API en local.
3. Répétition générale de démo en direct !

Bon code à tous, le rendu final s'annonce exceptionnel !