# Journal de suivi — Ibrahima Khalilou Diallo

> **Périmètre : uniquement I1 à I9.** Les tâches de Pathé sont dans [journal_pathe.md](journal_pathe.md).
> Fiches détaillées (objectif, périmètre, cas d'erreur, hors périmètre) : [repartition_taches_backend.md](../repartition_taches_backend.md).
> Branche : `feature/backend/setup-and-pricing` · **Commits locaux faits (21/10/2026), aucun push** : rien n'est publié tant que je ne l'ai pas demandé.

**Statuts** : `À faire` → `En cours` → `À tester` → `En revue` → `Validée`. Aucune tâche n'est `Validée` : cela exige la revue croisée de Pathé et la validation de Lansana Coly.

## Historique Git local (21/10/2026)

| Commit | Contenu |
|---|---|
| `63a4556` | Structure du projet (`manage.py` dans `backend/`, dossiers imbriqués supprimés) — I1 |
| `9edd018` | Statuts de paiement, index, contraintes `OrderItem` — I2 |
| `1daa164` | Configuration par environnement, auth par jeton, erreurs uniformes — I1/I6/I7 |
| `88630d3` | Création / liste / détail / statut des commandes, schéma OpenAPI, journal — I3 à I9 |
| `d71f536` | Tests automatisés (24) : commandes, transitions, token, contraintes — I2 à I7 |
| `c86525c` | `errors.detail` sur les erreurs hors validation (compatibilité frontend, D10) |
| `f011344` | **Fusion** de `origin/feature/backend/pathe-fall` (5 conflits résolus, voir ci-dessous) |

## Tableau de suivi (21/10/2026)

| ID | Tâche | Statut réel | Pourquoi ce statut |
|----|-------|-------------|--------------------|
| I1 | Arborescence et socle Django | **En revue** | Structure identique à `fix-project-layout` ; `check`, `makemigrations --check`, `migrate` base vide vérifiés. Attend la relecture de Pathé. |
| I2 | Modèles, contraintes, migrations | **En revue** | Migration `0002` appliquée sur base vide, contraintes testées dans le dépôt. **Non testée sur une base remplie avec doublons.** |
| I3 | Moteur de prix et création des commandes | **En revue** | Tests dans le dépôt (`test_orders_ibrahima.py`). Concurrence réelle non testée (collisions simulées). |
| I4 | Cycle de vie des commandes | **En revue** | Transitions D2/D6 testées dans le dépôt. Règle « annulée déjà payée » non définie. |
| I5 | Socle Swagger / OpenAPI | **En revue** | Routes servies, schéma généré sans avertissement sur l'arbre fusionné. |
| I6 | Contrats API et schémas | **À tester** | Gestionnaire d'erreurs testé. La vérification **C1** (schéma ↔ réponses réelles) n'est pas faite. |
| I7 | Sécurité du Backend | **En revue** | Accès 401/403/token testés dans le dépôt. Le **frontend admin** ne s'authentifie pas encore (hors périmètre). |
| I8 | Revue croisée et PR | **En cours** | Fusion de la branche de Pathé faite. PR **non ouverte** (rien de poussé). |
| I9 | Tenue de ce journal | **En cours** | Tâche continue. |

---

## Fiches d'exécution

### I1 — Arborescence et socle Django
- **Objectif** : démarrage reproductible depuis `backend/`, structure conforme au guide de collaboration.
- **Fichiers** : déplacements par `git mv` de `manage.py` → `backend/manage.py`, `backend/api/api/*` → `backend/api/*`, `backend/bmc_backend/bmc_backend/*` → `backend/bmc_backend/*` ; deux `__init__.py` vides ajoutés (`api/management/`, `api/management/commands/`).
- **Décision D8** : déplacements refaits sur ma branche. Le résultat est **identique** à `origin/feature/backend/fix-project-layout` (PR #9, ouverte par El Hadji) : la fusion de cette PR ne produira pas de conflit.
- **Vérifié** : `check` → 0 problème ; `makemigrations --check` → aucun changement ; `runserver` + `/api/health/` → 200.
- **Problèmes restants** : aucun venv (paquets installés globalement).

### I2 — Modèles, contraintes et migrations
- **Fichiers** : `backend/api/models.py`, `backend/api/migrations/0002_payment_status_choices_indexes_constraints.py`.
- **Changements** : `payment_status` avec choix `unpaid`/`pending`/`paid` ; index sur `is_notified_to_admin` et `status` ; `OrderItem` : unicité (commande, article), `quantity >= 1`, `subtotal = unit_price × quantity`.
- **Vérifié** : `migrate` base vide ; les 3 contraintes refusent les insertions invalides (tests `ConstraintTests`) ; le seed de Pathé produit 32 articles sans erreur après fusion.
- **Problèmes restants** : (1) `0002` **jamais testée sur une base remplie** avec des lignes de commande en double (elle échouerait) ; (2) `0001_initial` porte l'en-tête « Django 5.2.18 » alors que le poste a 5.0.3 (elle s'applique sans erreur).

### I3 — Moteur de prix et création des commandes
- **Fichiers** : `backend/api/serializers.py`, `backend/api/order_rules.py`, `backend/api/views.py` (`OrderListCreateView.post`), `backend/api/exceptions.py`.
- **Règles** : seuls `id` et `quantity` sont lus (prix/total client ignorés) ; panier vide / inconnu / indisponible → 400 ; quantité entière stricte 1–20 ; fusion des doublons (code ou ID) puis contrôle du maximum ; 30 lignes distinctes max ; référence `BMC-XXXX` arbitrée par la contrainte UNIQUE avec 25 tentatives, sinon **503** ; création atomique.
- **Tests dans le dépôt** : `CreateOrderTests` (valide, prix falsifiés, 10 paniers invalides, doublons, 31 lignes, champ invalide, collision, références épuisées → 503, rollback).
- **Non vérifié** : concurrence multi-processus réelle.
- **Décision en attente** : 10 000 références seulement (voir « Décisions en attente »).

### I4 — Cycle de vie des commandes
- **Matrice (D2)** : `pending → confirmed → preparing → delivering → delivered` ; `cancelled` depuis `pending`/`confirmed`/`preparing` ; `delivered` et `cancelled` finaux ; pas de saut ni de retour.
- **Paiement (D6)** : `unpaid → pending`, `unpaid → paid`, `pending → paid` ; `paid` final ; staff uniquement ; modifiable quel que soit le statut (espèces à la livraison).
- **Comportement** : tout ou rien, `select_for_update`, idempotent, 404 / 400 explicites, filtre `?status=` validé.
- **Tests dans le dépôt** : `StatusTransitionTests`.
- **Problème restant** : `select_for_update` est sans effet sur SQLite ; aucune règle pour une commande annulée déjà payée.

### I5 — Swagger / OpenAPI
- **Fichiers** : `settings.py`, `urls.py`, `requirements.txt`. Routes `/api/schema/`, `/api/docs/`, `/api/redoc/` (publiques en développement, staff en production sauf `BMC_API_DOCS_PUBLIC=true`).
- **Vérifié après fusion** : génération du schéma sans avertissement ni erreur (les vues de Pathé sont maintenant annotées).
- **Point d'attention** : deux jeux de schémas coexistent (`api_schemas.py` pour mes vues, `serializers.py` pour ceux de Pathé). À unifier plus tard.

### I6 — Contrats API et schémas
- **Contrat d'erreur (D10)** : `{"success": false, "error": "<message>", "errors": {...}}`. Validation (400) : `errors` par champ. Autres erreurs (401, 403, 404, 405, 429, 503) : `errors.detail = ["<message>"]` **et** un champ `code`. Compatible avec ce que demande El Hadji (PR #9).
- **Reste** : C1 (comparaison schéma ↔ réponses réelles) non faite.

### I7 — Sécurité
- **Configuration** : `DJANGO_DEBUG` désactivé par défaut ; en production, démarrage refusé sans `DJANGO_SECRET_KEY` ni `DJANGO_ALLOWED_HOSTS` ; CORS par liste d'origines ; cookies sécurisés. L'ancienne clé en dur reste dans l'**historique Git** (à considérer comme compromise).
- **Authentification (D1)** : jeton DRF ; `POST /api/auth/token/` réservé au staff, 10 requêtes/min.
- **Accès** : public = health, menu, daily-special, `POST /api/orders/`, obtention de jeton. Staff = liste **et détail** des commandes, statut, toggle, alertes.
- **Tests dans le dépôt** : `AccessTests` (401 anonyme sur 6 routes, token réel, non-staff 403, jeton invalide sans effet sur le menu, 429).
- **Problèmes restants** : frontend admin sans en-tête token (401) ; jetons sans expiration ; throttling par processus ; création de commande publique non limitée ; **pas d'endpoint de suivi client** (décision).

---

## Fusion de la branche de Pathé (commit `f011344`)

| Fichier | Résolution |
|---|---|
| `settings.py`, `urls.py`, `requirements.txt` | Ma version (config par environnement, token, redoc) |
| `serializers.py` | Ma version + serializers OpenAPI de Pathé (P7). Aide de `order_refs` corrigée (D14 : liste obligatoire non vide) |
| `views.py` | Vues de Pathé (Menu, DailySpecial, Toggle, Unnotified) + mes vues (Health, Order*) |
| `tests/` | Ses 36 tests conservés. **3 modifiés par moi** : détail de commande avec admin (+ un test anonyme refusé) ; statut via `confirmed` (D2) |

**Résultat : 60 tests sur 60 passent** (24 miens + 36 de Pathé), `check`, `makemigrations --check`, seed (32 articles) et schéma OpenAPI sans erreur.

> Les 3 tests de Pathé modifiés l'ont été pour s'aligner sur les décisions I7 et D2. À signaler à Pathé.

## Audit croisé (21/10/2026)

Rapport complet : `audit_backend_ibrahima_pathe.md` (artefact de session). Points principaux :
- **Pathé** : détail de commande public (fuite nom/téléphone/adresse, corrigée à la fusion) ; menu de 32 articles alors que le docx officiel en a **43** (11 « Tacos simples » absents) ; seed qui écrase les modifications de l'admin ; README qui documente des variables d'environnement non lues par sa configuration ; D3, D4, D5, D7, D14 décidées seul.
- **Moi** : travail non poussé ; migration `0002` non testée sur base remplie ; concurrence réelle non testée ; clé historique dans Git.

## Retour d'El Hadji (PR #9, 21/10/2026, 05:24 UTC)

| Sujet | Position backend |
|---|---|
| D8 | D'accord, identique à mes renommages. |
| D1 | Token DRF, **déjà actif** : l'app admin doit envoyer `Authorization: Token <clé>` sinon la sonnerie s'arrête (401). |
| Détail de commande public | **Refusé** (données personnelles, référence à 4 chiffres énumérable). Proposition : endpoint de suivi minimal (statut, articles, total). |
| D14 | Liste `order_refs` vide refusée (400). Côté Pathé. |
| D10 | Compatible : `errors.detail` ajouté. |
| `image_url` du seed | Tâche de Pathé. |

Risques à lui signaler : clé dans le navigateur (`VITE_*`), statuts stricts (passage par `confirmed`), gestion des 401/403, limites de quantité. Texte prêt dans `commentaire_pr9_frontend.md` (artefact de session). **Non posté** : à publier manuellement sur la PR #9.

---

## Interface pour Pathé

- **Contrat de commande** : `POST /api/orders/` accepte `customer_name`, `phone`, `address`, `notes`, `payment_method` (`cash`/`wave`/`orange_money`), `items[{id, quantity}]`. Réponses : 201 `{success, message, order}` ; 400 voir contrat d'erreur ; 503 références épuisées.
- **Points d'intégration pour les tests** : `MAX_QUANTITY_PER_LINE`, `MAX_DISTINCT_LINES`, `generate_order_ref` dans `api/order_rules.py` (`mock.patch.object(order_rules, 'generate_order_ref', ...)`) ; `resolve_cart` dans `api/serializers.py`.
- **Matrices** : `ORDER_STATUS_TRANSITIONS` et `PAYMENT_STATUS_TRANSITIONS` dans `api/order_rules.py`.
- **Authentification pour les tests HTTP** : utilisateur `is_staff=True` et `HTTP_AUTHORIZATION="Token <jeton>"` (voir `AccessTests`).
- **Lancer Django** : exige `DJANGO_DEBUG=true` (ou une clé et des hôtes) ; voir `backend/.env.example`. Les variables sont préfixées `DJANGO_*`.

## Commandes pour reproduire les vérifications (PowerShell, depuis la racine du dépôt)

```powershell
$env:DJANGO_DEBUG = "true"
python backend/manage.py check
python backend/manage.py makemigrations --check --dry-run
python backend/manage.py test api                                   # 60 tests
$env:BMC_DB_PATH = "$PWD\backend\_verify.sqlite3"                   # base jetable
python backend/manage.py migrate
python backend/manage.py seed_bmc
python backend/manage.py spectacular --file backend\_schema.yml
Remove-Item backend\_verify.sqlite3, backend\_schema.yml
```

## Tests réellement exécutés (bilan, 21/10/2026)

| Vérification | Résultat |
|---|---|
| `manage.py test api` (arbre fusionné) | ✅ 60/60 |
| dont `test_orders_ibrahima.py` | ✅ 24/24 |
| `check`, `makemigrations --check` | ✅ 0 problème, aucun changement |
| `migrate` base vide, seed Pathé | ✅ 32 articles, 7 catégories |
| Schéma OpenAPI (arbre fusionné) | ✅ aucun avertissement |
| Production sans clé / sans hôtes | ✅ échoue comme prévu (vérifié avant la fusion) |

**Non exécutés** : concurrence multi-processus réelle ; migration `0002` sur une base remplie avec doublons ; test du frontend (non modifié) ; vérification C1.

## Ce qu'il me reste à faire

1. Tester la migration `0002` sur une base avec des lignes en double.
2. Décider avec El Hadji du suivi de commande public minimal, puis l'implémenter.
3. Décider de la longueur de la référence `BMC-XXXX`.
4. Poster le commentaire sur la PR #9 ; prévenir El Hadji (token, `confirmed`).
5. Informer Pathé des 3 tests modifiés et lui transmettre ses points (voir audit).
6. **Quand je le déciderai** : pousser la branche, ouvrir la PR vers `develop` (reviewers Pathé et Lansana), jamais en `--force`.

**Titre de PR proposé** : `feat(backend): socle Django, moteur de prix durci, cycle de vie des commandes, sécurité et OpenAPI (I1–I7)`
**Impacts frontend à écrire dans la PR** : (1) token sur les routes admin ; (2) cycle admin via `confirmed` ; (3) erreurs avec `error` en plus et `errors.detail` pour les erreurs hors validation.

## Décisions tranchées (21/10/2026)
D1 jeton DRF + `IsAdminUser` · D2 matrice linéaire avec `cancelled` avant livraison · D6 paiement `unpaid→pending→paid`, `unpaid→paid`, `paid` final · D8 `git mv` refait sur ma branche · D10 `success:false` + `error` + `errors` (+ `errors.detail`) · D12 20 par ligne, 30 lignes.

## Décisions encore en attente
D13 (version de Python : 3.13.9 constatée) · référence `BMC-XXXX` sur 4 chiffres · suivi de commande par le client · limitation de débit de la création de commande · politique pour une commande annulée déjà payée · menu 32 ou 43 articles (Lansana) · D3, D4, D5, D7, D14 de Pathé à confirmer.
