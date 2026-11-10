# Correctifs admin : Alioune (feature/frontend/client-website-papealiou)

Contexte : 12 commits (refonte KDS cuisine, gestion multi plats du jour, sidebar). Branche divergente : 12 commits en avance, 11 de retard sur `develop`.

## À faire
1. Rebase sur `origin/develop` avant toute fusion. Tu touches des fichiers que d'autres modifient (`admin_app/src/App.tsx`, `AppHeader.tsx`). Vérifie qu'il n'y a pas de doublon avec le travail de Maimouna (images et vidéos copiées dans `admin_app/public`).
2. **Sécurité :** `DEV_DEFAULT_TOKEN` dans `admin_app/src/api/client.ts` est un jeton écrit en dur, et il y a aussi un mot de passe `admin123`. Sors-les du code : une variable `VITE_*` en développement uniquement, jamais dans le build de production.
3. `admin_app/src/api/orders.ts` envoie `confirmed` puis `preparing`. Vérifie avec le backend que la transition est autorisée dans tous les cas (annulation, double clic), et que le bouton d'annulation (undo 5 s) ne laisse pas de statut incohérent.
4. Lint : 14 erreurs `eslint` dans `admin_app`. Corrige-les pour que la CI passe, sans `eslint-disable` en masse.
5. Retire les données mock restantes de l'admin. Le KDS doit n'afficher que des données de l'API.
6. Les seuils 15/25 minutes (retard) sont codés en dur : mets-les dans une constante nommée.
7. Poids du dépôt : ne versionne pas de vidéos lourdes dans `admin_app/public`. L'admin n'en a pas besoin.

## Test à faire
Passe une commande sur le site (`localhost:5173`) et vérifie qu'elle apparaît dans le KDS, sur 1080p et sur tablette.
