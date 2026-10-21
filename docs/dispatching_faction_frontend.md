# Plan de Dispatching & Spécifications Opérationnelles — Faction Frontend & Design

> **Projet** : BMC FOOD — Prototype Web Fonctionnel MVP  
> **Auteur & Responsable Faction** : El Hadji Massogui Diop  
> **Contributeurs** : Maimouna Sall, Pape Aliou Sène  
> **Supervision & Validation Lead Tech** : Lansana Coly  
> **Version** : 1.0 — Document Opérationnel de Référence  
> **Dépôt Git** : `lansanacoly7/BMC_FOOD` | **Branches cibles** : `feature/frontend/*`

---

## 1. Vision Stratégique & Cadre d'Exécution

La Faction Frontend & Design a la responsabilité de concevoir et livrer deux applications web d'excellence :
1. **Le Site Web Client (Mobile-First)** : Une expérience de commande en ligne ultra-fluide pour smartphone à Dakar (Tacos, Burgers, Sauces), mettant en vedette le *Plat du Jour* avec paiement adapté au marché sénégalais (**Espèces, Wave, Orange Money**).
2. **L'Application Web Admin Restaurateur** : Un tableau de bord temps réel pour la cuisine et la caisse de BMC Food, doté d'une **alerte sonore persistante (carillon Web Audio)** et de notifications push pour ne rater aucune commande.

Toutes les interfaces doivent être testées et optimisées pour les résolutions mobiles (360px, 390px, 414px) et répondre aux critères de la grille d'audit de Lansana Coly.

---

## 2. Standards Techniques Communs & Conventions

- **Framework & Bundler** : React 18/19 + TypeScript + Vite
- **Styles & Design System** : Tailwind CSS
  - *Orange braise BMC* : `#F97316` (accent chaud)
  - *Jaune moutarde doré* : `#F59E0B` (badges, prix, mise en valeur)
  - *Fond sombre / Noir charbon* : `#18181B` (contraste élevé, lisibilité cuisine)
  - *Blanc cassé* : `#FAFAFA` (fond épuré client)
- **Animations** : Framer Motion (`motion.div`, `AnimatePresence`)
- **Icônes** : `lucide-react`
- **Audio & Push** : Web Audio API native (synthèse d'ondes sonores) + HTML5 Notification API
- **Structure des branches Git** :
  - Branche principale frontend : `feature/frontend/client-website`
  - Branche admin : `feature/frontend/admin-app`
  - Branches individuelles : `feature/frontend/[prenom]-[module]` (ex: `feature/frontend/elhadji-motion`, `feature/frontend/maimouna-cart`)

---

## 3. Fiches de Mission Ultra-Détaillées par Équipier

```mermaid
graph TD
    subgraph ElHadji["El Hadji Massogui Diop (Lead & Motion)"]
        EH1["Setup Socle Vite + TS + Tailwind"]
        EH2["Module C2 : Bottom-Sheet Panier Framer Motion"]
        EH3["Module A2 : Carillon Web Audio & Push Notifications"]
        EH4["Revue de code & Intégration Mobile"]
    end

    subgraph Maimouna["Maimouna Sall (Composants & Logique)"]
        MS1["CartContext & Persistance LocalStorage"]
        MS2["Module C1 : En-tête, Filtres & Cartes Plats"]
        MS3["Module C3 : Formulaire, GPS Assisté & Checkout"]
        MS4["Module A1 : Dashboard Commandes & Statuts"]
    end

    subgraph PapeAliou["Pape Aliou Sène (Métier, Assets & Paiements)"]
        PA1["Optimisation WebP des photos Projet BMC"]
        PA2["Module C3 : UX Paiements Wave, OM, Espèces"]
        PA3["Module A3 : Switch Plat du Jour"]
        PA4["Répétition Scénario Démo 5-8 min"]
    end

    EH1 --> MS2
    EH2 --> MS1
    PA1 --> MS2
    PA2 --> MS3
```

---

### 👤 Fiche 1 — El Hadji Massogui Diop
**Rôle** : Responsable Faction, Direction Artistique, Animations Avancées & Audio  
**Branches Git de travail** : `feature/frontend/client-website`, `feature/frontend/elhadji-*`

#### 📌 Tâche EH-1 : Initialisation du Socle Technique & Design System
* **Objectif** : Mettre en place l'environnement de développement, configurer Tailwind CSS avec la charte BMC Food, les polices Google Fonts et les types TypeScript partagés.
* **Fichiers impactés** :
  - `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`
  - `src/types/index.ts` (modèles `Product`, `Category`, `Order`, `OrderItem`, `PaymentMethod`, `OrderStatus`)
  - `src/index.css` (tokens de couleurs, styles de base)
* **Critères d'Acceptation (DoD)** :
  - Le projet compile avec `npm run dev` et `npm run build` sans avertissement TypeScript.
  - La palette BMC Food est disponible via classes Tailwind (`bg-bmc-orange`, `text-bmc-gold`, etc.).

#### 📌 Tâche EH-2 : Module C2 — Tiroir Panier Animé (*Bottom-Sheet* Framer Motion)
* **Objectif** : Créer l'expérience du panier coulissant depuis le bas de l'écran, optimisé pour une manipulation à une main sur smartphone.
* **Fichiers impactés** :
  - `src/components/cart/CartDrawer.tsx`
  - `src/components/cart/CartItemRow.tsx`
* **Spécifications d'Animation** :
  - Apparition fluide par glissement vertical (`initial={{ y: "100%" }} animate={{ y: 0 }}`).
  - Fermeture soit par clic sur le fond assombri (*backdrop backdrop-blur-sm*), soit par glissement vers le bas (*drag="y" dragConstraints={{ top: 0 }}*).
  - Micro-animations de rebond sur les boutons d'incrément/décrément (`scale: 0.95`).
* **Critères d'Acceptation (DoD)** :
  - Gestuelle tactile 60 FPS sur mobile.
  - Affichage instantané du récapitulatif des articles et du bouton d'action vers le formulaire.

#### 📌 Tâche EH-3 : Module A2 — Système d'Alertes Actives Cuisine (Sonnerie Web Audio & Push)
* **Objectif** : Créer le mécanisme d'alerte pour l'application admin garantissant qu'aucune commande entrante ne passe inaperçue en cuisine.
* **Fichiers impactés** :
  - `src/services/audioAlertService.ts`
  - `src/services/notificationService.ts`
  - `src/components/admin/AlertModal.tsx`
* **Spécifications Techniques** :
  - **Synthèse Sonore Web Audio** : Générer une mélodie à deux tons (ex: 880 Hz puis 1174 Hz) via un `AudioContext` natif, répétée toutes les 3 secondes tant que la commande n'a pas été acquittée par un clic sur « Prendre en charge ». Pas de dépendance de fichier MP3 externe pour éviter les erreurs de chargement réseau.
  - **Notification API** : Demander la permission à l'ouverture de l'admin. Envoyer la notification navigateur avec le titre *« 🔔 Nouvelle commande BMC-XXXX »* et le corps *« Montant : X XXX F CFA »*.
* **Critères d'Acceptation (DoD)** :
  - La sonnerie démarre dès qu'une commande `is_notified_to_admin === false` est reçue.
  - L'acquittement stoppe le son immédiatement et marque l'alerte comme traitée.

#### 📌 Tâche EH-4 : Revue de Code, Contrôle Qualité & Clôture de Branche
* **Objectif** : Vérifier le respect des standards, l'absence d'erreurs en console, et préparer les Pull Requests pour validation par Lansana Coly.

---

### 👤 Fiche 2 — Maimouna Sall
**Rôle** : Ingénieure Frontend, Intégration Composants & Connexions API  
**Branches Git de travail** : `feature/frontend/maimouna-*`

#### 📌 Tâche MS-1 : Gestionnaire d'État Global du Panier (`CartContext`)
* **Objectif** : Développer le contexte React permettant d'ajouter, soustraire, supprimer des articles, calculer le montant total et synchroniser les données dans le `localStorage`.
* **Fichiers impactés** :
  - `src/context/CartContext.tsx`
  - `src/hooks/useCart.ts`
* **Critères d'Acceptation (DoD)** :
  - Les articles restent enregistrés dans le panier même après un rechargement de la page (F5).
  - Le calcul du sous-total gère correctement les centimes et l'arrondi en Francs CFA.
  - Fournit les méthodes `addToCart()`, `removeFromCart()`, `updateQuantity()`, `clearCart()`.

#### 📌 Tâche MS-2 : Module C1 — En-tête, Défilement des Catégories & Grille des 32 Plats
* **Objectif** : Intégrer la page d'accueil du site client avec tous les produits réels de BMC Food.
* **Fichiers impactés** :
  - `src/components/client/Header.tsx` (Logo BMC, horaires 11h-02h, téléphones 77 856 13 13 / 77 106 75 75)
  - `src/components/client/DailySpecialBanner.tsx` (Mise en valeur animée du Plat du Jour)
  - `src/components/client/CategoryScroll.tsx` (Barre de défilement horizontal tactile des 7 catégories)
  - `src/components/client/ProductCard.tsx` (Carte avec photo optimisée, prix en F CFA, badge catégorie, bouton d'ajout)
* **Critères d'Acceptation (DoD)** :
  - Filtrage instantané des produits lors du clic sur une catégorie sans rechargement.
  - L'ajout d'un plat au panier déclenche un micro-feedback visuel (badge compteur qui s'anime).

#### 📌 Tâche MS-3 : Module C3 — Formulaire de Commande, Géolocalisation GPS & Soumission
* **Objectif** : Construire le parcours de validation de commande jusqu'à l'écran de confirmation final.
* **Fichiers impactés** :
  - `src/components/checkout/CheckoutModal.tsx`
  - `src/components/checkout/GPSLocator.tsx`
  - `src/components/checkout/OrderConfirmation.tsx`
* **Spécifications Métier** :
  - Champs requis : Nom & Prénom, Téléphone (validation format Sénégal +221 ou 9 chiffres), Adresse ou point de repère.
  - Bouton « 📍 Me localiser (GPS) » utilisant `navigator.geolocation.getCurrentPosition()`. Si accordé, convertir les coordonnées en texte de repère géographique ou latitude/longitude, avec champ de précision manuelle en repli.
  - Envoi de la commande vers l'API backend (`POST /api/orders/`).
  - Écran de succès affichant le numéro de suivi officiel : `BMC-XXXX`.
* **Critères d'Acceptation (DoD)** :
  - Validation client stricte des champs avant soumission.
  - En cas de succès, le panier est vidé et la confirmation est présentée avec un bouton de contact direct WhatsApp/Appel.

#### 📌 Tâche MS-4 : Module A1 — Tableau de Bord Cuisine & Gestion du Cycle de Vie
* **Objectif** : Développer l'interface de visualisation et de gestion des commandes pour le restaurateur.
* **Fichiers impactés** :
  - `src/components/admin/AdminDashboard.tsx`
  - `src/components/admin/OrderCard.tsx`
  - `src/components/admin/StatusBadge.tsx`
* **Spécifications Fonctionnelles** :
  - Affichage en colonnes Kanban ou liste contrastée selon les 4 états officiels :
    `En attente (pending)` $\rightarrow$ `En cuisine (preparing)` $\rightarrow$ `En livraison (delivering)` $\rightarrow$ `Livrée (delivered)`.
  - Bouton d'action en 1 clic pour faire passer la commande à l'état suivant via l'API (`PATCH /api/orders/{id}/status/`).
  - Polling automatique toutes les 5 à 10 secondes pour détecter les nouvelles commandes sans rafraîchir manuellement.
* **Critères d'Acceptation (DoD)** :
  - La progression du statut met à jour visuellement la commande sans latence.
  - Le montant recalculé par le serveur est clairement mis en valeur.

---

### 👤 Fiche 3 — Pape Aliou Sène
**Rôle** : Porteur Métier BMC, Responsable Assets Visuels, UX des Paiements Locaux & Démonstration  
**Branches Git de travail** : `feature/design/assets-and-ux`, `feature/frontend/*`

#### 📌 Tâche PA-1 : Traitement & Optimisation WebP des Photos Réelles BMC
* **Objectif** : Préparer tous les visuels du dossier [`Projet BMC/`](file:///c:/Users/DELL/OneDrive/Images/Документы/cours/BMC/Projet%20BMC) pour garantir un affichage instantané sur les téléphones mobiles 3G/4G à Dakar.
* **Livrables attendus** :
  - Dossier `client/public/images/products/`
  - Conversion des fichiers haute définition (ex: `099D05B3-D5DE-4DBB-B6C7-9B32B9411FC7.png`, 2.4 Mo) au format `.webp`.
  - Poids unitaire strict inférieur à **150 Ko** par image.
  - Nommage standardisé cohérent avec le seed du backend (ex: `tacos-viande-pane.webp`, `burger-complet.webp`).
* **Critères d'Acceptation (DoD)** :
  - Temps de chargement global du catalogue inférieur à 1,5 seconde sur mobile.

#### 📌 Tâche PA-2 : Module C3 (Partie Paiements) — Conception Visuelle Wave, OM et Espèces
* **Objectif** : Concevoir les interfaces de choix du moyen de paiement adaptées aux habitudes d'achat sénégalaises.
* **Fichiers impactés** :
  - `src/components/checkout/PaymentSelector.tsx`
  - `src/components/checkout/WavePaymentModal.tsx`
  - `src/components/checkout/OrangeMoneyModal.tsx`
* **Spécifications des 3 Modes de Paiement** :
  1. 💵 **Espèces à la livraison** : Option par défaut. Message clair : *« Préparez l'appoint pour le livreur »*.
  2. 🌊 **Wave** : Badge bleu officiel Wave, affichage du QR Code Marchand et lien de paiement direct Wave deep-link.
  3. 🍊 **Orange Money** : Badge orange officiel, rappel de la syntaxe marchande `#144#391#` et saisie du code OTP ou validation simulateur.
* **Critères d'Acceptation (DoD)** :
  - Présentation attrayante et crédible lors de la présentation client.
  - Le choix sélectionné est transmis fidèlement au backend (`cash`, `wave`, `orange_money`).

#### 📌 Tâche PA-3 : Module A3 — Recette & Validation du Switch "Plat du Jour"
* **Objectif** : Valider l'expérience côté restaurateur permettant de définir le produit phare quotidien.
* **Critères d'Acceptation (DoD)** :
  - Le switch active/désactive le statut du plat sans friction.
  - Vérification que la bannière du site client se met à jour instantanément.

#### 📌 Tâche PA-4 : Répétition & Maîtrise du Scénario de Démonstration (5 à 8 min)
* **Objectif** : Orchestrer le timing parfait de présentation auprès de la direction de BMC Food avec Lansana Coly.
* **Déroulé chronométré** :
  - **Min 0 - 1** : Accueil, univers BMC Food, numéros d'urgence, Plat du Jour.
  - **Min 1 - 3** : Sélection Tacos + Burger, panier tactile fluide, géolocalisation GPS.
  - **Min 3 - 4** : Paiement Wave / Espèces, validation et génération référence `BMC-XXXX`.
  - **Min 4 - 6** : **Effet Wow** : Bascule sur l'admin cuisine, **la sonnerie carillon retentit**, notification push, prise en charge et passage en cuisine.
  - **Min 6 - 8** : Conclusion commerciale et recueil des retours.

---

## 4. Matrice RACI Récapitulative

| Module & Fonctionnalité | El Hadji M. Diop | Maimouna Sall | Pape Aliou Sène | Lansana Coly |
| :--- | :---: | :---: | :---: | :---: |
| **Setup Vite, TS & Tailwind** | **R / A** | C | I | I |
| **Design System & Palette BMC** | **R / A** | C | C | I |
| **CartContext & LocalStorage** | C | **R / A** | I | I |
| **Catalogue & Catégories (C1)** | C | **R / A** | C | I |
| **Plat du Jour Animé (C1)** | **R** | **R** | C | I |
| **Tiroir Panier Motion (C2)** | **R / A** | C | I | I |
| **Formulaire & GPS (C3)** | C | **R / A** | C | I |
| **Paiements Wave/OM/Cash (C3)** | C | C | **R / A** | I |
| **Dashboard Commandes (A1)** | C | **R / A** | I | I |
| **Carillon Web Audio & Push (A2)** | **R / A** | C | I | I |
| **Optimisation Photos WebP** | I | I | **R / A** | I |
| **Switch Plat du Jour (A3)** | C | **R** | **R / A** | I |
| **Revue de Code & PRs** | **R / A** | C | C | **A (Lead)** |
| **Démonstration Client** | C | C | **R** | **A (Lead)** |

*Légende : **R** = Responsable de réalisation, **A** = Approbateur / Décideur final, **C** = Consulté, **I** = Informé.*

---

## 5. Calendrier d'Exécution & Jalons Clés

| Jalon | Date / Durée | Objectif Opérationnel | Faction Responsable |
| :--- | :---: | :--- | :--- |
| **Jalon 1 : Fondations** | Jour 1 | Socle technique opérationnel, types TS créés, images optimisées en WebP. | El Hadji & Pape Aliou |
| **Jalon 2 : Expérience Client** | Jours 2 - 3 | Catalogue complet, panier *bottom-sheet* fonctionnel, checkout GPS et sélecteur de paiement. | Maimouna & El Hadji |
| **Jalon 3 : Admin & Alertes** | Jours 3 - 4 | Dashboard cuisine interactif, carillon sonore en temps réel, push notifications. | El Hadji & Maimouna |
| **Jalon 4 : Répétition Générale** | Jour 5 | Intégration complète avec le backend Django, test du scénario 5-8 min, validation par Lansana. | Toute l'équipe |

---

## 6. Checklist de Conformité pour l'Audit de Lansana Coly

Avant de soumettre la Pull Request finale au Lead Technique, El Hadji Massogui Diop vérifiera que :
- [ ] Le site s'affiche parfaitement sur formats d'écrans mobiles (360px, 390px, 414px).
- [ ] La sonnerie carillon retentit automatiquement dès la réception d'une commande en attente.
- [ ] L'acquittement stoppe immédiatement la sonnerie.
- [ ] La notification push du navigateur s'affiche avec la référence `BMC-XXXX`.
- [ ] Le calcul des prix est garanti conforme au recalcul du serveur backend.
- [ ] Aucune erreur TypeScript (`npm run build` passe avec 0 erreur).
- [ ] Aucune erreur ou avertissement bloquant dans la console du navigateur.
