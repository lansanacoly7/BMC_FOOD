# Correctif pour Pathé : reprendre ta branche sur le nouveau `develop`

Mise à jour du 15 nov. : `develop` contient maintenant le backend V1 d'Ibrahima (modèle `DeliveryArea` avec les 51 quartiers, `order_type`, `has_allergy`, `Idempotency-Key`, annulation client et admin, `confirm-payment`, suivi enrichi), la branche de déploiement, la page de suivi de Maïmouna et l'admin/KDS d'Alioune. Tout passe : 11 modules de tests backend, builds des deux sites. `test` est aligné.

Ta branche `feature/backend/pathe-fall` (`90d395a`) passe tous ses tests, mais elle fait **double emploi** avec Ibrahima et **entre en conflit** avec `develop`. Ibrahima est la référence pour tout ce qui concerne les commandes et les frais.

## À faire
1. `git fetch` puis `git merge origin/develop` dans ta branche. Résous les conflits en **gardant la version de `develop`** pour tout ce qui suit :
   - `fulfillment_method` : supprime-le. Le champ est `order_type`.
   - `DELIVERY_AREAS_FEES` et `get_delivery_fee` : supprime-les. Les frais viennent du modèle `DeliveryArea` (grille de 51 quartiers, quartier inconnu refusé, destination éloignée à confirmer).
   - Ta migration `0006_order_delivery_area_order_delivery_fee_and_more.py` : supprime-la (celle d'Ibrahima porte déjà le numéro `0006`).
2. **Garde uniquement ce qui est à toi et absent de `develop` :**
   - le modèle `RestaurantSettings` et l'endpoint `PATCH /api/admin/settings/` (`manual_closed`, `closed_message`) ; ta migration doit devenir `0007_...`, dépendant de la `0006` d'Ibrahima (`makemigrations` le fera pour toi) ;
   - `accepting_orders` et `closed_message` dans `/api/health/` ;
   - la dernière commande à 01h30, les horaires (`is_order_window_open`) ;
   - les garde-fous : téléphone sénégalais normalisé, montant maximal, quantité totale maximale, note limitée ;
   - la prise en compte du proxy dans la limitation de débit (`throttling.py`) et ses tests.
3. Adapte tes tests à `order_type` et aux quartiers d'Ibrahima (`test_pathe_v1`, `test_delivery_and_proxy_throttling`). Les tests de frais de livraison sont désormais ceux d'Ibrahima : supprime les tiens s'ils font doublon.
4. Limite d'authentification : `develop` est déjà à 10 par minute (changement d'Alioune). Documente dans `docs/` pourquoi cette valeur et ajoute le test du 429 à la 11e requête.
5. **Vérifie avant de pousser :** `python manage.py check`, `python manage.py makemigrations --check --dry-run` (rien à générer) et **tous** les modules de tests (`python manage.py test api`).

## Résultat attendu
Une branche qui ne contient plus que tes ajouts (réglages du restaurant, horaires, garde-fous, proxy) et qui se fusionne sans conflit dans `develop`.

## Quand c'est corrigé
Préviens-moi : je fusionne sur une copie de `develop`, je relance tous les tests et je pousse.
