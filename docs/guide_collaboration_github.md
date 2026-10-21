# Guide de Collaboration GitHub — Projet BMC FOOD

> **Dépôt Officiel** : [https://github.com/lansanacoly7/BMC_FOOD](https://github.com/lansanacoly7/BMC_FOOD)  
> **Chef de Projet & Lead Technique** : Lansana Coly  
> **Ce guide s'adresse à** : El Hadji Massogui Diop, Ibrahima Khalilou Diallo, Maimouna Sall, Pathé Fall, Pape Aliou Sène.

---

## 1. Organisation des Dossiers (Où mettre vos fichiers)

Pour éviter les conflits et que chacun sache exactement où coder, le dépôt est compartimenté en 3 répertoires principaux :

```text
BMC_FOOD/
├── backend/                  <-- [Équipe Backend : Ibrahima & Pathé]
│   ├── api/                  # Modèles Django, serializers, vues DRF, seed
│   ├── bmc_backend/          # Configuration Django (settings, urls, wsgi)
│   ├── manage.py             # Script de gestion Django
│   └── requirements.txt      # Dépendances Python
│
├── client_website/           <-- [Équipe Frontend : El Hadji, Maimouna, Pape Aliou]
│   ├── src/                  # Composants React, hooks, pages, styles Tailwind
│   │   ├── components/       # Header, MenuCard, DailySpecial, CartDrawer, CheckoutModal
│   │   ├── services/         # Client API vers le backend Django
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── admin_app/                <-- [Équipe Frontend & Admin : El Hadji & Maimouna]
│   ├── src/                  # Dashboard Admin, Audio Alert (sonnerie), Push Notifications
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                     # Spécifications, feuilles de route et guides
└── README.md                 # Présentation globale du projet
```

### 🚫 Ce qu'il ne faut JAMAIS committer (déjà exclu par `.gitignore`)
- `venv/` ou `.venv/` (l'environnement virtuel Python)
- `node_modules/` (les packages npm de React)
- `*.sqlite3` ou `*.db` (les bases de données locales)
- `dist/` (les dossiers de compilation)
- Fichiers temporaires de vos éditeurs (`.vscode/`, `.idea/`)

---

## 2. Démarrage : Cloner et Configurer le Projet

### Étape 1 : Cloner le dépôt
Ouvrez votre terminal et lancez :
```bash
git clone https://github.com/lansanacoly7/BMC_FOOD.git
cd BMC_FOOD
```

### Étape 2 : Récupérer toutes les branches
```bash
git fetch --all
git checkout develop
```
> [!IMPORTANT]
> **La branche de base pour démarrer vos travaux est TOUJOURS `develop`**, jamais `main` !

---

## 3. Workflow de Travail au Quotidien (Pas à Pas)

### Étape 1 : Se positionner sur sa branche de travail

#### 🔹 Pour l'Équipe Backend (Ibrahima & Pathé) :
Basculez sur la branche backend :
```bash
git checkout feature/backend/setup-and-pricing
```
*(Si vous voulez créer une sous-branche pour une tâche spécifique : `git checkout -b feature/backend/nom-de-votre-tache`)*

#### 🔹 Pour l'Équipe Frontend (El Hadji, Maimouna, Pape Aliou) :
Pour travailler sur le **Site Web Client** :
```bash
git checkout feature/frontend/client-website
```
Pour travailler sur l'**Application Admin Restaurateur** :
```bash
git checkout feature/frontend/admin-app
```
*(Possibilité de créer une sous-branche : `git checkout -b feature/frontend/nom-de-votre-tache`)*

---

### Étape 2 : Toujours synchroniser avant de coder
Avant de commencer votre journée de travail, récupérez toujours les dernières mises à jour pour éviter les conflits :
```bash
git pull origin develop
```

---

### Étape 3 : Travailler et faire des commits réguliers et clairs
Ne faites pas un seul commit géant à la fin de la semaine. Faites des commits fréquents, ciblés et explicites en suivant la convention :

- `feat:` pour une nouvelle fonctionnalité (ex: `feat(menu): ajout du composant plat du jour avec animation motion`)
- `fix:` pour une correction de bug (ex: `fix(api): correction du calcul du total des commandes`)
- `style:` pour du design / CSS / Tailwind (ex: `style(client): harmonisation des cartes produits sur mobile`)
- `refactor:` pour une amélioration de code sans changement de fonctionnalité
- `docs:` pour de la documentation

**Exemple concret :**
```bash
git status
git add client_website/src/components/DailySpecial.tsx
git commit -m "feat(client): composant plat du jour anime avec framer-motion"
```

---

### Étape 4 : Pousser vos modifications sur GitHub
Envoyez votre travail sur votre branche distante :
```bash
git push origin <nom-de-votre-branche>
```
*(Exemple : `git push origin feature/frontend/client-website`)*

---

### Étape 5 : Ouvrir une Pull Request (PR) pour validation
Une fois votre bloc de travail terminé et testé en local :
1. Rendez-vous sur GitHub : [https://github.com/lansanacoly7/BMC_FOOD/pulls](https://github.com/lansanacoly7/BMC_FOOD/pulls)
2. Cliquez sur **« New pull request »**.
3. **Cible (base)** : sélectionnez **`develop`** (⚠️ **JAMAIS `main` directement**).
4. **Source (compare)** : sélectionnez votre branche (ex : `feature/frontend/client-website`).
5. Renseignez un titre clair et décrivez ce qui a été réalisé et testé.
6. Assigner **Lansana Coly** en tant que **Reviewer**.

---

## 4. Règles d'Or de l'Équipe Teranga Labs

1. **Interdiction formelle de `git push --force`** : Cela efface le travail des collègues.
2. **Ne jamais committer de code cassé sur `develop`** : Assurez-vous que votre projet démarre sans erreur (`python manage.py runserver` ou `npm run dev`) avant d'ouvrir votre PR.
3. **Communication en cas de blocage** : Si vous rencontrez un conflit Git (`merge conflict`), ne tentez pas de manipulations destructrices ; contactez immédiatement Lansana Coly.
4. **Validation obligatoire** : Aucune branche n'est fusionnée dans `main` sans la revue et l'approbation du Lead Technique.
