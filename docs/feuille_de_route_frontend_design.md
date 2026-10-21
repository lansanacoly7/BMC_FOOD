# Feuille de Route — Faction Frontend & Design

> **Responsable Faction** : El Hadji Massogui Diop  
> **Contributeurs** : Maimouna Sall, Pape Aliou Sène  
> **Supervision & Audit** : Lansana Coly (Lead Technique)  
> **Dépôt Git** : `BMC_FOOD` | **Branches de travail** : `feature/frontend/*` et `feature/design/*`

---

## 1. Principes & Autonomie de l'Équipe

> [!NOTE]
> **Flexibilité du Dispatching** :  
> En tant que Responsable Design & Frontend, **El Hadji Massogui Diop** a toute latitude pour réorganiser, redécouper ou redistribuer les modules ci-dessous entre lui-même, Maimouna Sall et Pape Aliou Sène selon leurs disponibilités et expertises. L'équipe est collectivement responsable de livrer un site web client irréprochable et une application admin fonctionnelle.

### Rôles Recommandés au sein de la Faction :
- **El Hadji Massogui Diop** : Direction artistique, charte visuelle Tailwind, composants Framer Motion, revue d'intégration.
- **Maimouna Sall** : Intégration des composants React/TS, logique du panier, liaison avec les formulaires et responsive mobile.
- **Pape Aliou Sène** : Apport des données réelles du restaurant BMC (photos, spécialités, prix, retours d'usage), participation à la maquette et recette visuelle.

---

## 2. Stack Technique Obligatoire
- **Framework & Bundler** : `React 18/19` + `Vite` + `TypeScript`
- **Style** : `Tailwind CSS`
- **Animations & Micro-interactions** : `Framer Motion` (Motion)
- **Icônes** : `lucide-react`
- **Communication API** : `fetch` ou `axios` vers l'API Django REST Framework

---

## 3. Les Deux Produits à Développer

### Produit 1 : Le Site Web Client (Mobile-First Strict)
Ce n'est pas une application lourde, mais un **site web moderne et fluide** destiné aux clients passant commande depuis leur smartphone à Dakar.

#### Module C1 — Accueil & Mise en Avant du Plat du Jour
- En-tête avec identité visuelle BMC Food, contacts d'urgence (`77 856 13 13` / `77 106 75 75`).
- Bannière animée dédiée au **Plat du Jour** (récupéré dynamiquement depuis l'API `/api/daily-special/`), avec badge attractif et bouton d'ajout direct au panier.
- Barre de défilement horizontal tactile des catégories (Tacos panés, Burgers, Tacos simples, Sauces...).
- Cartes de plats épurées : photo, nom, description courte, prix en F CFA, bouton d'ajout animé avec micro-feedback visuel.

#### Module C2 — Tiroir Panier Animé (Motion Bottom-Sheet)
- Tiroir coulissant depuis le bas de l'écran lors du clic sur le panier.
- Gestion fluide des quantités (`+`, `-`, supprimer).
- Calcul en temps réel du sous-total.
- Bouton clair d'accès à la commande.

#### Module C3 — Parcours Commande & Paiement 3-en-1
- Formulaire minimaliste : Nom, Téléphone, Adresse de livraison.
- Bouton « 📍 Me localiser (GPS) » utilisant la géolocalisation du navigateur avec solution de repli textuelle.
- Sélecteur de paiement graphique :
  1. 💵 **Espèces à la livraison**
  2. 🌊 **Wave** (avec simulation ou affichage du QR code/numéro de paiement)
  3. 🍊 **Orange Money** (avec simulation de transaction marchande)
- Soumission vers l'API backend (`POST /api/orders/`).
- Écran de confirmation avec affichage de la référence unique `BMC-XXXX`.

---

### Produit 2 : L'Application Web Admin Restaurateur
Poste de pilotage destiné au gérant et à la cuisine de BMC Food.

#### Module A1 — Tableau de Bord & Flux des Commandes
- Interface claire et contrastée (optimisée pour tablette/ordinateur en caisse ou cuisine).
- Liste dynamique des commandes avec rafraîchissement ou polling régulier.
- Affichage des informations clés : Réf, heure, nom, téléphone, adresse, moyen de paiement, montant total recalculé.
- Boutons d'action pour faire progresser le statut en 1 clic :  
  `En attente` $\rightarrow$ `En préparation` $\rightarrow$ `En livraison` $\rightarrow$ `Livrée`.

#### Module A2 — Système d'Alertes Actives (Sonnerie & Push)
- **Alerte Sonore (Bip / Carillon)** :
  - Déclenchée via l'API Web Audio dès qu'une commande avec `is_notified_to_admin=false` est détectée.
  - La sonnerie persiste ou retentit jusqu'à ce que l'administrateur clique sur « Prendre en charge » (acquittement).
- **Notifications Push Navigateur** :
  - Utilisation de la `Notification API` standard.
  - Demande d'autorisation à l'ouverture de l'application admin.
  - Notification avec titre *« Nouvelle commande BMC-XXXX »* et corps *« Montant : X XXX F CFA »*.

#### Module A3 — Gestionnaire du Plat du Jour
- Switch permettant au gérant de sélectionner quel plat de la carte devient le « Plat du Jour » pour le site client.

---

## 4. Livrables Attendus pour l'Audit de Qualité

1. **Code source propre et typé** dans le dossier `client_website/` et `admin_app/`.
2. **Pas d'erreurs TypeScript ou console**.
3. **Responsive testé** sur plusieurs formats mobiles (360px, 390px, 414px) et desktop.
4. **Branches Git respectées** : Commits réguliers sur `feature/frontend/*`.
