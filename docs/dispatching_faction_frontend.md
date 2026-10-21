# Dispatching équitable Frontend BMC FOOD

## Règle de partage

Chaque personne a exactement la même charge estimée :

- **2 lots moyens (M)** de développement ;
- **1 lot court (S)** de contrôle ou recette ;
- participation aux tests finaux.

Cette répartition concerne uniquement la faction Frontend et Design. Le backend Django REST reste hors de ce fichier.

| Membre | Charge | Ce qu'il livre |
| --- | --- | --- |
| El Hadji Massogui Diop | 2 M + 1 S | Design system, menu, revue Frontend |
| Maimouna Sall | 2 M + 1 S | Accueil, checkout, recette responsive |
| Pape Alioune Sène | 2 M + 1 S | Panier, commande/confirmation, recette contenu |

## 1. El Hadji Massogui Diop - Lead Frontend et Design

### Lot EH-1 - Design system et composants communs - M

**Tu fais exactement ceci :**

1. Configurer les couleurs, espacements, rayons, tailles de texte et tailles de boutons dans Tailwind à partir de la charte.
2. Créer les composants réutilisables : `Button`, `Input`, `ProductCard`, `Badge`, `Loader`, `ErrorMessage` et `Header`.
3. Définir les règles Framer Motion réutilisables : apparition de carte, clic bouton et transition de page.
4. Documenter dans le code comment utiliser chaque composant.

**Terminé quand :** les composants sont réutilisables, typés TypeScript, visibles dans l'application et utilisables par Maimouna et Pape.

### Lot EH-2 - Menu et cartes produits - M

**Tu fais exactement ceci :**

1. Créer la page Menu dans `client_website/` à partir des composants communs.
2. Afficher les catégories et les produits fournis : Tacos panés, Burgers, Tacos simples et Sauces.
3. Afficher pour chaque produit : photo disponible, nom, prix en F CFA et bouton `+`.
4. Relier le bouton `+` à la fonction d'ajout du panier fournie par Pape.

**Terminé quand :** un client peut parcourir les catégories, ajouter un produit au panier et le menu fonctionne entre 360 px et 414 px sans erreur TypeScript.

### Lot EH-3 - Revue Frontend avant PR - S

**Tu fais exactement ceci :**

1. Vérifier les Pull Requests de Maimouna et Pape avant envoi à Lansana Coly.
2. Vérifier que les composants utilisent bien la charte, qu'il n'y a pas de débordement et que le clavier peut atteindre les boutons et champs.
3. Signaler les corrections précises ; ne pas refaire les tâches des autres à leur place.

**Terminé quand :** une seule Pull Request Frontend propre est prête vers `develop` avec Lansana Coly comme reviewer.

## 2. Maimouna Sall - Accueil et checkout

### Lot MS-1 - Accueil et plat du jour - M

**Tu fais exactement ceci :**

1. Continuer et terminer la page Accueil déjà commencée.
2. Afficher le logo BMC FOOD, le titre, le bouton « Voir le menu » et le bloc Plat du Jour.
3. Créer le sélecteur horizontal tactile des catégories : Tacos panés, Burgers, Tacos simples et Sauces.
4. Ajouter les animations légères de l'accueil avec les règles Framer Motion fournies par El Hadji.

**Terminé quand :** l'accueil fonctionne entre 360 px et 414 px, mène au menu et n'a aucune erreur d'affichage.

### Lot MS-2 - Checkout et validation Frontend - M

**Tu fais exactement ceci :**

1. Créer le formulaire Nom, Téléphone, Adresse et Instructions facultatives.
2. Ajouter le bouton de géolocalisation assistée avec message clair si la permission est refusée.
3. Créer le sélecteur visuel Espèces, Wave et Orange Money.
4. Valider les champs avant l'envoi et afficher une erreur lisible sous chaque champ incorrect.
5. Transmettre les données validées au module de soumission de Pape.

**Terminé quand :** un formulaire incomplet ne s'envoie pas et les données saisies restent présentes en cas d'erreur.

### Lot MS-3 - Recette responsive - S

**Tu fais exactement ceci :**

1. Tester Accueil, Menu, Panier et Checkout aux largeurs 360 px, 390 px, 414 px, tablette et desktop.
2. Écrire une liste d'anomalies avec écran, action, résultat attendu et résultat observé.
3. Vérifier que les boutons et champs sont utilisables au doigt.

**Terminé quand :** aucun débordement ou bouton trop petit n'est présent sur les largeurs testées.

## 3. Pape Alioune Sène - Panier et commande

### Lot PAS-1 - Panier animé déjà commencé - M

**Tu fais exactement ceci :**

1. Terminer le panier déjà commencé.
2. Créer le tiroir panier qui glisse depuis le bas avec Framer Motion.
3. Gérer l'ajout, la suppression, l'augmentation et la diminution de quantité.
4. Afficher sous-total, panier vide et lien retour vers le menu.
5. Conserver le panier durant la navigation.

**Terminé quand :** chaque changement de quantité met à jour le sous-total immédiatement ; une quantité ne descend jamais sous 1.

### Lot PAS-2 - Envoi de commande et confirmation - M

**Tu fais exactement ceci :**

1. Recevoir les articles du panier et les données validées par le checkout de Maimouna.
2. Envoyer la commande vers l'API backend avec `POST /api/orders/` selon le contrat fourni par le backend.
3. Afficher l'état de chargement pendant l'envoi.
4. Afficher la page Confirmation avec la référence `BMC-XXXX` retournée par l'API.
5. En cas d'échec, afficher un message et ne pas effacer le panier ni le formulaire.

**Terminé quand :** une réponse API réussie mène à la confirmation ; une réponse en erreur conserve les données de commande.

### Lot PAS-3 - Recette des données BMC - S

**Tu fais exactement ceci :**

1. Vérifier noms, catégories et prix de menu avant publication dans le Frontend.
2. Signaler à El Hadji toute photo, disponibilité ou information manquante au lieu de l'inventer.
3. Vérifier visuellement que le logo BMC FOOD est complet, non déformé et lisible.

**Terminé quand :** les informations non confirmées sont signalées ; aucun contenu inventé n'est publié.

## Ordre de travail sans blocage

1. El Hadji livre les composants communs et les règles d'animation.
2. Pape continue son panier en parallèle.
3. Maimouna termine l'accueil déjà commencé pendant qu'El Hadji construit le menu.
4. Maimouna construit ensuite le checkout.
5. Pape relie le panier et le checkout à l'API dès que le contrat backend est disponible.
6. Maimouna fait la recette responsive.
7. El Hadji fait uniquement la revue d'intégration puis prépare la PR vers `develop`.

## Règles Git

- Ne jamais pousser sur `main`.
- Travailler sur `feature/frontend/client-website` ou `feature/frontend/<tache>`.
- Ne jamais committer `node_modules/`, `dist/`, `.env.local` ou `.vscode/`.
- Une Pull Request vers `develop`, validée par Lansana Coly.

## Informations toujours ouvertes

- Wave et Orange Money : simulation ou intégration réelle.
- Contrat exact de `POST /api/orders/` fourni par le backend.
- Photos définitives, plat du jour et disponibilité des produits.
- Échéance et disponibilité de chaque membre.
