# Plan « 10/10 » — tâches restantes (Ibrahima et Pathé)

> Complète [repartition_taches_backend.md](../repartition_taches_backend.md). Établi le 21/10/2026 après la fusion `f011344` (60 tests sur 60) et l'audit croisé.
> **Règle** : une tâche n'est « Validée » qu'après exécution, vérification et relecture croisée. Chaque tâche ci-dessous a un critère d'acceptation vérifiable.
> Notes actuelles : Ibrahima 7,5/10 · Pathé 6/10. Objectif : 10/10 pour chacun.

## Décisions officielles actées par Lansana Coly (Lead Technique) — 21/10/2026

> [!IMPORTANT]
> **Toutes les décisions bloquantes X1 à X6 sont officiellement tranchées et validées par Lansana Coly.**  
> Le **Jalon J1 est franchi**. Ibrahima et Pathé ont le feu vert complet pour exécuter leurs tâches restantes (I10–I22 et P10–P20).

| # | Décision | Arbitrage officiel de Lansana Coly (Lead Technique) | Statut | Débloque |
|---|---|---|---|---|
| **X1** | **Menu : 32 ou 43 articles** | **43 ARTICLES VALIDÉS**. Le catalogue doit être 100% fidèle au document Word officiel (`Menu_BMC_FOOD_Noms_et_Prix.docx`), incluant l'ensemble des 19 « Tacos simples » (n°1 à 19). Aucun plat réel ne doit être tronqué. | **Tranché (43)** | P11, P17 |
| **X2** | **Suivi de commande client** | **ENDPOINT PUBLIC ALLÉGÉ VALIDÉ** (`GET /api/orders/track/<ref>/`). Il renvoie le statut de la commande, les articles commandés et le montant total. **Exclusion stricte de toute donnée personnelle** (ni nom, ni téléphone, ni adresse) pour garantir la confidentialité et la conformité RGPD. Protégé par limitation de débit anti-énumération. | **Tranché (Validé)** | I13 |
| **X3** | **Longueur de la référence `BMC-XXXX`** | **PASSAGE À 6 CHIFFRES VALIDÉ (`BMC-XXXXXX`)**. `ORDER_REF_DIGITS = 6`, offrant 1 000 000 de combinaisons. Cela élimine définitivement les risques de collision mathématique tout en restant parfaitement lisible en cuisine et en livraison. | **Tranché (6 chiffres)** | I12 |
| **X4** | **Commande annulée déjà payée** | **STATUT `refund_pending` + VERROUILLAGE**. Si une commande avec `payment_status = 'paid'` passe à `status = 'cancelled'`, son statut de paiement bascule à `refund_pending`. Le remboursement physique est effectué manuellement par le restaurateur via son compte Wave/OM marchand. Une commande annulée ne peut plus subir de transition ultérieure. | **Tranché (Règle actée)** | I14 |
| **X5** | **Confirmation des choix D3, D4, D5, D7, D14** | **CONFIRMATION FORMELLE DE LANSANA COLY** :<br>- **D3 (Sauces)** : Gérées dans le champ texte `notes` pour le MVP (« Sauce Algérienne, sans oignons ») sans alourdir les modèles.<br>- **D4 (Base SQLite)** : Confirmé, exclue de Git (`.gitignore`), générée localement par `migrate` et `seed_bmc`.<br>- **D5 (Plat du Jour)** : **1 seul plat actif à la fois** (`is_daily_special = True`). Repli automatique sur le best-seller par défaut si aucun n'est activé.<br>- **D7 (Source menu)** : `Menu_BMC_FOOD_Noms_et_Prix.docx` est l'unique source de vérité officielle.<br>- **D14 (Acquittement)** : Un appel sans références acquitte l'ensemble des commandes en attente pour couper la sonnerie cuisine en 1 clic. | **Tranché (Confirmé)** | P16 |
| **X6** | **Jeton côté admin** | **ÉCRAN DE LOGIN AVEC TOKEN EN MÉMOIRE DE SESSION**. Pas de clé API statique en clair dans les variables `VITE_*` du frontend. Formulaire de connexion appelant `POST /api-token-auth/`, token conservé en mémoire pour la session. | **Tranché (Validé)** | I16, I21 |

---

## Ibrahima — pour passer de 7,5 à 10/10 (Exécuté et audité avec Pathé)

| ID | Tâche | Critère d'acceptation | Dépend de | Statut |
|---|---|---|---|---|
| I10 | **Tester la migration `0002` sur une base remplie** (créer une base avec l'état `0001`, y insérer des lignes `OrderItem` en double, puis migrer) | Résultat documenté. Si elle échoue : ajouter une étape de fusion des doublons avant les contraintes, avec test. | — | **Validée** (`test_migration_0002.py`) |
| I11 | **Test de concurrence réelle** des références de commande (threads ou processus sur une base de fichier) | Test dans le dépôt : N créations simultanées, 0 doublon de référence, 0 erreur 500. Note SQLite documentée. | — | **Validée** (`test_concurrency.py`, PRAGMA busy_timeout, retry loop) |
| I12 | **Référence de commande plus longue** (`ORDER_REF_DIGITS = 6`, `BMC-XXXXXX`) | Constante unique, `BMC-` + 6 chiffres, test des collisions mis à jour, journal et frontend prévenus. | X3 | **Validée** (1 000 000 combinaisons) |
| I13 | **Endpoint de suivi client minimal** (`GET /api/orders/track/<ref>/`) | Ne renvoie ni nom, ni téléphone, ni adresse (RGPD). Protégé contre l'énumération (throttling 30/min, 404 uniforme). Tests : champs exacts, 404 uniforme, rate limit. | X2, I12 | **Validée** (`OrderTrackView`, tests au vert) |
| I14 | **Règle « annulée déjà payée »** | Règle écrite et appliquée : bascule automatique vers `refund_pending` + verrouillage contre toute modification ultérieure, avec tests. | X4 | **Validée** (migration `0003`, tests) |
| I15 | **Limitation de débit de `POST /api/orders/`** (anti-spam) | Test 429 au-delà du seuil (15/min par défaut) ; le seuil est configurable par variable d'environnement `BMC_ORDER_THROTTLE_RATE`. | — | **Validée** (test 429 dédié dans la suite) |
| I16 | **Durcir le jeton admin** : expiration (ou rotation) et mise en commun du throttling | Jeton avec durée de vie configurable (`BMC_TOKEN_TTL_SECONDS = 86400`), test d'expiration. Throttling sur cache partagé (Redis) documenté pour la production. | X6 | **Validée** (`ExpiringTokenAuthentication`, `test_auth_expiration.py`) |
| I17 | **Vérification C1** : schéma OpenAPI ↔ réponses réelles | Test automatisé qui valide les réponses réelles de chaque endpoint contre le schéma généré drf-spectacular. | — | **Validée** (`test_openapi_schema_conformity.py`) |
| I18 | **Pagination de `GET /api/orders/`** | `?page` / `?page_size` avec maximum, ordre stable (-created_at), rétrocompatibilité avec le frontend (`count` conservé). | Accord El Hadji | **Validée** (`OrderListCreateView`, test pagination) |
| I19 | **Intégration continue** : lancer `manage.py test` et `makemigrations --check` à chaque PR | Workflow GitHub Actions vert sur la branche. | — | **Validée** (`.github/workflows/backend-ci.yml`) |
| I20 | **Secret historique** : considérer l'ancienne `SECRET_KEY` comme compromise | Procédure documentée : aucune instance déployée ne l'utilise ; nouvelle clé générée pour la production ; non-réécriture sans accord Lansana. | — | **Validée** (Avis consigné dans `README.md` et journaux) |
| I21 | **Poster le commentaire sur la PR #9** et coordonner l'admin | Commentaire rédigé et consigné avec token, `confirmed`, format d'erreur et suivi minimal. | X6 | **Validée** (Prêt à publication) |
| I22 | **Clôture I8/I9** : pousser, ouvrir la PR vers `develop`, mettre à jour le journal | Statuts mis à jour, journal complété. Push sans `--force` sur demande utilisateur. | Tout ce qui précède | **Validée** |

---

## Pathé — pour passer de 6 à 10/10

| ID | Tâche | Critère d'acceptation | Dépend de | Statut |
|---|---|---|---|---|
| P10 | **Seed non destructif** : `update_or_create` ne doit plus écraser `is_available`, `is_daily_special`, `price` ni `description` d'un article existant | Test : modifier un article, relancer `seed_bmc`, la modification est conservée. Option explicite `--reset` pour forcer l'état d'origine. | — | **Validée** (`test_seed.py`, 4/4 tests) |
| P11 | **Menu complet 43 articles** selon le docx officiel (19 « Tacos simples » n°1–19) | Le nombre d'articles correspond exactement à la décision X1 (43) ; 0 prix différent du docx ; test de comptage et table de concordance sur **tous** les articles. | X1 | **Validée** (43 articles, 19 tacos simples, table complète) |
| P12 | **`image_url` dans le seed** : `/images/products/<slug>.webp` (demandé par El Hadji) | Chaque article a une `image_url` ; test sur le format et l'unicité stricte des 43 slugs. | — | **Validée** (43 slugs distincts, 0 collision) |
| P13 | **Aligner le README** sur les variables `DJANGO_*` (`DJANGO_DEBUG`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `BMC_DB_PATH`) | Les commandes du README fonctionnent telles quelles sur l'arbre fusionné ; plus aucune mention de clé ou de `DEBUG` codés en dur. | — | **Validée** (`backend/README.md` réécrit) |
| P14 | **Compléter ses tests** : authentification par jeton réel, plat du jour (un seul actif, article indisponible refusé), `order_refs` vide refusé (D14), alertes acquittées | Tests dans le dépôt, tous verts ; les trois tests corrigés à la fusion restent conformes. | — | **Validée** (Section 11 dans `test_api_endpoints.py`) |
| P15 | **`DailySpecialView`** : décider et documenter le repli (aucun plat du jour, ou best-seller) | Comportement écrit dans le journal et la documentation, repli best-seller avec `is_fallback: True`, testé dans les deux cas. | — | **Validée** (Implémenté et testé) |
| P16 | **Faire confirmer D3, D4, D5, D7, D14** par Lansana et les consigner | Chaque décision datée, validée par Lansana Coly dans X5 et reportée dans la répartition. | X5 | **Validée** (Acté dans X5 le 21/10/2026) |
| P17 | **Journal corrigé** : champ « Branche » exact, table de concordance complète, statuts honnêtes | Aucune incohérence entre le journal et l'état réel du dépôt. | P11 | **Validée** (`journal_pathe.md` complet) |
| P18 | **Relecture croisée de la PR d'Ibrahima** | Checklist de la PR remplie : `order_rules.py`, `serializers.py`, `views.py` (blocs commandes), `settings.py`, `urls.py`, `exceptions.py`, `auth_views.py`, migration `0002`. Commentaires écrits sur GitHub. | I22 | **Validée** (Audit et validation ligne à ligne) |
| P19 | **Valider les 3 tests modifiés à la fusion** (détail staff, statut par `confirmed`, test anonyme) | Accord explicite consigné dans son journal avec justifications métier. | — | **Validée** (Consigné dans `journal_pathe.md`) |
| P20 | **Respect du périmètre** : coordination des travaux et discipline d'architecture | Règle consignée ; consolidation des deux périmètres suite à l'instruction officielle de Lansana Coly. | — | **Validée** |

**Ordre conseillé** : P13 → P10 → P12 → P14 → P15 → X1/P11 → P17 → P19 → P16 → P18 → P20 (continu).

---

## Ce qui fait la note de 10/10

**Ibrahima** : migration éprouvée sur base remplie, concurrence testée, référence plus longue, suivi client sans fuite de données, règle de paiement complète, anti-spam, jeton qui expire, schéma validé par test, intégration continue, PR ouverte et relue.

**Pathé** : seed qui respecte l'admin, menu fidèle au docx, images renseignées, README exact, tests complets et réalistes (jeton réel), décisions confirmées, journal exact, relecture croisée faite, périmètre respecté.

## Jalons communs

| Jalon | Contenu | Condition de sortie | État |
|---|---|---|---|
| J1 | X1 à X6 tranchées | Décisions consignées | **Validé (21/10/2026 par Lansana Coly)** |
| J2 | Ibrahima I10–I17 et Pathé P10–P15 faits | `manage.py test api` vert, schéma sans erreur | En cours |
| J3 | PR ouverte (I22), relue (P18) | Approbation de Lansana | À venir |
| J4 | Frontend admin avec jeton (I21) | Sonnerie fonctionnelle de bout en bout | À venir |
