# Correctif pour El Hadji et Maïmouna : fusion des deux branches du site client

Branches testées : `feature/frontend/elhadji-commande-v1` (El Hadji, `a86b33f`) et `Dev_MaimounaSall` (Maïmouna, `afbb74b`), toutes deux à jour sur `develop`.

Résultat sur chacune, seule : `tsc -b` à 0 erreur et `npm run build` à 0 erreur. Mais les deux branches **modifient les mêmes fichiers et ne se fusionnent pas ensemble** (conflit constaté sur GitHub). Fichiers en commun : `ProvisionalCheckout.tsx`, `OrderConfirmation.tsx`, `TopHeader.tsx`, `types/index.ts`.

## Ordre de fusion
1. **Maïmouna d'abord** (sa branche passe sans conflit avec `develop`, le lint est à 0).
2. **El Hadji reprend ensuite sa branche sur le `develop` mis à jour** (`git merge origin/develop`), résout les conflits en gardant les deux fonctions (envoi de `order_type` et `Idempotency-Key` d'un côté, suivi et annulation de l'autre), puis relance les vérifications.
Je préviens quand la branche de Maïmouna est fusionnée dans `develop`.

## Pour El Hadji
- **`npm run lint` : 2 erreurs** (règle « setState dans un effet », vers la ligne 118 d'un des fichiers touchés). Ce sont les mêmes que Maïmouna a corrigées dans sa branche ; en reprenant `develop` après sa fusion, elles disparaîtront ou seront à corriger à la main. Objectif : lint à 0.
- Ton site envoie `order_type`, `delivery_area`, `has_allergy` et `Idempotency-Key`, ce qui est conforme au contrat. Le backend de Pathé n'est pas encore aligné (il attend `fulfillment_method` et ignore la clé) : voir `correctif_pathe_v1_contrat_api.md`. Ne change rien côté site pour l'instant.
- Fais un test de bout en bout avec le vrai backend dès que la branche de Pathé est fusionnée : commande à emporter sans adresse, livraison avec un quartier, double clic, restaurant en pause.

## Pour Maïmouna
- Le lint est à 0 et le build passe : bon travail.
- La page de suivi appelle `GET /api/orders/track/<ref>/` (conforme). L'annulation appelle `POST /api/orders/<ref>/cancel/` : cet endpoint n'existe pas encore côté backend, donc le bouton affichera une erreur en production tant que Pathé et Ibrahima ne l'ont pas livré. Prévois un message clair (« Annulation impossible pour le moment, appelez le restaurant ») en cas de 404 ou de 5xx.
- Vérifie la page de suivi sur mobile 360 px avec une commande réelle (statuts en attente, en préparation, prête, livrée, annulée).

## Quand c'est corrigé
Préviens-moi : je fusionne sur une copie de `develop`, je relance `tsc`, le build, le lint et je vérifie les conflits.
