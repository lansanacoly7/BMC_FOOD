# Correctif pour Alioune : build de l'admin cassé (KDS)

Branche testée : `feature/frontend/client-website-papealiou` (dernier commit `a20295a`, 14 nov.), fusionnée dans `develop` sur une copie. Aucun conflit git, mais l'admin ne compile plus.

## Bloquant : `npm run build` de `admin_app` échoue (2 erreurs TypeScript)
1. `src/components/kds/KdsBoard.tsx` (ligne ~210) : `KdsOrderList` reçoit des props sans `doneItems` ni `onToggleItem`, qui sont obligatoires dans `KdsOrderListProps`.
   - Soit tu passes ces deux props depuis `KdsBoard`.
   - Soit tu les rends optionnelles (`doneItems?`, `onToggleItem?`) si le nouveau parcours en 3 onglets ne les utilise plus, et tu retires le code mort.
2. `src/components/kds/KdsTopBar.tsx` (ligne ~49) : `avgWaitMinutes` est déclaré mais jamais lu (tu as retiré « Attente moy. » de la barre). Supprime-le de la signature et de l'appelant.

Vérifie avec : `cd admin_app ; npx tsc -b ; npm run build` (les deux doivent sortir avec le code 0).

## À corriger en même temps
3. **Jeton en dur, encore.** `admin_app/src/api/client.ts` : `DEV_DEFAULT_TOKEN` a changé de valeur (`5b52…` → `5504…`). C'est un vrai jeton d'accès, écrit dans le dépôt. Retire-le du code (variable `VITE_*` locale non commitée, ou saisie par le développeur). Révoque les deux jetons côté Django (`Token.objects.all().delete()` en développement), puisqu'ils sont publics dans l'historique git.
4. **Mode développement sans backend.** Si Django ne répond pas, `loginAdmin` connecte quand même l'utilisateur avec ce jeton. Cela doit rester limité à `import.meta.env.DEV`, et ne jamais exister dans le build de production. Vérifie-le.
5. **Hasheur rapide.** `api/hashers.py` + `settings.py` : 10 000 itérations PBKDF2 quand `DEBUG` est actif. C'est acceptable en développement, mais ajoute un test qui échoue si ce hasheur est actif quand `DEBUG=False`, et rappelle dans la doc que la production doit avoir `DJANGO_DEBUG=0`.
6. **URL de l'API devenue relative (`/api`)** dans les deux sites. Ça marche en développement grâce au proxy de Vite (vérifié). En production, il faut un reverse proxy sur le même domaine, ou `VITE_API_BASE_URL` : documente-le dans `docs/`.
7. **Mode WAL de SQLite** (`api/apps.py`) : bon pour la concurrence. Ajoute `*.sqlite3-wal` et `*.sqlite3-shm` au `.gitignore` s'ils n'y sont pas.

## Ce qui est bon
- Fusion sans conflit avec `develop`.
- Le site client compile, et les tests `seed`, `prix`, `API` (33) et `customer_auth` passent.
- Le `timeout` de 25 s, la gestion de `AbortError` et le thème noir de la page promotions sont des corrections utiles.

## Quand c'est corrigé
Préviens-moi : je refais la fusion sur `develop`, je relance les builds des deux sites et les tests, puis je pousse.
