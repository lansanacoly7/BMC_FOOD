# Rapport Officiel de Tests Responsive & Ergonomie Frontend
**Auteure :** Maimouna Sall — Responsable Accueil Dark Luxury, Gestionnaire Plat du Jour & Tests Responsive  
**Faction Frontend :** BMC FOOD · Teranga Labs  
**Date :** 22 Octobre 2026  
**Périmètre audité :** Site Client (`client_website/`) & Application Admin (`admin_app/`)  

---

## 1. Matrice des Écrans Testés

| Dispositif | Résolution | Cible représentative | Statut global |
| :--- | :--- | :--- | :--- |
| **Mobile Compact** | **360 px × 740 px** | Samsung Galaxy A-series, appareils compacts | ✅ Conforme |
| **Mobile Standard** | **390 px × 844 px** | iPhone 12 / 13 / 14 / 15 / 16 | ✅ Conforme |
| **Mobile Large** | **414 px × 896 px** | iPhone Plus / Max, Galaxy S Ultra | ✅ Conforme |
| **Tablette Portrait** | **768 px × 1024 px** | iPad Mini / iPad 10.2" | ✅ Conforme |
| **Tablette Paysage** | **1024 px × 768 px** | iPad Air / Pro, tablettes Android | ✅ Conforme |
| **Desktop Standard** | **1280 px × 800 px** | Ordinateurs portables (MacBook, PC 13-14") | ✅ Conforme |
| **Desktop Large** | **1440 px+** | Écrans de bureau et stations de travail | ✅ Conforme |

---

## 2. Grille d'Audit Détaillée par Composant

### 2.1. Site Client (`client_website/`)

#### A. En-tête & Menu Tiroir (`TopHeader.tsx` & `NavMenuDrawer.tsx`)
* **360 px - 414 px** :
  * Logo officiel BMC Food positionné naturellement sans boîte blanche ni débordement.
  * Menu hamburger à gauche facilement actionnable au pouce.
  * Tiroir coulissant depuis la **droite** (`x: '100%'`), avec fermeture fluide au clic sur la croix ou sur le fond estompé.
  * Logos réels des moyens de paiement (Wave, Orange Money, Espèces) nets et bien dimensionnés.
* **Tablette & Desktop** :
  * Centrage parfait du logo et maintien des espacements de sécurité.

#### B. Hero Cinématique (`HeroCinematic.tsx`)
* **360 px - 414 px & Desktop (Version Vidéo Pure 100% Nette Validée)** :
  * **Fond Vidéo Publicitaire Officiel Unique** (`bmc_video_hero.mp4`) : netteté native, contraste 100%, sans aucun gif ni dégradation 256 couleurs.
  * Zéro artefact ou flash au rechargement (`preload="auto"` sans poster obsolète).
  * Dégradé sombre progressif à gauche garantissant la parfaite lisibilité des typographies.
  * **Bouton Unique Or Brossé « Explorer le Menu »** :
    * Bouton unique en dégradé Or BMC (`bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 text-black font-black`) déclenchant un défilement doux vers la carte du menu (`#menu-section`) sans redirection de page prématurée.
    * Prêt pour le raccordement API ultérieur de l'équipe backend (Massow Diop).
  * Descriptif épuré sans mention de panure superflue.

#### C. Bandeau Plat du Jour / Best-Sellers (`DailySpecialBanner.tsx` — Option 1 Retenue)
* **360 px - 414 px (Optimisation Anti-Chevauchement Validée)** :
  * **Disposition côte à côte symétrique** respectée à 100% : le texte reste à gauche et le visuel à droite.
  * **Protection anti-collision** : le conteneur texte dispose d'un espace dédié (`min-w-0 flex-1 pr-1`) et le conteneur image est fixé en taille compacte adaptée (`size-24 xs:size-28 shrink-0`), garantissant qu'aucun texte ne touche ni ne chevauche la photo.
  * **Bouton d'action & Tarif** : le bouton « Commander » est calibré ergonomiquement pour les petits écrans (`h-9 px-3 text-[11px] whitespace-nowrap`), laissant un intervalle de sécurité de plus de 45 px avec le conteneur image sur écran 360 px.
  * Image/GIF du plat généreux avec ses **4 angles arrondis** (`rounded-2xl`), sans aucun voile de dégradé sombre et sans badge superposé.
  * Retrait des 3 pilules de réassurance pour une respiration optimale.
* **Tablette & Desktop** :
  * Largeur majestueuse (`max-w-5xl`), tarif or proéminent et bouton *Commander* reprenant son format large (`sm:h-12 sm:px-7`) avec retour tactile animé (*Ajouté ! ✓*).

#### D. Sélecteur de Catégories (`CategoryPills.tsx`)
* **Mobile (360 px - 414 px)** :
  * Défilement tactile horizontal fluide préservé intact sans toucher aux marges mobiles (`-mx-4 px-6 overflow-x-auto`).
  * La bague dorée active de « Tout voir » dispose d'un padding vertical de `py-4` (16 px) et horizontal `px-6` (24 px sur mobile).
  * Zéro rognage, halo net et lisibilité parfaite au pouce.
* **Desktop (1024 px - 1440 px+ — Spécifications Dynamiques Validées)** :
  * **Défilement Fluide de Gauche à Droite (Non statique)** :
    * Autoscroll continu et doux à vitesse de croisière lisible (0.5 px/frame), évitant tout aspect figé.
    * **Pause automatique intelligente au survol de la souris** (`isHovered`) pour permettre une sélection confortable sans mouvement.
    * **Flèches de navigation Or BMC (`ChevronLeft` / `ChevronRight`)** : boutons circulaires élégants permettant un défilement manuel immédiat vers la gauche ou la droite.
    * **Recentrage automatique & Bague Or** : au clic, la catégorie choisie s'illumine d'une bague dorée (`ring-2 ring-bmc-gold scale-105`) et se recentre automatiquement au cœur de l'écran.

#### E. Barre Panier Flottante (`StickyCartBar.tsx`)
* **Mobile (Pensé pour le pouce)** :
  * Fixée en bas d'écran avec z-index élevé.
  * Dégradé signature Or brossé avec typographie noire ultra lisible (`text-black font-black`).
  * Pastille de décompte des articles et montant total en F CFA synchronisés instantanément.

#### F. Bannière Promotionnelle Intermédiaire & Découpage Grille (`SpecialOfferBanner.tsx` & `FeaturedGrid.tsx`)
* **Spécifications Maimouna Sall** :
  * **Sur Mobile (360 px - 414 px)** :
    * Deux colonnes sur deux lignes affichant exactement les **4 Tacos Panés signatures** : *Tacos Viande Pané*, *Tacos Poulet Pané*, *Tacos Mixte Pané*, *Tacos Cordon Bleu Pané*.
    * Insertion immédiate de la bannière promotionnelle occupant **toute la largeur de l'écran (`w-full`)** sans aucune marge vide sur les côtés.
    * **Visuel Officiel Google Flow Intégré** : image panoramique haute définition avec badge pinceau *Offre Spéciale*, titre *-20% SUR VOTRE PREMIÈRE COMMANDE* et composition gourmande (burger, tenders croustillants, frites et dip).
    * **Bouton Interactif Superposé** : bouton Or BMC brossé *Commander Maintenant →* positionné directement sous le texte dans la zone dédiée, tactilement calibré pour le pouce.
    * Continuation fluide du catalogue en dessous (Burgers, Tenders, Frites, Sauces, Boissons).
  * **Sur Web / Desktop (1024 px - 1440 px+)** :
    * Quatre colonnes sur deux lignes affichant **8 cartes signatures** : Ligne 1 avec les 4 Tacos Panés, Ligne 2 avec les Burgers gourmands et Tenders dorés.
    * Insertion de la bannière promotionnelle occupant **toute la largeur de l'écran (`w-full`)** avec dégradé Dark Luxury, animation de zoom subtile au survol et bouton interactif Or BMC.
    * Poursuite des autres produits sous la bannière.
* **Respect de l'Offre Réelle BMC Food** :
  * Visuel culinaire officiel Google Flow conforme à la charte et aux spécialités réelles de l'enseigne.

---

### 2.2. Application Admin (`admin_app/`)

#### A. Statut du Plat du Jour en Direct
* **Tablette & Desktop** :
  * En-tête affichant l'heure en temps réel et l'état du service de nuit.
  * Carte vedette mettant en valeur le Plat du Jour actuellement en ligne avec photo/GIF, badge doré et bouton de désactivation.
  * Lien direct pour prévisualiser le rendu sur le site client.

#### B. Catalogue des Plats & Remplacement en 1 Clic
* **Tablette & Desktop** :
  * Filtrage instantané par catégorie (Tacos panés, Burgers, Poulet) et recherche par mot-clé.
  * Bouton interactif « Définir Plat du Jour » avec retour animé.
  * Toast de notification de succès/erreur auto-dissipant en haut à droite.
  * Synchronisation en direct avec le site client via `localStorage` et événements de stockage.

---

## 3. Synthèse des Bugs Détectés et Résolus

| Composant | Résolution | Action effectuée | Résultat validé |
| :--- | :--- | :--- | :--- |
| `DailySpecialBanner` | 360 px - 390 px | Inversion `flex-col-reverse` qui empilait l'image au-dessus du texte | Restauration de l'agencement noble côte à côte |
| `DailySpecialBanner` | Tous écrans | Voile noir assombrissant le quart gauche de la photo du plat | Voile retiré, image 100% nette avec 4 coins arrondis |
| `CategoryPills` | 360 px | La bague dorée de « Tout voir » touchait le bord haut et gauche | Augmentation des paddings (`py-4 px-6`) pour respiration totale |
| `StickyCartBar` | Tous écrans | Couleur orange braise dissonante par rapport au reste de la page | Remplacement par le dégradé Or officiel BMC Food |
| `TopHeader` | Mobile & Desktop | Logo BMC enfermé dans une boîte blanche carrée rigide | Logo officiel détouré posé directement sur le header sombre |
| `FeaturedGrid` | Mobile (2x2) & Desktop (4x2) | Insertion de la bannière promo pleine largeur après les 2 lignes demandées | Rendu 100% conforme aux instructions vocales de Maimouna |
| `HeroCinematic` | Tous écrans au rechargement | Flash résiduel de 1s de l'ancienne version tacos dû au poster `<video>` | Retrait du poster obsolète, `preload="auto"` et suppression du fichier gif résiduel |
| `CartDrawer` / `StickyCartBar` | Mobile & Desktop | Le bouton « Voir le panier » restait affiché après clic sur la croix (✕) | La croix (✕) vide et ferme le panier (`onClearCart`) et la barre flottante est masquée pendant l'ouverture |

---

## 4. Conclusion de Conformité

Le socle frontend placé sous la responsabilité de **Maimouna Sall** est désormais **100% opérationnel, testé et validé**.  
Toutes les règles graphiques Dark Luxury, la charte Or BMC (#FCB800), les tests d'ergonomie au pouce et la cohérence multi-écrans sont rigoureusement respectés.
Les deux applications (`client_website/` sur le port 5173 et `admin_app/` sur le port 5174) respectent scrupuleusement la **Charte Graphique BMC Food v1.1** et les exigences du fichier de dispatching.
