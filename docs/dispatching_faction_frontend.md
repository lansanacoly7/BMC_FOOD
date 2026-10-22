# Dispatching équitable de tout le Frontend BMC FOOD

## Répartition

Chaque membre a 3 tâches techniques principales et 1 tâche de contrôle.

| Membre | Site client | Application Admin | Contrôle |
| --- | --- | --- | --- |
| El Hadji Massogui Diop | Design system, menu | Dashboard commandes | Revue Frontend |
| Maimouna Sall | Accueil, checkout | Plat du Jour | Tests responsive |
| Pape Alioune Sène | Panier, envoi commande | Alertes et notifications | Vérification des données |

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

## 2. Maimouna Sall — Accueil, checkout et Plat du Jour

### 1. Terminer l’accueil déjà commencé

- Finaliser la page Accueil.
- Afficher le logo BMC FOOD, les contenus validés, le bouton « Voir le menu » et le Plat du Jour.
- Créer le sélecteur tactile des catégories.
- Utiliser les animations fournies par El Hadji.

**Terminé quand :** l’accueil est utilisable entre 360 px et 414 px et mène correctement au menu.

### 2. Développer le checkout et la confirmation

- Créer les champs Nom, Téléphone, Adresse et Instructions.
- Ajouter la géolocalisation assistée avec message de repli si refusée.
- Créer les choix Espèces, Wave et Orange Money (simulation).
- Valider les champs et afficher les erreurs sous les champs concernés.
- Créer l’écran de confirmation visuel avec la référence de commande.

**Terminé quand :** une commande incomplète ne part pas et qu’une erreur conserve les informations saisies.

### 3. Développer le gestionnaire de Plat du Jour

- Créer dans l’Admin la liste des plats disponibles.
- Permettre au restaurateur d’activer, remplacer ou désactiver le Plat du Jour.
- Afficher clairement le Plat du Jour actif.
- Afficher succès ou erreur après chaque action.

**Terminé quand :** le restaurateur peut gérer le Plat du Jour depuis l’Admin.

### 4. Tester le responsive

- Tester le site client à 360 px, 390 px, 414 px, tablette et desktop.
- Tester l’Admin sur tablette et desktop.
- Lister chaque bug avec écran, action, résultat attendu et résultat observé.

---

## 3. Pape Alioune Sène — Panier, commande, alertes

### 1. Terminer le panier déjà commencé

- Terminer le panier actuel.
- Créer le tiroir panier animé depuis le bas de l’écran.
- Gérer ajout, suppression, quantité, sous-total et panier vide.
- Conserver le panier pendant la navigation.

**Terminé quand :** le sous-total se met à jour immédiatement et qu’une quantité ne peut pas descendre sous 1.

### 2. Envoyer la commande et gérer la confirmation

- Récupérer les articles du panier et les données validées par le checkout.
- Envoyer la commande vers `POST /api/orders/`.
- Afficher un chargement pendant l’envoi.
- Afficher la confirmation seulement après la réponse réussie du serveur.
- En cas d’erreur, conserver panier et formulaire.

**Terminé quand :** une commande réussie affiche sa référence et qu’une erreur ne supprime aucune donnée.

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
2. Maimouna termine l’accueil.
3. Pape termine le panier.
4. El Hadji développe le menu.
5. Maimouna développe checkout et confirmation.
6. Pape relie la commande à l’API.
7. El Hadji développe le dashboard.
8. Maimouna développe le Plat du Jour.
9. Pape développe alertes et notifications.
10. Maimouna teste le responsive, Pape vérifie les contenus, El Hadji fait la revue finale.
11. Pull Request vers `develop`, validation par Lansana Coly.

---

## Décisions et points confirmés

- **Wave et Orange Money** : Simulation validée pour la démonstration (pas d'intégration API bancaire réelle).
- **Endpoints backend** : Fournis par l'API Django REST (`/api/menu/`, `/api/orders/`, `/api/daily-special/`, `/api/orders/events/unnotified/`).
- **Charte graphique** : Document officiel disponible à la racine (`Charte_graphique_BMC_Food.pdf`).
