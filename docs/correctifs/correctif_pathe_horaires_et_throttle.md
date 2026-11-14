# Correctif pour Pathé : horaires d'ouverture et limitation de débit

Commits relus : `036771b` (horaires d'ouverture) et `540f894` (saut `pending` → `preparing`, limite de débit).
Test fait sur une fusion propre de `develop` + ta branche : aucun conflit.

## Ce qui est bon (ne pas toucher)
- `is_restaurant_open` respecte les vrais horaires : mardi à dimanche 11h à 02h (fuseau Africa/Dakar), fermé le lundi. Tes 12 tests `test_opening_hours` passent.
- Le refus du saut `pending` → `preparing` corrige le test qui échouait : `test_orders_ibrahima` passe maintenant (28 tests).
- `makemigrations --check` : rien à générer. `manage.py check` : OK.
- Passent aussi : `test_api_endpoints` (33), `test_pricing`, `test_concurrency`, `test_auth_expiration`, `test_seed`, `test_migration_0002`, `test_openapi_schema_conformity`.

## À corriger avant que ce soit poussé
**1. `test_customer_auth` : 2 échecs sur 8 (réponse 429 au lieu de 201 et 400).**
- `test_customer_register_nominal_201`
- `test_customer_register_short_password_fails_400`

Cause : dans `settings.py`, tu as baissé `auth` de `60/min` à `10/min`. Les tests d'authentification partagent le même compteur et dépassent 10 requêtes par minute.

À faire (ne pas simplement remonter la limite à 60 pour faire passer les tests) :
- Dans `test_customer_auth.py`, ajoute dans `setUp` : `from django.core.cache import cache` puis `cache.clear()`. Les tests ne doivent pas se gêner entre eux.
- Ajoute un test dédié qui vérifie qu'on obtient bien 429 à la 11ᵉ requête de connexion.
- Relance `python manage.py test api.tests.test_customer_auth` : les 8 tests doivent passer.

**2. Limite de 10/min par IP : à justifier.**
Derrière un proxy ou un réseau mobile, beaucoup de clients partagent la même adresse IP. Vérifie que le compteur utilise bien `X-Forwarded-For` (sinon tous les clients d'un même opérateur se bloquent entre eux). Si tu gardes 10/min, documente-le dans `docs/`. Sinon, mets 20/min pour la connexion et garde 10/min seulement pour l'inscription.

**3. Les horaires sont actifs en développement.**
`BMC_ENFORCE_OPENING_HOURS` vaut vrai par défaut hors tests : les développeurs ne pourront plus passer de commande entre 02h et 11h, ni le lundi. Ajoute dans `docs/` ou le README : `BMC_ENFORCE_OPENING_HOURS=0` pour le développement.

**4. Contrat avec le site client.**
Le refus d'une commande hors horaires renvoie une erreur 400 avec le message « Le restaurant BMC Food est actuellement fermé… ». Précise dans la doc le format exact (champ `errors` ou `non_field_errors`) pour qu'Alioune et El Hadji l'affichent proprement. `GET /api/health/` expose maintenant `is_open` : prévenez le front pour qu'il affiche « Fermé » sur le bouton de commande.

## Quand c'est corrigé
Préviens-moi : je refais la fusion sur `develop`, je relance les 9 modules de tests, et je pousse.
