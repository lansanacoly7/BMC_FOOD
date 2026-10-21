# Feuille de Route & Guide de Travail — Faction Frontend & Design

> **Responsable Faction** : El Hadji Massogui Diop  
> **Contributeurs** : Maimouna Sall, Pape Aliou Sène  
> **Supervision & Validation PR** : Lansana Coly (Lead Technique)  
> **Dépôt GitHub** : [https://github.com/lansanacoly7/BMC_FOOD](https://github.com/lansanacoly7/BMC_FOOD)

---

## 1. Comment Travailler sur GitHub & Où Mettre Vos Fichiers

### 📁 Emplacement Obligatoire des Fichiers
Chaque projet frontend a son propre dossier dédié à la racine du dépôt :

```text
BMC_FOOD/
├── client_website/           <-- [METTRE ICI TOUT LE CODE DU SITE WEB CLIENT]
│   ├── src/                  # Composants React, pages, styles Tailwind, hooks
│   ├── public/               # Images, logos, favicon
│   ├── package.json          # Dépendances npm
│   └── vite.config.ts        # Configuration Vite
│
├── admin_app/                <-- [METTRE ICI TOUT LE CODE DE L'APP ADMIN]
│   ├── src/                  # Dashboard, système audio d'alerte, push
│   ├── package.json
│   └── vite.config.ts
│
└── docs/                     # Documentation et feuilles de route
```

> [!WARNING]
> **Ce qu'il ne faut JAMAIS committer** :
> Les dossiers `node_modules/`, `dist/`, `.env.local` et `.vscode/` sont strictement exclus par `.gitignore`. Ne jamais forcer leur ajout.

---

### 🌿 Branches de Travail Assignées
Le dépôt est organisé par fonctionnalités. Vous ne travaillez **JAMAIS sur `main`** :

- **Pour le Site Web Client** : branche `feature/frontend/client-website`
- **Pour l'Application Admin** : branche `feature/frontend/admin-app`
- **Sous-branches autorisées** : Si vous découpez une tâche entre vous, créez une sous-branche nommée `feature/frontend/<nom-de-votre-tache>`.

---

### 🛠️ Commandes Git Pas à Pas pour l'Équipe

#### 1. Cloner le projet (la première fois)
```bash
git clone https://github.com/lansanacoly7/BMC_FOOD.git
cd BMC_FOOD
git fetch --all
```

#### 2. Se positionner sur sa branche de travail
- Pour le Site Web Client :
  ```bash
  git checkout feature/frontend/client-website
  git pull origin develop
  ```
- Pour l'Application Admin :
  ```bash
  git checkout feature/frontend/admin-app
  git pull origin develop
  ```

#### 3. Coder et faire des commits réguliers et clairs
Faites des commits atomiques au format standard :
- `feat(client): composant plat du jour avec animation framer-motion`
- `style(client): design responsive mobile des cartes de tacos`
- `feat(admin): alerte sonore web audio a la reception d'une commande`
- `fix(cart): correction du calcul du sous-total du panier`

Exemple de commande :
```bash
git add client_website/
git commit -m "feat(client): integration du panier tiroir coulissant anime"
```

#### 4. Pousser son travail sur GitHub
```bash
git push origin <nom-de-votre-branche>
```

#### 5. Ouvrir une Pull Request (PR) pour faire valider son travail
Une fois votre module fonctionnel :
1. Allez sur GitHub : [https://github.com/lansanacoly7/BMC_FOOD/pulls](https://github.com/lansanacoly7/BMC_FOOD/pulls)
2. Cliquez sur **« New pull request »**.
3. Base : **`develop`** (⚠️ **JAMAIS `main`**).
4. Compare : votre branche (ex : `feature/frontend/client-website`).
5. Assignez **Lansana Coly** en Reviewer.

---

## 2. Principes & Autonomie de la Faction

> [!NOTE]
> **Autonomie d'Organisation** :  
> En tant que Responsable Design & Frontend, **El Hadji Massogui Diop** a toute latitude pour reformuler, réorganiser et redistribuer les modules ci-dessous entre lui-même, Maimouna Sall et Pape Aliou Sène selon leurs disponibilités et expertises. L'équipe est collectivement garante du rendu final.

### Rôles Conseillés au sein de la Faction :
- **El Hadji Massogui Diop** : Direction artistique, maquettes, design system Tailwind, animations Framer Motion, revue d'intégration.
- **Maimouna Sall** : Intégration des composants React/TS, logique du panier, liaison avec les formulaires et responsive mobile.
- **Pape Aliou Sène** : Apport des données réelles du restaurant BMC (photos, spécialités, prix, retours d'usage), participation à la maquette et recette visuelle.

---

## 3. Stack Technique Obligatoire
- **Framework & Bundler** : `React 18/19` + `Vite` + `TypeScript`
- **Style** : `Tailwind CSS`
- **Animations & Micro-interactions** : `Framer Motion` (Motion)
- **Icônes** : `lucide-react`
- **Communication API** : `fetch` ou `axios` vers l'API Django REST (`http://localhost:8000/api/`)

---

## 4. Spécifications des Deux Produits à Livrer

### Produit 1 : Le Site Web Client (Mobile-First Strict)
*Dossier cible : `client_website/`*

1. **Accueil & Plat du Jour** :
   - Bandeau supérieur dynamique : **Plat du Jour** en avant-première avec badge animé.
   - Sélecteur de catégories horizontal tactile (Tacos panés, Burgers, Tacos simples, Sauces).
   - Cartes produits tactiles avec prix clair en F CFA, photo et bouton `+` animé avec feedback tactile.
2. **Tiroir Panier Animé (Motion Bottom-Sheet)** :
   - Glisse depuis le bas de l'écran lors du clic sur le panier.
   - Modification intuitive des quantités, affichage clair du sous-total.
3. **Checkout Épuré & Paiement 3-en-1** :
   - Coordonnées minimales : Nom, Téléphone, Adresse (avec bouton géolocalisation assistée).
   - Sélecteur de paiement visuel :
     - 💵 **Espèces à la livraison**
     - 🌊 **Wave** (avec simulation ou affichage du QR code/numéro de paiement)
     - 🍊 **Orange Money** (avec simulation de transaction marchande)
   - Soumission vers l'API backend (`POST /api/orders/`).
   - Écran de confirmation avec référence commande `BMC-XXXX`.

---

### Produit 2 : L'Application Web Admin Restaurateur
*Dossier cible : `admin_app/`*

1. **Tableau de Bord & Flux des Commandes** :
   - Interface claire et contrastée (optimisée pour tablette/ordinateur en caisse ou cuisine).
   - Liste dynamique des commandes avec polling régulier vers l'API.
   - Boutons de mise à jour de statut en 1 clic :  
     `En attente` $\rightarrow$ `En préparation` $\rightarrow$ `En livraison` $\rightarrow$ `Livrée`.
2. **Système d'Alertes Actives (Sonnerie & Push)** :
   - **Alerte Sonore (Bip / Carillon)** : Déclenchée via Web Audio dès qu'une commande est reçue. La sonnerie retentit jusqu'à ce que l'administrateur clique sur « Prendre en charge ».
   - **Notifications Push Navigateur** : Titre *« Nouvelle commande BMC-XXXX »*, Corps *« Montant : X XXX F CFA »*.
3. **Gestionnaire du Plat du Jour** :
   - Sélecteur permettant au restaurateur d'activer/désactiver le plat du jour en direct.

---

## 5. Critères d'Audit par Lansana Coly
- [ ] Aucun fichier hors du dossier `client_website/` et `admin_app/`.
- [ ] Zéro erreur TypeScript ou warning bloquant dans la console.
- [ ] Test responsive validé sur smartphone (largeurs 360px à 414px).
- [ ] PR propre ouverte vers `develop`.
