# Journal de suivi — Ibrahima Khalilou Diallo

> **Périmètre : uniquement I1 à I9.** Les tâches de Pathé sont dans [journal_pathe.md](journal_pathe.md).
> Fiches détaillées (objectif, périmètre, cas d'erreur, hors périmètre) : [repartition_taches_backend.md](../repartition_taches_backend.md).
> Branche : `feature/backend/setup-and-pricing` · **Aucun commit ni push effectué** : les modifications sont dans l'arbre de travail, prêtes pour relecture.

**Statuts** : `À faire` → `En cours` → `À tester` → `En revue` → `Validée`. Aucune tâche n'est `Validée` : cela exige la revue croisée de Pathé et la validation de Lansana Coly.

## Tableau de suivi (21/10/2026)

| ID | Tâche | Statut réel | Pourquoi ce statut |
|----|-------|-------------|--------------------|
| I1 | Arborescence et socle Django | **En revue** | Structure identique à `fix-project-layout` ; `check`, `makemigrations --check`, `migrate` base vide, `runserver` + `/api/health/` vérifiés. Attend la relecture de Pathé. |
| I2 | Modèles, contraintes, migrations | **En revue** | Migration `0002` générée et appliquée sur base vide ; contraintes refusent les violations. Attend la relecture de Pathé. |
| I3 | Moteur de prix et création des commandes | **À tester** | Implémenté et vérifié par mes tests de fumée (hors dépôt). La preuve officielle attendue est la suite **P5** de Pathé, pas encore écrite. |
| I4 | Cycle de vie des commandes | **À tester** | Implémenté et vérifié par mes tests de fumée. Preuve officielle attendue : suite **P6** de Pathé. |
| I5 | Socle Swagger / OpenAPI | **En revue** | Routes servies, schéma généré sans avertissement. 4 vues de Pathé n'ont pas encore de schéma (voir problèmes restants). |
| I6 | Contrats API et schémas | **À tester** | Serializers et gestionnaire d'erreurs en place pour mes endpoints. La vérification **C1** (schéma ↔ réponses réelles, avec les exemples de P7) n'est pas faite. |
| I7 | Sécurité du Backend | **À tester** | Permissions appliquées et vérifiées. Les tests d'accès officiels relèvent de **P6** ; le **frontend admin** doit envoyer le jeton (non fait, hors périmètre). |
| I8 | Revue croisée et PR | **En cours** | Résumé et contenu de PR préparés ci-dessous. PR **non ouverte**, rien n'est commité ni poussé. |
| I9 | Tenue de ce journal | **En cours** | Tâche continue. |

---

## Fiches d'exécution

### I1 — Arborescence et socle Django
- **Objectif** : démarrage reproductible depuis `backend/`, structure conforme au guide de collaboration.
- **Fichiers réellement modifiés** : déplacements par `git mv` (historique conservé) de `manage.py` → `backend/manage.py`, `backend/api/api/*` → `backend/api/*`, `backend/bmc_backend/bmc_backend/*` → `backend/bmc_backend/*` ; création de deux `__init__.py` vides : `backend/api/management/__init__.py` et `backend/api/management/commands/__init__.py`.
- **Décisions** : D8 — déplacements refaits sur ma branche plutôt que merge de la branche d'El Hadji. Le résultat est **identique** à `origin/feature/backend/fix-project-layout` (`git diff` vide sur `backend/` et `manage.py`).
- **Tests exécutés / résultats** : `check` → 0 problème ; `makemigrations --check --dry-run` → « No changes detected » ; `runserver` + `GET /api/health/` → 200 JSON.
- **Exception documentée** : les deux `__init__.py` vides se trouvent dans le dossier `management/` de Pathé. Ils sont nécessaires à la découverte fiable de la commande `seed_bmc` ; **`seed_bmc.py` n'a pas été modifié**.
- **Problèmes restants** : version de Python locale 3.13.9 ✔ ; aucun venv (paquets installés globalement).
- **Dépendances envers Pathé** : aucune.

### I2 — Modèles, contraintes et migrations
- **Objectif** : modèles conformes à B1 et intègres.
- **Fichiers** : `backend/api/models.py`, `backend/api/migrations/0002_payment_status_choices_indexes_constraints.py` (nouveau).
- **Changements** : `payment_status` avec choix `unpaid`/`pending`/`paid` ; index sur `is_notified_to_admin` et sur `status` ; `OrderItem` : unicité (commande, article), `quantity >= 1`, `subtotal = unit_price × quantity`. Les `CheckConstraint` choisissent `check`/`condition` selon la version de Django.
- **Décisions** : migration **non destructrice** (aucune suppression, aucun changement de type) ; D6 pour les valeurs de paiement.
- **Tests / résultats** : `migrate` sur base vide → OK ; `showmigrations` → `0001`, `0002` appliquées ; essais de violation → les 3 contraintes de `OrderItem` refusent bien l'insertion invalide.
- **Problèmes restants** : (1) `0002` n'a **pas** été testée sur une base déjà remplie contenant des doublons de ligne (aucune base n'est versionnée) ; elle échouerait dans ce cas. (2) `0001_initial` porte l'en-tête « Django 5.2.18 » alors que l'environnement local a Django 5.0.3 : elle s'applique sans erreur ici.
- **Dépendances envers Pathé** : le seed de Pathé fonctionne sans changement avec ces contraintes (exécuté 2 fois : 32 articles, sans erreur). **Interface** : modèles gelés (jalon J2).

### I3 — Moteur de prix et création des commandes
- **Objectif** : montant 100 % calculé par le serveur.
- **Fichiers** : `backend/api/serializers.py` (partie création de commande), `backend/api/order_rules.py` (nouveau), `backend/api/views.py` (`OrderListCreateView.post`), `backend/api/exceptions.py` (nouveau : erreur 503).
- **Règles implémentées** :
  - Seuls `id` et `quantity` sont lus : `price`, `unit_price`, `subtotal`, `total_amount` envoyés par le client sont **ignorés**.
  - Panier vide, article inconnu, article indisponible → 400 (toutes les erreurs du panier sont remontées ensemble).
  - Quantité : entier JSON strict de 1 à **20** par ligne (refus de `0`, négatif, `1.5`, `2.0`, `"2"`, booléen).
  - **Fusion** : les lignes du même article sont additionnées, que l'identifiant soit le code ou l'ID Django ; la quantité fusionnée est contrôlée (max 20). Maximum **30** lignes distinctes.
  - Prix lus en base **dans la transaction de création** (relecture) ; montants en **entiers F CFA**, sans flottant.
  - Référence `BMC-XXXX` : la contrainte UNIQUE de la base est l'arbitre. On insère dans un point de sauvegarde et on retente en cas de collision (25 essais max) ; aucune référence non vérifiée n'est utilisée. Si l'espace est épuisé → **503** avec message clair, aucune commande créée.
  - `transaction.atomic()` : commande + lignes (`bulk_create`) créées ensemble.
- **Décisions** : D12 (20 / 30). `payment_status` initial inchangé : `pending` pour Wave/Orange Money, `unpaid` pour espèces.
- **Tests / résultats** : tests de fumée (hors dépôt) — 81/81 réussis, dont panier vide, inconnu, indisponible, 10 quantités invalides, prix et total falsifiés, doublons, collisions simulées, références épuisées (503), rollback sur échec d'écriture des lignes.
- **Non vérifié** : concurrence réelle multi-processus (les collisions sont **simulées**, pas provoquées par des requêtes parallèles).
- **Problèmes restants / décision** : le format `BMC-XXXX` n'offre que **10 000** références ; avec le volume, les collisions deviennent fréquentes et le 503 possible. Décision à prendre : passer à plus de chiffres (`ORDER_REF_DIGITS`).
- **Dépendances envers Pathé** : P5 écrit les tests contre ce contrat (voir « Interface pour Pathé »).

### I4 — Cycle de vie des commandes
- **Objectif** : transitions contrôlées, statuts de commande et de paiement distincts.
- **Fichiers** : `backend/api/order_rules.py`, `backend/api/views.py` (`OrderListCreateView.get`, `OrderDetailView`, `OrderStatusUpdateView`).
- **Matrice (D2)** : `pending → confirmed → preparing → delivering → delivered` (sans saut ni retour) ; `cancelled` possible depuis `pending`, `confirmed`, `preparing` ; `delivered` et `cancelled` sont finaux.
- **Paiement (D6)** : `unpaid → pending`, `unpaid → paid`, `pending → paid` ; `paid` est final ; modifiable par le staff uniquement. Le paiement peut être modifié quel que soit le statut de la commande (paiement espèces à la livraison).
- **Comportement** : valeurs validées avant tout accès ; transition interdite → **400** avec message listant les valeurs permises ; **tout ou rien** (si l'un des deux changements est invalide, aucun n'est appliqué) ; verrou `select_for_update` dans une transaction ; demander l'état courant = succès sans effet (idempotent) ; référence inconnue → 404 ; filtre `?status=` inconnu → 400.
- **Tests / résultats** : couverts par les 81 tests de fumée (cycle complet, retour arrière, saut, annulation, états finaux, valeurs invalides, tout-ou-rien, paiement après livraison).
- **Problèmes restants** : aucune règle n'est définie pour une commande `cancelled` déjà payée (remboursement) : non inventée.
- **Dépendances envers Pathé** : P6 teste chaque transition.

### I5 — Swagger / OpenAPI
- **Fichiers** : `backend/bmc_backend/settings.py`, `backend/api/urls.py`, `backend/requirements.txt`.
- **Décisions** : `drf-spectacular` (prévu par la feuille de route et déjà installé). Routes : `/api/schema/`, `/api/docs/`, `/api/redoc/`. Accès : **publiques en développement** ; en production **réservées au staff connecté** (session), sauf `BMC_API_DOCS_PUBLIC=true`.
- **Tests / résultats** : génération du schéma → **0 avertissement** ; en DEBUG docs/redoc/schema → 200 ; en production anonyme → 403.
- **Problèmes restants** : la génération signale **4 erreurs (« unable to guess serializer »)** pour `MenuView`, `DailySpecialView`, `ToggleDailySpecialView`, `OrderUnnotifiedEventsView`. Ces vues relèvent de P1/P3/P4 et n'ont pas été modifiées : P7 doit les annoter avec les serializers fournis.

### I6 — Contrats API et schémas
- **Fichiers** : `backend/api/api_schemas.py` (nouveau), `backend/api/exceptions.py`, `backend/api/serializers.py` (annotation de type sur `get_items_count`), `backend/api/views.py`.
- **Contrat d'erreur (D10)** : `{"success": false, "error": "<message>", "errors": {champ: [messages]}}` pour la validation (400), et `{"success": false, "error": "...", "code": "..."}` pour le reste (401, 403, 404, 405, 429, 503). **La clé `errors` par champ est conservée** (le frontend la lit) ; `error` est ajouté ; les 404 passent de `{"detail": ...}` à l'enveloppe commune.
- **Schémas fournis** pour tous les endpoints, y compris ceux de Pathé (`MenuResponse`, `DailySpecialResponse`, `DailySpecialToggleRequest/Response`, `UnnotifiedEventsResponse`, `AcknowledgeRequest/Response`).
- **Problèmes restants** : **C1** (comparaison schéma ↔ réponses réelles avec les exemples de P7) non faite.

### I7 — Sécurité
- **Fichiers** : `backend/bmc_backend/settings.py`, `backend/api/urls.py`, `backend/api/auth_views.py` (nouveau), `backend/.env.example` (nouveau), `backend/requirements.txt`.
- **Configuration** : sécurisée par défaut. `DJANGO_DEBUG` désactivé par défaut ; en production, **démarrage refusé** sans `DJANGO_SECRET_KEY` ni `DJANGO_ALLOWED_HOSTS` ; CORS par liste d'origines (plus de `CORS_ALLOW_ALL_ORIGINS`) ; cookies sécurisés en production ; interface navigable DRF désactivée en production. Aucune valeur secrète dans le dépôt : l'ancienne clé en dur est supprimée du code (elle reste dans l'**historique Git** : à considérer comme compromise).
- **Authentification (D1)** : jeton DRF, `POST /api/auth/token/` réservé aux comptes staff, débit limité (10/min, `BMC_AUTH_THROTTLE_RATE`). Compte créé avec `python backend/manage.py createsuperuser` (aucun compte dans le code).
- **Politique d'accès** : public = health, menu, daily-special (GET), `POST /api/orders/`, obtention de jeton. Admin = liste et détail des commandes, changement de statut, toggle du Plat du Jour, alertes (GET/POST). Défaut global = `IsAdminUser` : les vues de Pathé (toggle, alertes) sont protégées **sans modification de leur code** ; la politique est posée dans `urls.py`.
- **Tests / résultats** : anonyme → 401 sur les 6 endpoints admin ; public → 200 ; jeton invalide n'empêche pas le menu ; non-staff → 403 ; staff → 200 ; limitation de débit → 429 ; production sans variables → échec attendu ; production complète → `check` OK, CORS fermé.
- **Problèmes restants** : (1) le **frontend admin n'envoie aucun en-tête d'authentification** : il recevra 401 tant qu'il ne se connecte pas via `/api/auth/token/` ; (2) les jetons n'expirent pas ; (3) la limitation de débit est par processus (cache mémoire) ; (4) la création de commande publique n'est pas limitée (risque de spam) ; (5) `GET /api/orders/<ref>/` est réservé au staff car il expose nom, téléphone et adresse : si le client doit suivre sa commande, il faudra un endpoint dédié (décision).
- **Dépendances envers Pathé** : P3 et P4 doivent s'appuyer sur ces permissions (ne pas les redéfinir) ; P6 teste 401/403.

---

## Interface pour Pathé

- **Contrat de commande (P5)** : `POST /api/orders/` accepte `customer_name`, `phone`, `address`, `notes`, `payment_method` (`cash`/`wave`/`orange_money`), `items[{id, quantity}]`. Réponses : 201 `{success, message, order}` ; 400 voir contrat d'erreur ; 503 références épuisées.
- **Points d'intégration pour les tests** : constantes `MAX_QUANTITY_PER_LINE`, `MAX_DISTINCT_LINES` et fonction `generate_order_ref` dans `api/order_rules.py` (à remplacer par un `mock.patch.object(order_rules, 'generate_order_ref', ...)` pour simuler des collisions) ; fonction `resolve_cart` dans `api/serializers.py`.
- **Matrice de transitions (P6)** : `ORDER_STATUS_TRANSITIONS` et `PAYMENT_STATUS_TRANSITIONS` dans `api/order_rules.py`.
- **Authentification pour les tests HTTP** : créer un utilisateur `is_staff=True` et passer `HTTP_AUTHORIZATION="Token <jeton>"` (jeton via `Token.objects.create(user=...)`).
- **Lancer Django** : exige `DJANGO_DEBUG=true` (ou une clé et des hôtes) ; voir `backend/.env.example`.
- **P3** : le toggle est désormais réservé au staff ; la validation booléenne stricte reste à faire (P3).
- **P4** : les alertes sont réservées au staff ; le schéma `AcknowledgeRequestSerializer` est fourni ; le comportement « sans références » reste à trancher (D14).
- **P7** : annoter `MenuView`, `DailySpecialView`, `ToggleDailySpecialView`, `OrderUnnotifiedEventsView` avec les schémas de `api/api_schemas.py`.
- **P8** : variables d'environnement dans `backend/.env.example`.

## Commandes pour reproduire les vérifications (PowerShell, depuis la racine du dépôt)

```powershell
$env:DJANGO_DEBUG = "true"
$env:BMC_DB_PATH  = "$PWD\backend\_verify.sqlite3"     # base jetable
python backend/manage.py check
python backend/manage.py makemigrations --check --dry-run
python backend/manage.py migrate
python backend/manage.py spectacular --file backend\_schema.yml    # schéma OpenAPI
python backend/manage.py runserver                                  # puis GET http://127.0.0.1:8000/api/health/
Remove-Item backend\_verify.sqlite3, backend\_schema.yml           # nettoyage
```

Production (doit refuser de démarrer sans ces variables) :
```powershell
Remove-Item Env:DJANGO_DEBUG -ErrorAction SilentlyContinue
python backend/manage.py check      # ImproperlyConfigured attendu
```

## Tests réellement exécutés (bilan)

| Vérification | Résultat |
|---|---|
| `check` (dev et production complète) | ✅ 0 problème |
| `check` production sans clé / sans hôtes | ✅ échoue comme prévu |
| `makemigrations --check --dry-run` | ✅ aucun changement |
| `migrate` sur base vide, `showmigrations` | ✅ `0001`, `0002` appliquées |
| Génération du schéma OpenAPI | ✅ 0 avertissement ; ⚠️ 4 erreurs liées aux vues non annotées de Pathé |
| `runserver` + `/api/health/` + `/api/orders/` anonyme | ✅ 200 puis 401 |
| Seed de Pathé (2 exécutions) sur base jetable | ✅ 32 articles, sans erreur (fichier non modifié) |
| Tests de fumée I2/I3/I4/I7 (script temporaire hors dépôt, base de test) | ✅ **81/81** |

**Non exécutés** : concurrence multi-processus réelle ; migration `0002` sur une base remplie avec doublons ; test du frontend (non modifié) ; suites P5/P6 (propriété de Pathé, inexistantes) ; `pytest`/`manage.py test` (aucun test dans le dépôt).

> Les tests de fumée sont un script **temporaire placé hors dépôt** : ils ne remplacent pas P5/P6 et ne sont pas livrés.

## Préparation I8 — Pull Request (non ouverte)

**Branche** : `feature/backend/setup-and-pricing` → **base `develop`** (jamais `main`). Reviewers : Pathé Fall, Lansana Coly. Ne pas fusionner sans l'approbation de Lansana.

**Titre proposé** : `feat(backend): socle Django, moteur de prix durci, cycle de vie des commandes, sécurité et OpenAPI (I1–I7)`

**Description proposée** :
- Structure `backend/` alignée sur le guide (renommages `git mv`, identique à `fix-project-layout`).
- Migration `0002` : choix de `payment_status`, index, contraintes d'intégrité sur les lignes de commande.
- Moteur de prix : panier validé côté serveur, quantité max 20, fusion des doublons, référence unique par contrainte + nouvelle tentative, atomicité.
- Cycle de vie : matrice de transitions, paiement distinct, tout-ou-rien.
- Sécurité : configuration par environnement, authentification par jeton, permissions explicites.
- OpenAPI : `/api/schema/`, `/api/docs/`, `/api/redoc/`.
- **Impacts frontend** : (1) l'app admin doit envoyer `Authorization: Token ...` ; (2) le cycle admin doit passer par `confirmed` ; (3) les erreurs gardent `success:false` + `errors`, avec `error` en plus ; les 404 n'ont plus `detail`.
- **Hors périmètre** : P1–P9 (aucune tâche de Pathé implémentée).

**Commandes** (à lancer après accord, jamais en `--force`) :
```powershell
git status
git add backend docs
git commit -m "feat(backend): socle, moteur de prix, statuts, securite et OpenAPI (I1-I7)"
git push origin feature/backend/setup-and-pricing
# Puis ouvrir la PR sur GitHub vers develop et demander la revue de Pathé et de Lansana Coly
```

**Checklist de revue croisée pour Pathé** : relire `order_rules.py`, `serializers.py` (partie commande), `views.py` (blocs commandes), `settings.py`, `urls.py` ; vérifier que `seed_bmc.py` et les vues `MenuView`, `DailySpecialView`, `ToggleDailySpecialView`, `OrderUnnotifiedEventsView` n'ont pas été modifiées ; relancer les commandes ci-dessus.

## Décisions tranchées (21/10/2026)
D1 jeton DRF + `IsAdminUser` · D2 matrice linéaire avec `cancelled` avant livraison · D6 paiement `unpaid→pending→paid`, `unpaid→paid`, `paid` final · D8 `git mv` refait sur ma branche · D10 `success:false` + `errors` + `error` · D12 20 par ligne, 30 lignes.

## Décisions encore en attente
D13 (version de Python : 3.13.9 constatée) · référence `BMC-XXXX` sur 4 chiffres (voir I3) · suivi de commande par le client (voir I7) · limitation de débit de la création de commande · politique pour une commande annulée déjà payée.
