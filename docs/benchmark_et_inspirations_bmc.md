# Benchmark Concurrentiel & Inspirations UI/UX — BMC FOOD

> **Projet** : BMC FOOD — Dakar, Sénégal  
> **Auteur** : Assistant IA pour Lansana Coly (Chef de Projet & Lead Technique)  
> **Destinataires** : Lansana Coly, El Hadji Massogui Diop (Design/Frontend), Pape Aliou Sène (DG/Business)

---

## 1. Contexte & Enjeux du Marché Dakarois

À Dakar, le marché de la restauration rapide (notamment le segment Tacos et Burgers) est en pleine expansion (zones Almadies, Ouakam, Ngor, Point E, Mermoz). Cependant, la grande majorité des restaurants font face à deux écueils majeurs :
1. **La dépendance coûteuse aux agrégateurs** (Yassir Food, Glovo) qui prélèvent entre **20% et 30% de commission** par commande et privent le restaurant du contact direct avec sa clientèle.
2. **Le canal WhatsApp / Téléphone traditionnel** : fastidieux, générateur d'erreurs dans la prise de commande, sans calcul automatisé ni suivi de statut en cuisine.

> 🎯 **L'opportunité BMC FOOD** : Proposer un **site web propriétaire ultra-rapide**, sans téléchargement d'application nécessaire, couplé à une **application de gestion cuisine avec sonnerie automatique**, permettant au restaurant de s'émanciper des agrégateurs tout en professionnalisant son flux.

---

## 2. Analyse de la Concurrence Directe à Dakar

| Concurrent | Présence & Canaux | Forces observées | Faiblesses & Opportunités pour BMC |
| :--- | :--- | :--- | :--- |
| **Poz Tacos** *(Ouakam, Almadies)* | Site web `poztacos.com` + Yassir | - Forte notoriété locale sur le tacos.<br>- Présence sur les réseaux sociaux. | - Parcours mobile parfois ralenti par trop de choix d'options.<br>- Pas d'alerte sonore native restaurant pour le click-and-collect.<br>➡️ **BMC peut faire plus simple et plus rapide.** |
| **Tacos de Lyon Sénégal** *(Almadies, Point E, Plateau, etc.)* | Site vitrine `tacosdelyon.sn` + Centrale téléphonique | - Leader en nombre de points de vente physiques à Dakar.<br>- Menu très diversifié. | - Le site web n'est qu'une vitrine statique : pour commander, le client doit appeler un numéro de téléphone parmi 7 agences !<br>➡️ **Grosse opportunité pour BMC : commande 100% digitale sans appel.** |
| **Yum-Yum** *(Pizzas & Tacos)* | Site `taftaf.sn` / `yumyum.sn` | - Système de livraison bien rôdé. | - Interface vieillissante et peu animée.<br>➡️ **BMC mise sur Framer Motion et une esthétique moderne.** |
| **Plateformes Agrégateurs** *(Yassir Food, Glovo)* | Applications mobiles natives | - Parcours client fluide.<br>- Paiement Wave et Orange Money intégrés. | - Oblige le client à installer une application lourde (50 Mo).<br>- Commissions étouffantes pour le restaurant (25%).<br>➡️ **BMC offre un site web instantané accessible via QR code ou lien Instagram.** |

---

## 3. Benchmarks Internationaux Inspirants

### 3.1 Pour le Site Web Client : O'Tacos & Chamas Tacos (France/International)
- **Ce qui fait leur force** :
  - **Identité Dark & Warm** : Fond sombre (`#0c0f14`), contrasté par des couleurs appétissantes (ambre chaud `#f59e0b` et orange grillé `#ff5722`).
  - **La mise en scène du Plat du Jour / Formules** : Placée tout en haut de l'écran avec un badge dynamique (*« Offre du Chef »*, *« Best-seller »*), elle attire 40% des clics d'impulsion.
  - **La sélection visuelle des catégories** : Une barre horizontale tactile de pilules défilantes au pouce sans rechargement de page.
  - **Le panier Bottom-Sheet** : Inspiré de Deliveroo/Five Guys, le panier ne recharge jamais la page : il glisse doucement depuis le bas de l'écran avec un retour tactile immédiat.

### 3.2 Pour l'Application Web Admin : Uber Eats Restaurant & Square POS
- **Le problème de la restauration rapide** : En cuisine, les cuisiniers et le caissier ont les mains prises et ne fixent pas constamment un écran.
- **La solution clé — L'Alerte Sonore Répétitive** :
  - Dès qu'une commande tombe, un carillon distinctif et percutant (*ding-dong* toutes les 3 secondes) retentit jusqu'à ce que quelqu'un clique sur le bouton géant **« Prendre en charge »**.
  - Cette fonctionnalité bluffe systématiquement les restaurateurs lors des démonstrations car elle résout leur vraie hantise : *« rater une commande pendant le rush »*.
- **Le pilotage en 3 colonnes Kanban** :
  - 🟡 *À confirmer (Alerte active)* $\rightarrow$ 🔵 *En cuisine (avec minuteur)* $\rightarrow$ 🟢 *Prêt / En livraison*.

---

## 4. Recommandations Clés pour le Projet BMC FOOD

### 4.1 Spécificités Locales Sénégalaises (Dakar)
1. **Géolocalisation adaptée à Dakar** :
   - À Dakar, les adresses postales n'existent pas. Les clients se repèrent par repère visuel (*« Almadies, en face de la pharmacie, 2e ruelle à droite »*).
   - **Notre solution** : Un champ texte libre très visible + un bouton **📍 Me géolocaliser (GPS)** qui insère automatiquement les coordonnées latitude/longitude pour le livreur.
2. **Paiement Wave & Orange Money au sommet de la hiérarchie** :
   - Le paiement en espèces reste très présent, mais Wave est le réflexe numéro 1 à Dakar.
   - Proposer les 3 boutons visuels avec logos : **Wave**, **Orange Money**, **Espèces à la livraison**.
3. **Plat du Jour dynamique** :
   - Les clients réguliers aiment la nouveauté. Mettre le **Plat du Jour** en première position permet d'orienter les commandes vers les plats les plus rentables ou rapides à préparer.

---

## 5. Synthèse des Arguments pour la Démo Client avec Pape Aliou Sène

Face au gérant de BMC Food, les arguments comparatifs issus de ce benchmark sont imparables :

| Critère | Plateformes Agrégateurs (Yassir/Glovo) | Centrale Téléphone Classique | Solution BMC FOOD (Teranga Labs) |
| :--- | :--- | :--- | :--- |
| **Coût pour le restaurant** | 20% à 30% de commission sur chaque repas | Lignes téléphoniques + temps personnel | **0% de commission par commande (100% direct)** |
| **Installation client** | Obligation de télécharger une app de 50 Mo | Aucun | **Zéro téléchargement : un simple lien ou QR code** |
| **Notification en cuisine** | Dépend de la tablette propriétaire de l'agrégateur | Papier / WhatsApp (commandes oubliées) | **Alerte sonore automatique sur n'importe quel écran/PC** |
| **Moyens de paiement** | Souvent limité ou paiement différé | Espèces uniquement | **Wave, Orange Money & Espèces intégrés** |
| **Fichier clients** | Propriété exclusive de l'agrégateur | Aucun fichier | **Le fichier clients appartient 100% à BMC Food** |
