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

## Statut des corrections : TOUT EST VALIDÉ ET CONFORME (15/11/2026)

### 1. `test_customer_auth` : 9 tests sur 9 passent
- `cache.clear()` a été ajouté dans le `setUp` de `test_customer_auth.py` pour isoler les compteurs de cache entre tests.
- Le test dédié `test_customer_login_throttled_at_11th_request_429` a été ajouté et valide le blocage 429 à la 11ᵉ requête de connexion.
- Tous les tests d'authentification passent sans échec.

### 2. Limite par IP et justification
- La classe `ProxiedScopedRateThrottle` (`backend/api/throttling.py`) inspecte l'en-tête `X-Forwarded-For` et extrait l'IP client réelle (première IP de la chaîne).
- Cela garantit que les utilisateurs d'opérateurs mobiles (Orange, Wave, Free Sénégal) partageant une adresse IP de passerelle ou situés derrière un reverse-proxy Nginx ne se bloquent pas mutuellement.
- La limite de 10 requêtes / minute est maintenue pour protéger les endpoints sensibles (authentification, force brute).

### 3. Horaires en développement et variable `BMC_ENFORCE_OPENING_HOURS`
- Par défaut en production, les horaires stricts sont appliqués (mardi au dimanche, 11h00 à 02h00, dernière commande à 01h30).
- Pour le développement local et les tests manuels en dehors de ces heures, définir la variable d'environnement :
  ```bash
  export BMC_ENFORCE_OPENING_HOURS=0  # Linux / macOS
  $env:BMC_ENFORCE_OPENING_HOURS="0"  # Windows PowerShell
  ```
  ou dans votre fichier `.env`.

### 4. Contrat d'erreur et interrupteur `/api/health/`
- Lorsque le restaurant est fermé ou en pause cuisine, la création de commande `POST /api/orders/` renvoie un code **400 Bad Request** au format :
  ```json
  {
    "success": false,
    "error": "Le restaurant BMC Food est actuellement fermé pour les commandes...",
    "errors": {
      "non_field_errors": ["Le restaurant BMC Food est actuellement fermé pour les commandes..."]
    },
    "non_field_errors": ["Le restaurant BMC Food est actuellement fermé pour les commandes..."]
  }
  ```
- L'endpoint public `GET /api/health/` expose :
  - `is_open` (booléen, horaires 11h-02h)
  - `accepting_orders` (booléen, faux si pause cuisine ou fermeture manuelle ou après 01h30)
  - `closed_message` (chaîne, message explicatif en cas de pause ou fermeture)
- L'endpoint admin `PATCH /api/admin/settings/` permet d'activer/désactiver la fermeture manuelle (`manual_closed`) et de définir le message (`closed_message`).

---

## Tâches V1 complémentaires de Pathé Fall (Validées)
1. **Interrupteur manuel et pause cuisine** : Modèle `RestaurantSettings` (singleton), endpoint `PATCH /api/admin/settings/` (sécurisé admin), synchronisé avec `GET /api/health/`.
2. **Dernière commande à 01h30 incluse** : Prise de commande autorisée jusqu'à 01h30:00 (service de nuit), rejetée à 01h31.
3. **Garde-fous** :
   - Numéro de téléphone sénégalais validé et normalisé sous format international `+221XXXXXXXXX`.
   - Plafond maximal de commande à 250 000 F CFA.
   - Longueur maximale de note fixée à 500 caractères.
   - Quantité totale maximale d'articles par commande plafonnée à 50 unités.
4. **Tests** : 128 tests automatisés passent avec succès (`Ran 128 tests in 16.9s, OK`).
