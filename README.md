# BMC FOOD — Prototype Web Fonctionnel MVP

> Développé par **Teranga Labs**  
> **Sponsor** : Pape Aliou Sène (Directeur Général)  
> **Chef de Projet & Lead Technique** : Lansana Coly  
> **Architecture & Développement** : Antigravity (IA) en synergie avec l'équipe projet

---

## 🌟 Aperçu du Projet

Ce prototype permet de faire une démonstration interactive de 5 à 8 minutes auprès du client BMC FOOD afin de valider le parcours complet de commande en ligne :
1. **Découverte du catalogue** : 32 produits réels répartis en 7 catégories (Tacos panés, Burgers, Tacos simples, Sauces...) avec prix officiels en F CFA.
2. **Panier dynamique** : Ajout/retrait d'articles, calcul en temps réel et persistance dans le navigateur.
3. **Passage de commande** : Formulaire coordonnées, bouton de géolocalisation GPS assistée, et choix du paiement (**Espèces à la livraison** ou **Orange Money**).
4. **Sécurité & Intégrité** : Recalcul automatique et obligatoire de tous les montants côté serveur (Express + SQLite).
5. **Dashboard Administrateur Démo** : Visualisation en direct des commandes entrantes, consultation des articles et changement d'état (En cuisine, En livraison, Livrée).

---

## 🚀 Démarrage Rapide

### Prérequis
- [Node.js](https://nodejs.org/) (v18+)

### 1. Lancer l'API Back-end
```bash
cd server
npm install
npm run dev
```
> Le serveur démarre sur **http://localhost:5000** et initialise automatiquement la base SQLite (`data/bmc_orders.db`) avec le catalogue officiel.

### 2. Lancer l'Interface Client Front-end
```bash
cd client
npm install
npm run dev
```
> L'application est accessible sur **http://localhost:5173**.

---

## 🧭 Scénario de Démonstration Client (5 à 8 min)

1. **Page d'accueil & Branding (1 min)** :
   - Ouvrir `http://localhost:5173` sur un mobile ou en mode émulation mobile (F12).
   - Mettre en valeur l'univers BMC FOOD, les horaires (11h00 — 02h00) et les numéros de commande (`77 856 13 13` / `77 106 75 75`).
2. **Choix des plats (2 min)** :
   - Filtrer par catégorie (ex: *Burgers* ou *Tacos panés*).
   - Ajouter un *Tacos viande pané* (3 500 F CFA) et un *Burger complet* (2 000 F CFA).
3. **Validation & Choix du Paiement (2 min)** :
   - Ouvrir le panier, vérifier le total (5 500 F CFA).
   - Cliquer sur « Valider la commande », renseigner le nom et le téléphone.
   - Cliquer sur « 📍 Me localiser (GPS) » pour illustrer la détection automatique.
   - Choisir *Espèces à la livraison* ou tester la simulation *Orange Money*.
   - Cliquer sur « Confirmer ».
4. **Écran de Confirmation (1 min)** :
   - Montrer la référence unique générée (`BMC-XXXX`).
5. **Tableau de Bord Admin (2 min)** :
   - Cliquer sur « Voir en Admin » (ou le bouton en haut à droite).
   - Montrer au client que sa commande vient d'apparaître instantanément dans le tableau de bord avec tous ses articles et le montant recalculé.
   - Changer le statut en *« En cuisine »* puis *« En livraison »*.

---

## 🛠️ Architecture Technique

```text
Projet BMC/
├── client/                     # Front-end React + Vite
│   ├── public/images/          # Photos réelles & flyers du restaurant
│   └── src/
│       ├── components/         # Header, Hero, MenuSection, CartDrawer, CheckoutModal, AdminDashboard
│       ├── context/            # CartContext (gestion d'état panier + localStorage)
│       └── services/api.js     # Client API REST
├── server/                     # API REST Node.js & Express
│   ├── data/                   # bmc_orders.db (SQLite)
│   └── src/
│       ├── db/                 # Connexion et script de seed (db.js, seed.js)
│       ├── controllers/        # Logique métier & recalcul serveur (ordersController.js, menuController.js)
│       └── app.js              # Configuration Express et routes
└── docs/                       # Dossier de cadrage et plan d'exécution
```

---

## 📞 Contacts Utiles (BMC FOOD)
- **Téléphones** : 77 856 13 13 / 77 106 75 75
- **Localisation** : Dakar, Sénégal
