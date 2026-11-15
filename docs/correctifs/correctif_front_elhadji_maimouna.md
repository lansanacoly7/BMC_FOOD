# Correctif pour El Hadji : reprendre ta branche sur le nouveau `develop`

Mise à jour du 15 nov. : la branche de Maïmouna (lint à 0, page de suivi, annulation client) est fusionnée dans `develop`, ainsi que le backend V1 d'Ibrahima, qui accepte déjà `order_type`, `delivery_area`, `has_allergy` et `Idempotency-Key`. `test` est aligné.

Ta branche `feature/frontend/elhadji-commande-v1` (`a86b33f`) est correcte seule (`tsc` et build à 0 erreur), mais elle **entre en conflit** avec le travail de Maïmouna.

## À faire
1. `git fetch` puis `git merge origin/develop` dans ta branche.
2. Conflits attendus : `ProvisionalCheckout.tsx`, `OrderConfirmation.tsx`, `TopHeader.tsx`, `types/index.ts`. **Garde les deux fonctions :** ton envoi de `order_type`, `delivery_area`, `has_allergy`, de `Idempotency-Key`, les montants du serveur, le bandeau fermé ; et la page de suivi, l'annulation et les corrections de lint de Maïmouna.
3. `npm run lint` doit être à **0 erreur** (tu en avais 2, de la même famille que celles qu'elle a corrigées).
4. `npx tsc -b` et `npm run build` à 0 erreur.
5. **Test de bout en bout avec le vrai backend** (le backend d'Ibrahima est dans `develop`) : commande à emporter sans adresse, livraison avec un quartier (le total vient du serveur), double clic sur « Commander » (une seule commande), allergie cochée. Le bandeau « fermé ou pause » dépend de la branche de Pathé : il n'affichera la pause manuelle qu'après sa fusion.

## Quand c'est corrigé
Préviens-moi : je fusionne sur une copie de `develop`, je relance `tsc`, le build, le lint, et je pousse.

---

# Note pour Maïmouna
Ta branche est fusionnée dans `develop`. Ton bouton d'annulation appelle `POST /api/orders/<ref>/cancel/`, qui existe maintenant (backend d'Ibrahima) : fais un essai complet avec une vraie commande en attente, puis une commande déjà en préparation (le message d'erreur doit être clair). Vérifie aussi la page de suivi sur mobile 360 px.
