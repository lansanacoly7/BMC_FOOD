# Tâches du lead technique (Lansana Coly) : à exécuter par Antigravity

Antigravity exécute, Claude vérifie. Les tâches ci-dessous sont celles du lead qui ne dépendent pas d'une décision métier : mise en production, qualité et documentation. Elles ne touchent pas aux fonctions V1 des autres membres (`docs/taches_v1.md`).

## Règles d'exécution (à lire en premier)
1. Branche : `feature/lead/deploiement-v1`, créée à partir de `develop` à jour. Ne jamais travailler directement sur `develop` ni `test`, ne jamais faire de `push --force`.
2. Un commit par tâche (L1, L2…), message en français, du type `feat(deploy): …`.
3. Fichiers partagés : `backend/bmc_backend/settings.py` est aussi modifié par Pathé. N'y changer que les blocs `DATABASES` et `CACHES`, en petits changements, sans reformater le reste.
4. Aucun secret, jeton ou mot de passe dans le dépôt : uniquement des exemples (`.env.example`) avec des valeurs factices.
5. À la fin de chaque tâche, lancer les vérifications indiquées dans « Critères d'acceptation » et **coller les sorties** dans le message final.
6. Quand tout est poussé, écrire : « Terminé : L1 à L7, branche feature/lead/deploiement-v1 ». Claude vérifiera et renverra un fichier de corrections si besoin (`docs/correctifs/correctif_lead_*.md`). Corriger puis redire « Terminé ».

## L1. Base de données et cache prêts pour la production
**Pourquoi :** SQLite supporte mal plusieurs commandes simultanées. De plus, la limitation de débit utilise le cache : avec plusieurs processus gunicorn et un cache en mémoire locale, les compteurs ne sont pas partagés.

À faire :
- Dans `settings.py`, lire `DATABASE_URL` (si présent : PostgreSQL ; sinon : SQLite comme aujourd'hui, pour ne rien casser en développement). Ajouter le paquet nécessaire dans `backend/requirements.txt` (`dj-database-url` et `psycopg[binary]`).
- Configurer un cache **partagé entre processus** pour la production (cache en base de données `createcachetable`, ou Redis si `REDIS_URL` est défini), en gardant la mémoire locale en développement et en test.
- Documenter les variables dans `backend/.env.example`.

Critères d'acceptation :
- `python manage.py check` : 0 problème, en SQLite et avec un `DATABASE_URL` PostgreSQL de test (si l'outil n'est pas disponible, expliquer pourquoi).
- `python manage.py makemigrations --check --dry-run` : « No changes detected ».
- `python manage.py test api.tests.test_seed api.tests.test_pricing api.tests.test_api_endpoints` : tous au vert.

## L2. Fichiers de déploiement sur un VPS
Créer un dossier `deploy/` :
- `deploy/Caddyfile` : HTTPS automatique, le site client à la racine, l'admin sous `/admin-app/` (ou un sous-domaine documenté), `/api/*`, `/static/*` et `/media/*` vers Django. L'API doit rester en chemin relatif `/api` (voir `docs/deploiement_api_reverse_proxy.md`).
- `deploy/bmc-backend.service` : service systemd pour gunicorn (utilisateur dédié, variables dans un fichier d'environnement, redémarrage automatique).
- `deploy/gunicorn.conf.py` : nombre de workers adapté à 2 vCPU, délai d'expiration, journaux.
- `deploy/env.production.example` : toutes les variables de production, avec des valeurs factices et des commentaires : `DJANGO_DEBUG=0`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DATABASE_URL`, `DJANGO_SECURE_SSL_REDIRECT`, `DJANGO_SECURE_HSTS_SECONDS`, `BMC_API_DOCS_PUBLIC=0`.
- Un script `deploy/build_frontends.ps1` ou `deploy/build_frontends.sh` qui construit `client_website` et `admin_app`.

Critères d'acceptation : les fichiers existent, ne contiennent aucun secret réel, et le Caddyfile passe `caddy validate` si Caddy est installé (sinon, relecture manuelle indiquée).

## L3. Guide de déploiement pas à pas
Écrire `docs/deploiement_vps.md`, destiné aux amis qui hébergent (pas à des experts) :
1. Créer le serveur (Ubuntu 24.04) et sécuriser l'accès (utilisateur non root, clé SSH, pare-feu).
2. Installer Python, PostgreSQL, Caddy, Node.
3. Créer la base et l'utilisateur PostgreSQL.
4. Récupérer le code, créer l'environnement virtuel, installer les dépendances.
5. Configurer les variables d'environnement.
6. `migrate`, `createcachetable` si utilisé, `collectstatic`, `seed_bmc`, `createsuperuser`.
7. Construire les deux sites, installer le Caddyfile, activer le service.
8. Vérifications finales : `/api/health/`, une commande de test, l'admin.
9. Mise à jour du site (déploiement d'une nouvelle version) et retour en arrière.
10. Section « Dépannage » : les 5 problèmes les plus probables.

Critères d'acceptation : chaque commande est copiable, aucune étape ne suppose qu'une autre a été faite sans le dire, et `docs/deploiement_api_reverse_proxy.md` est cité.

## L4. Sauvegardes et restauration
- `deploy/backup.sh` : export PostgreSQL compressé chaque nuit, conservation des 14 derniers, copie hors du serveur documentée (au minimum, la commande `scp` ou `rclone` en exemple).
- Tâche planifiée (cron ou timer systemd) fournie en exemple.
- `docs/restauration.md` : comment restaurer, avec la commande exacte, et comment vérifier que la restauration a fonctionné.

Critères d'acceptation : les scripts n'écrivent aucun mot de passe en clair (utiliser `.pgpass` ou une variable), et la procédure de restauration est testable en 3 commandes.

## L5. Intégration continue : ajouter les deux sites
Aujourd'hui `.github/workflows/backend-ci.yml` ne teste que le backend. Ajouter `.github/workflows/frontend-ci.yml` qui, à chaque `push` et pull request :
- installe les dépendances de `client_website` et de `admin_app` (`npm ci`) ;
- lance `npx tsc -b` et `npm run build` pour chacun.

Ne pas bloquer sur `npm run lint` tant que les erreurs de lint existantes ne sont pas corrigées : le lancer en `continue-on-error: true` et le dire dans le commentaire du fichier.

Critères d'acceptation : le fichier YAML est valide, les chemins sont corrects (les deux applications ont chacune leur `package-lock.json`).

## L6. Révocation des jetons et vérification de production
- Créer une commande `python manage.py revoke_all_tokens` qui supprime tous les jetons d'authentification, avec un test automatique et une confirmation `--yes` pour éviter l'accident.
- Documenter dans `docs/deploiement_vps.md` : à lancer sur tout environnement déployé avant l'ouverture au public (d'anciens jetons ont été exposés dans l'historique git).
- Vérifier que `python manage.py check --deploy` ne signale rien de critique avec les variables de `deploy/env.production.example` ; lister dans `docs/deploiement_vps.md` les avertissements restants et pourquoi ils sont acceptés.

Critères d'acceptation : le test de la commande passe ; la sortie de `check --deploy` est collée dans le message final.

## L7. Préparer la réunion avec le gérant
Écrire `docs/questions_gerant.md`, une feuille d'une page à remplir avec le gérant :
- grille des frais de livraison (zones 3, 8 et 9 : valider les prix) ;
- horaires, jours de fermeture, dernière commande, fermetures exceptionnelles (Tabaski, Korité, Magal) ;
- politique d'annulation et de remboursement ;
- modes de paiement réellement acceptés (Wave et Orange Money : compte marchand existant ?) ;
- allergènes les plus courants, plats halal ;
- commandes de groupe : quantité maximale et préavis ;
- TVA et mentions légales ;
- contact du restaurant et numéros à afficher.

Pour chaque question : la valeur proposée par défaut et une ligne vide pour la réponse.

Critères d'acceptation : une page, des questions fermées quand c'est possible, la valeur par défaut présente pour chaque ligne.

## Ce que Claude vérifiera
Fusion de la branche sur une copie de `develop`, `manage.py check`, `makemigrations --check`, tests backend, builds des deux sites, relecture des fichiers de `deploy/` (secrets, chemins, cohérence avec le proxy `/api`), lecture des deux guides. Aucune fusion dans `develop` ou `test` sans cet accord.

## À faire par le lead lui-même (pas pour Antigravity)
1. Valider les trois décisions : grille de frais, dernière commande à 01h30, annulation seulement en attente.
2. Valider le contrat d'API de `docs/taches_v1.md` avec l'équipe.
3. Tenir la réunion avec le gérant avec la feuille L7.
4. Révoquer lui-même la clé GitHub qu'il a partagée quand elle ne sert plus.
