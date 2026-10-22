# Dispatching équitable de tout le Frontend BMC FOOD

## Répartition

Chaque membre a 3 tâches techniques principales et 1 tâche de contrôle.

| Membre | Site client | Application Admin | Contrôle |
| --- | --- | --- | --- |
| El Hadji Massogui Diop | Design system, menu | Dashboard commandes | Revue Frontend |
| Maimouna Sall | Accueil (Dark Luxury) | Plat du Jour | Tests responsive |
| Pape Alioune Sène | Panier, checkout & confirmation, envoi commande | Alertes et notifications | Vérification des données |

---

## 1. El Hadji Massogui Diop — Lead Frontend

### 1. Appliquer la charte existante dans le code

- Configurer Tailwind avec les couleurs, espacements, tailles, rayons et boutons de la charte existante (`Charte_graphique_BMC_Food.pdf`).
- Créer les composants réutilisables : bouton, champ, badge, modal, loader, message d’erreur, header et état vide.
- Préparer les animations Framer Motion communes.

**Terminé quand :** les composants sont réutilisables dans le site client et l’Admin, avec des états focus, chargement, erreur et désactivé.

### 2. Développer la page Menu

- Créer la page Menu dans `client_website/`.
- Afficher les catégories : Tacos panés, Burgers, Tacos simples et Sauces.
- Afficher nom, prix F CFA, image disponible et bouton d’ajout pour chaque produit.
- Connecter le bouton `+` au panier de Pape.
- Gérer les états chargement, erreur et menu vide.

**Terminé quand :** le client peut parcourir les catégories et ajouter un produit au panier sur mobile, tablette et desktop.

### 3. Développer le dashboard Admin

- Créer la structure de `admin_app/`.
- Afficher les commandes : référence, heure, montant, client et statut.
- Créer la vue détaillée d’une commande.
- Ajouter les boutons de statut : En attente, En préparation, En livraison et Livrée.
- Connecter la lecture et la mise à jour au backend.

**Terminé quand :** une commande peut être lue et son statut changé depuis tablette ou ordinateur.

### 4. Faire la revue Frontend

- Vérifier les Pull Requests de Maimouna et Pape.
- Vérifier TypeScript, responsive, clavier, cohérence avec la charte existante et absence de composants dupliqués.
- Préparer la PR finale vers `develop` pour validation par Lansana Coly.

---

## 2. Maimouna Sall — Accueil et Plat du Jour

### 1. Finaliser l’Accueil Dark Luxury (Site Client `client_website/`)

- Finaliser la page Accueil en Dark Luxury (Header épuré avec logo officiel naturel, menu tiroir ouvrant par la droite avec icônes réelles Wave, Orange Money et Espèces).
- Hero cinématique plein écran avec fond vidéo HD (sans boîte, textes calibrés sans panure, boutons adaptés mobile et desktop).
- Bandeau carrousel hybride Plat du Jour / Best-Sellers du Chef avec animation dynamique et cartes grand format.
- Sélecteur tactile des catégories circulaires avec bague dorée active.

**Terminé quand :** l’accueil est parfaitement fluide, responsive (360 px à 414 px, tablette et desktop) et mène naturellement à la carte.

### 2. Développer le gestionnaire de Plat du Jour (`admin_app/`)

- Créer dans l’Admin la liste des plats disponibles.
- Permettre au restaurateur d’activer, remplacer ou désactiver le Plat du Jour.
- Afficher clairement le Plat du Jour actif.
- Afficher succès ou erreur après chaque action.

**Terminé quand :** le restaurateur peut gérer le Plat du Jour depuis l’Admin.

### 3. Tester le responsive (Tâche de contrôle)

- Tester le site client à 360 px, 390 px, 414 px, tablette et desktop.
- Tester l’Admin sur tablette et desktop.
- Lister chaque bug avec écran, action, résultat attendu et résultat observé.

---

## 3. Pape Alioune Sène — Panier, checkout, commande, alertes

### 1. Terminer le panier déjà commencé

- Terminer le panier actuel.
- Créer le tiroir panier animé depuis le bas de l’écran.
- Gérer ajout, suppression, quantité, sous-total et panier vide.
- Conserver le panier pendant la navigation.

**Terminé quand :** le sous-total se met à jour immédiatement et qu’une quantité ne peut pas descendre sous 1.

### 2. Développer le checkout, l'envoi de commande et la confirmation

- Créer les champs Nom, Téléphone, Adresse et Instructions.
- Ajouter la géolocalisation assistée avec message de repli si refusée.
- Créer les choix Espèces, Wave et Orange Money (simulation).
- Valider les champs et afficher les erreurs sous les champs concernés.
- Envoyer la commande vers `POST /api/orders/` avec état de chargement.
- Afficher la confirmation visuelle avec la référence de commande après réponse réussie du serveur.

**Terminé quand :** une commande incomplète ne part pas, qu'une erreur conserve les informations et qu'une commande réussie affiche sa référence.

### 3. Développer les alertes Admin

- Rafraîchir régulièrement les nouvelles commandes.
- Déclencher une alerte sonore à l’arrivée d’une commande.
- Arrêter le son après clic sur « Prendre en charge ».
- Demander la permission de notification navigateur.
- Afficher une notification avec référence et montant si elle est autorisée.

**Terminé quand :** une nouvelle commande déclenche une alerte sans répéter l’alerte pour une commande déjà prise en charge.

### 4. Vérifier les données BMC

- Vérifier les noms, catégories et prix.
- Signaler les photos, horaires, disponibilités ou informations manquantes.
- Vérifier que le logo reste complet, lisible et non déformé.

---

## Ordre de travail

1. El Hadji prépare les composants et règles Frontend.
2. Maimouna termine l’accueil Dark Luxury.
3. Pape termine le panier, le checkout et la confirmation de commande.
4. El Hadji développe le menu.
5. Pape relie la commande à l’API.
6. El Hadji développe le dashboard.
7. Maimouna développe le Plat du Jour dans l'Admin.
8. Pape développe alertes et notifications.
9. Maimouna teste le responsive, Pape vérifie les contenus, El Hadji fait la revue finale.
10. Pull Request vers `develop`, validation par Lansana Coly.

---

## Décisions et points confirmés

- **Wave et Orange Money** : Simulation validée pour la démonstration (pas d'intégration API bancaire réelle).
- **Endpoints backend** : Fournis par l'API Django REST (`/api/menu/`, `/api/orders/`, `/api/daily-special/`, `/api/orders/events/unnotified/`).
- **Charte graphique** : Document officiel disponible à la racine (`Charte_graphique_BMC_Food.pdf`).
