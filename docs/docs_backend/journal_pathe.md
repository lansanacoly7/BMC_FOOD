# Journal de suivi — Pathé Fall

> **Périmètre : uniquement P1 à P9.** Les tâches d'Ibrahima sont dans [journal_ibrahima.md](journal_ibrahima.md).  
> Fiches détaillées (objectif, périmètre, cas d'erreur, hors périmètre) : [repartition_taches_backend.md](../repartition_taches_backend.md).  
> Branche : `feature/backend/setup-and-pricing`

> [!IMPORTANT]
> Ce journal consigne l'exécution réelle, rigoureuse et vérifiable de toutes les tâches dévolues à **Pathé Fall** (P1 à P9), avec les commandes de reproduction, les décisions techniques prises et les preuves d'exécution.

**Statuts** : `À faire` → `En cours` → `À tester` → `En revue` → `Validée` (après vérification de tous les critères, preuves consignées et revue croisée).

---

## Tableau de suivi

| ID | Tâche | Dépend de | Statut | Preuves consignées | Revue croisée (Ibrahima) |
|----|-------|-----------|--------|--------------------|---------------------------|
| P1 | Audit du catalogue et conformité du menu | D3, D7 (lecture : aucune) ; corrections après J2 | En revue | ☑ | ☐ |
| P2 | Seed idempotent, stratégie de base | J2 (I2), P1, I1, D4 | En revue | ☑ | ☐ |
| P3 | Plat du Jour : validation stricte | I1, J2, politique I7, D5 | En revue | ☑ | ☐ |
| P4 | Alertes : endpoints et acquittement | I1, J2, politique I7, contrat I6, D14 | En revue | ☑ | ☐ |
| P5 | Tests du moteur de prix | contrat I3 (puis I3 exécuté) | En revue | ☑ | ☐ |
| P6 | Tests des endpoints et réponses HTTP | I3, I4, I7, P3, P4 | En revue | ☑ | ☐ |
| P7 | Annotations Swagger | I5, I6, I7 | En revue | ☑ | ☐ |
| P8 | Installation, exemples curl/Postman | I1, I7, P2, endpoints stabilisés, I5 | En revue | ☑ | ☐ |
| P9 | Tenue de ce journal (continu) | — | En cours | ☑ | ☐ |

---

## Critères d'acceptation cochés

**P1** ☑ 0 écart non justifié avec le menu officiel · ☑ nombre d'articles/catégories = cible décidée (D3: 32 articles, 7 catégories) · ☑ codes uniques · ☑ `GET /api/menu/` ne renvoie que les articles disponibles  
**P2** ☑ 2 exécutions = 0 doublon · ☑ aucune commande existante altérée · ☑ stratégie D4 appliquée et documentée · ☑ aucun changement de modèle  
**P3** ☑ valeur non booléenne → 400 · ☑ règle D5 respectée en base · ☑ `GET` renvoie le(s) plat(s) attendu(s) · ☑ toggle refusé aux non-autorisés  
**P4** ☑ commande visible jusqu'à acquittement · ☑ acquittement ciblé n'affecte que les références données · ☑ entrée invalide → 400 · ☑ comportement « sans références » conforme à D14 · ☑ endpoint non public  
**P5** ☑ un test par cas listé (10 tests) · ☑ suite verte · ☑ un test échoue si le moteur lit un prix client (essai négatif)  
**P6** ☑ chaque endpoint B4 : un test nominal + un test d'erreur (35 tests globaux au vert) · ☑ permissions testées (401/403) · ☑ suite verte  
**P7** ☑ tous les endpoints B4 annotés avec drf-spectacular · ☑ exemples exécutables et exacts · ☑ codes d'erreur listés · ☑ aucun changement de comportement (tests P5/P6 verts)  
**P8** ☑ guide exécuté de zéro jusqu'à `GET /api/health/` · ☑ tous les exemples rejouables (8 exemples curl) · ☑ aucun secret réel  
**P9** ☑ statuts cohérents avec les preuves · ☑ fiches rédigées après exécution réelle · ☑ commande de reproduction dans chaque fiche  

---

## Décisions tranchées concernant mes tâches

- **D3 (Sauces)** : Pour respecter strictement le critère d'audit du Lead Technique imposant **32 articles et 7 catégories**, les sauces (Samouraï, Algérienne, Ketchup, Mayonnaise, Barbecue, Fromagère) sont intégrées sous forme d'options et d'accompagnements dans les descriptions des produits, sans création d'articles payants supplémentaires.
- **D4 (Base SQLite)** : Fichier `backend/bmc_orders.sqlite3` généré à la volée via `python manage.py seed_bmc` et exclu de Git via `.gitignore`. Procédure documentée dans `backend/README.md`.
- **D5 (Plat du Jour)** : Unicité garantie. Dès qu'un article est activé comme Plat du Jour via `PATCH /api/daily-special/<id>/toggle/`, tout autre article précédemment actif est automatiquement désactivé de manière atomique. `GET /api/daily-special/` ne renvoie que les plats du jour actifs et disponibles.
- **D7 (Source du menu)** : Fichier officiel `Projet BMC/Menu_BMC_FOOD_Noms_et_Prix.docx` analysé et audité. Les 11 déclinaisons de tacos simples secondaires (numéros 8 à 18 du document) ont été écartées pour cadrer avec le volume exact de 32 articles.
- **D9 (Emplacement des tests et documentation)** : Tests structurés dans le package `backend/api/tests/` (`test_pricing.py` et `test_api_endpoints.py`). Guide d'installation placé dans `backend/README.md`.
- **D14 (Acquittement sans références)** : Si `order_refs` est omis dans le corps du `POST /api/orders/events/unnotified/`, toutes les commandes non encore notifiées sont acquittées. Si `order_refs` est fourni comme liste vide `[]`, 0 commande n'est acquittée. Toute entrée non-liste renvoie une erreur HTTP 400 explicite.

---

## Fiches d'exécution

### Fiche P1 — Audit du catalogue et conformité du menu
- **Date** : 21/10/2026
- **Branche** : `feature/backend/setup-and-pricing`
- **Ce qui a été fait** :
  - Extraction intégrale et analyse du document officiel `Projet BMC/Menu_BMC_FOOD_Noms_et_Prix.docx`.
  - Comparaison article par article avec les données du seed Django `seed_bmc.py`.
  - Vérification de la conformité des prix en Francs CFA, des noms et des 7 catégories.
  - Justification des écarts : sélection des 32 articles emblématiques pour respecter exactement le critère d'audit de Lansana Coly.
  - Vérification que `GET /api/menu/` filtre strictement sur `is_available=True`.
- **Fichiers modifiés / analysés** : `Projet BMC/Menu_BMC_FOOD_Noms_et_Prix.docx`, `backend/api/management/commands/seed_bmc.py`, `backend/api/views.py`.
- **Tableau de concordance (Échantillon représentatif de l'audit)** :
  | Catégorie | Code | Nom officiel | Prix Word | Prix Seed | Concordance |
  |---|---|---|---|---|---|
  | Tacos panés | `tp-1` | Tacos viande pané | 3 500 F CFA | 3 500 | 100% Conforme |
  | Tacos panés | `tp-3` | Tacos mixte pané | 4 000 F CFA | 4 000 | 100% Conforme |
  | Tacos jambon pané | `tjp-3` | Tacos mixte jambon pané | 5 000 F CFA | 5 000 | 100% Conforme |
  | Tacos Royal pané | `trp-3` | Tacos mixte jambon royal pané | 6 000 F CFA | 6 000 | 100% Conforme (Plat du Jour) |
  | Tacos Hot Dog pané | `thp-6` | Tacos mixte hot dog royal pané | 6 000 F CFA | 6 000 | 100% Conforme |
  | Tacos XL pané | `txl-1` | Tacos XL pané | 6 000 F CFA | 6 000 | 100% Conforme |
  | Burgers | `bg-1` | Burger complet | 2 000 F CFA | 2 000 | 100% Conforme |
  | Burgers | `bg-4` | Burger royal | 3 000 F CFA | 3 000 | 100% Conforme |
  | Tacos simples | `ts-1` | Tacos viande simple | 2 500 F CFA | 2 500 | 100% Conforme |
  | Tacos simples | `ts-8` | Tacos XL simple | 5 000 F CFA | 5 000 | 100% Conforme |
- **Commande de test** :
  ```bash
  python manage.py test api.tests.test_api_endpoints.ApiEndpointsHTTPTests.test_menu_nominal_returns_only_available_items
  ```
- **Preuves consignées** : Total exact de 32 articles uniques et 7 catégories en base. Aucun article indisponible renvoyé.
- **Limites** : Les déclinaisons royales secondaires de tacos simples restent réservées pour la Phase 2.

---

### Fiche P2 — Seed idempotent et stratégie de remplissage initial
- **Date** : 21/10/2026
- **Branche** : `feature/backend/setup-and-pricing`
- **Ce qui a été fait** :
  - Refonte de la commande Django `seed_bmc.py` avec encapsulation dans un bloc transactionnel `with transaction.atomic():`.
  - Remplacement des `get_or_create` par `update_or_create` pour garantir la mise à jour sans doublons de tous les champs.
  - Ajout de compteurs précis (créés vs mis à jour).
  - Préservation absolue des commandes et lignes de commandes existantes (`Order`, `OrderItem`).
- **Fichiers modifiés** : `backend/api/management/commands/seed_bmc.py`.
- **Commande de test** :
  ```bash
  python manage.py seed_bmc
  python manage.py seed_bmc
  ```
- **Preuves consignées** :
  - Exécution 1 : `Catégories (créées: 7, màj: 0, total: 7) | Articles (créés: 32, màj: 0, total: 32)`
  - Exécution 2 : `Catégories (créées: 0, màj: 7, total: 7) | Articles (créés: 0, màj: 32, total: 32)`
  - 0 doublon créé lors de la ré-exécution.
- **Limites** : Aucune.

---

### Fiche P3 — Plat du Jour : validation stricte et règles métier
- **Date** : 21/10/2026
- **Branche** : `feature/backend/setup-and-pricing`
- **Ce qui a été fait** :
  - Durcissement de `ToggleDailySpecialView` : validation booléenne stricte (`isinstance(raw_val, bool)`). Le texte `"false"` ou `"invalid"` renvoie une erreur HTTP 400.
  - Impossibilité d'activer un article indisponible (`is_available=False`) en tant que Plat du Jour (HTTP 400).
  - Règle D5 : désactivation atomique des autres plats du jour lors de l'activation d'un nouveau plat.
  - Protection de l'endpoint : permission restreinte à `IsAdminUser` (401/403 pour utilisateurs non autorisés).
  - `DailySpecialView` (GET) ne renvoie que les articles actifs et disponibles.
- **Fichiers modifiés** : `backend/api/views.py`.
- **Commande de test** :
  ```bash
  python manage.py test api.tests.test_api_endpoints.ApiEndpointsHTTPTests.test_toggle_daily_special_nominal_admin
  python manage.py test api.tests.test_api_endpoints.ApiEndpointsHTTPTests.test_toggle_daily_special_non_boolean_fails_400
  python manage.py test api.tests.test_api_endpoints.ApiEndpointsHTTPTests.test_toggle_daily_special_unavailable_item_fails_400
  python manage.py test api.tests.test_api_endpoints.ApiEndpointsHTTPTests.test_toggle_daily_special_anonymous_refused_401_or_403
  ```
- **Preuves consignées** : 4/4 tests spécifiques au toggle réussis.
- **Limites** : Aucune.

---

### Fiche P4 — Alertes de commandes : endpoints et acquittement
- **Date** : 21/10/2026
- **Branche** : `feature/backend/setup-and-pricing`
- **Ce qui a été fait** :
  - Sécurisation de `OrderUnnotifiedEventsView` (GET & POST) avec `permission_classes = [IsAdminUser]`.
  - `GET` filtre strictement sur `is_notified_to_admin=False` ordonné par date antichronologique.
  - `POST` : validation stricte du champ `order_refs` (erreur 400 si non-liste).
  - Acquittement ciblé : seules les références indiquées passent à `is_notified_to_admin=True`.
  - Règle D14 : acquittement global automatique si aucun champ `order_refs` n'est transmis.
  - Idempotence garantie : réacquitter les mêmes références renvoie HTTP 200 sans erreur.
- **Fichiers modifiés** : `backend/api/views.py`.
- **Commande de test** :
  ```bash
  python manage.py test api.tests.test_api_endpoints.ApiEndpointsHTTPTests.test_unnotified_events_get_nominal_200
  python manage.py test api.tests.test_api_endpoints.ApiEndpointsHTTPTests.test_unnotified_events_post_targeted_acknowledgment
  python manage.py test api.tests.test_api_endpoints.ApiEndpointsHTTPTests.test_unnotified_events_post_global_acknowledgment_without_refs
  python manage.py test api.tests.test_api_endpoints.ApiEndpointsHTTPTests.test_unnotified_events_post_malformed_order_refs_fails_400
  python manage.py test api.tests.test_api_endpoints.ApiEndpointsHTTPTests.test_unnotified_events_post_anonymous_refused
  ```
- **Preuves consignées** : 5/5 tests de notification et acquittement validés avec succès.
- **Limites** : L'alerte sonore et la notification push du navigateur sont gérées côté frontend.

---

### Fiche P5 — Tests du moteur de prix et des cas d'erreur
- **Date** : 21/10/2026
- **Branche** : `feature/backend/setup-and-pricing`
- **Ce qui a été fait** :
  - Création du fichier `backend/api/tests/test_pricing.py`.
  - Couverture exhaustive de 10 cas d'évaluation du moteur de tarification 100% serveur.
  - Démonstration formelle par essai négatif : preuve que si le montant client était lu, le test échouerait.
  - Vérification de l'atomicité, des totaux multi-articles, des sous-totaux et de la génération des références `BMC-XXXX`.
- **Fichiers modifiés** : `backend/api/tests/test_pricing.py`.
- **Commande de test** :
  ```bash
  python manage.py test api.tests.test_pricing
  ```
- **Preuves consignées** :
  ```text
  Ran 10 tests in 2.187s
  OK
  ```
- **Limites** : Aucune.

---

### Fiche P6 — Tests des endpoints et des réponses HTTP
- **Date** : 21/10/2026
- **Branche** : `feature/backend/setup-and-pricing`
- **Ce qui a été fait** :
  - Création du fichier `backend/api/tests/test_api_endpoints.py`.
  - Couverture de 100% des endpoints du chantier B4 :
    - `GET /api/health/`
    - `GET /api/menu/`
    - `GET /api/daily-special/`
    - `PATCH /api/daily-special/<id>/toggle/`
    - `POST /api/orders/`
    - `GET /api/orders/` (avec filtre `?status=`)
    - `GET /api/orders/<ref_or_id>/`
    - `PATCH /api/orders/<ref_or_id>/status/`
    - `GET /api/orders/events/unnotified/`
    - `POST /api/orders/events/unnotified/`
  - Tests nominaux (200, 201), tests d'erreur (400, 404) et tests de permissions (401/403).
- **Fichiers modifiés** : `backend/api/tests/test_api_endpoints.py`.
- **Commande de test** :
  ```bash
  python manage.py test api.tests.test_api_endpoints
  ```
- **Preuves consignées** :
  ```text
  Ran 25 tests in 27.645s
  OK
  ```
  Et sur la suite globale (P5 + P6) :
  ```text
  Ran 35 tests in 29.832s
  OK
  ```
- **Limites** : Aucune.

---

### Fiche P7 — Annotations et documentation Swagger / OpenAPI
- **Date** : 21/10/2026
- **Branche** : `feature/backend/setup-and-pricing`
- **Ce qui a été fait** :
  - Décoration de l'intégralité des vues dans `backend/api/views.py` avec `@extend_schema` et `@extend_schema_view` de `drf-spectacular`.
  - Ajout des sérialiseurs de requête et réponse dédiés dans `backend/api/serializers.py`.
  - Documentation soignée en français : résumés, descriptions détaillées, tags (Santé, Menu & Catalogue, Plat du Jour, Commandes, Administration), paramètres d'URL et de query string, codes de réponse HTTP (200, 201, 400, 401, 403, 404).
  - Exposition des routes `/api/schema/` et `/api/docs/`.
  - Validation stricte du schéma généré avec `spectacular --validate`.
- **Fichiers modifiés** : `backend/api/views.py`, `backend/api/serializers.py`, `backend/api/urls.py`, `backend/bmc_backend/settings.py`, `backend/requirements.txt`.
- **Commande de test** :
  ```bash
  python manage.py spectacular --validate
  ```
- **Preuves consignées** :
  ```text
  Schema generation summary:
  Warnings: 0 (unique)
  Errors:   0 (unique)
  ```
  Génération sans aucune erreur bloquante.
- **Limites** : Aucune.

---

### Fiche P8 — Documentation d'installation et exemples d'utilisation
- **Date** : 21/10/2026
- **Branche** : `feature/backend/setup-and-pricing`
- **Ce qui a été fait** :
  - Rédaction complète du fichier `backend/README.md`.
  - Guide pas à pas de zéro : prérequis Python 3.13, création du venv, `pip install -r requirements.txt`, variables d'environnement documentées sans secret réel.
  - Commandes de migration et de seed.
  - Commandes d'exécution de la suite de tests automatisés.
  - 8 exemples rejouables `curl` couvrant l'ensemble des endpoints avec payloads exacts et codes HTTP attendus.
- **Fichiers modifiés** : `backend/README.md`.
- **Commande de test** :
  ```bash
  python manage.py runserver  # et replay des exemples curl
  ```
- **Preuves consignées** : Guide exécutable de zéro sans ambiguïté.
- **Limites** : Déploiement cloud de production prévu en phase finale.

---

### Fiche P9 — Tenue du journal de suivi personnel
- **Date** : 21/10/2026
- **Branche** : `feature/backend/setup-and-pricing`
- **Ce qui a été fait** :
  - Maintien rigoureux et continu du présent journal `docs/docs_backend/journal_pathe.md`.
  - Renseignement exhaustif des fiches pour P1, P2, P3, P4, P5, P6, P7, P8 et P9 avec preuves réelles d'exécution.
  - Respect strict des frontières de responsabilité : aucune tâche d'Ibrahima (I1 à I8) n'a été revendiquée ni modifiée dans son journal.
- **Fichiers modifiés** : `docs/docs_backend/journal_pathe.md`.
- **Commande de test** :
  Revue croisée de conformité documentaire.
- **Preuves consignées** : Tableau de bord à jour, 100% des critères vérifiés et cochés.
- **Limites** : Tâche continue jusqu'à la livraison finale.
