# Correctifs backend : Pathé (feature/backend/pathe-fall)

Contexte : ta branche a 2 commits (audit SonarQube + authentification client `Customer`, migration 0004). Elle a 73 commits de retard sur `develop`.

## À faire avant la fusion
1. `git fetch origin && git rebase origin/develop`. Résous les conflits, puis `python manage.py makemigrations --check` : il ne doit rien générer. Si une autre migration 0004 existe déjà sur `develop`, renumérote la tienne.
2. Lance `python manage.py test api` en entier. Un test échoue déjà sur `develop` : `test_orders_ibrahima::test_saut_refuse_et_entrees_invalides` (reçoit 200 au lieu de 400, donc une entrée invalide est acceptée). Trouve l'entrée acceptée à tort et corrige la validation.

## Contrat avec le site client (à aligner)
3. Le site utilise encore une connexion simulée (OTP fixe `454647`, comptes en localStorage). Documente dans `docs/` les routes d'inscription et de connexion que tu exposes (corps, réponses, erreurs) pour que le front puisse les brancher. N'impose pas de changement de format sans prévenir Alioune.
4. Le jeton staff (`/api/auth/token/`) ne doit pas être réutilisable par un client. Vérifie qu'un `Customer` ne peut accéder à aucune route admin.

## Bugs de données à corriger (bloquants prod)
5. Ajoute au seed les boissons, sauces et accompagnements. La base n'a que 43 plats (préfixes `bg, thp, tjp, tp, trp, ts, txl`). Aujourd'hui, une commande contenant `bv-*`, `sc-*`, `ac-*`, `pl-*` ou `sw-1` renvoie 400.
6. Calcule les frais de livraison côté serveur (selon la zone). Le total du site et le total du serveur diffèrent.
7. Ajoute un vrai champ de mode de retrait (`delivery` ou `pickup`) à la commande, au lieu du texte « Retrait sur place » dans l'adresse.
8. Refuse les commandes hors horaires (mardi à dimanche, 11h à 02h, fuseau Africa/Dakar).

## Production
9. `DEBUG` désactivé, `SECRET_KEY` en variable d'environnement, `ALLOWED_HOSTS` et CORS limités au domaine réel.
10. Le throttling `order_create` (15/min) doit tenir compte de `X-Forwarded-For` derrière un proxy.
