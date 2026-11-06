# Refonte du site client : notes de transmission

Version locale de Lansana Coly (site client uniquement : `client_website/`). Le backend et `admin_app/` ne sont pas modifiés.

## Ce qui change

**Design et thème**
- Thème sombre uniquement (le mode clair et son interrupteur ont été retirés). Plus de barre de défilement visible.
- Nettoyage des effets décoratifs (dégradés sur texte, halos, pulsations) et des affirmations non vérifiées (Halal certifié, suivi en temps réel, fausses notes, etc.).
- En-tête dynamique au défilement (`TopHeader.tsx`), footer refait, vidéo du hero en boucle fondue (`LoopingFadeVideo.tsx`), vidéos du bas qui s'enchaînent à la fin de chaque scène.
- Carte produit unique (`menu/ProductCard.tsx`) utilisée partout. Fiche produit refaite avec options (sans…, sauces, accompagnements, précision), les choix partent dans les notes de commande.
- Page contact refaite (carte, sélecteur de quartier, liste déroulante `ui/Select.tsx`).
- Recherche globale (`search/SearchOverlay.tsx`), espace client (`profile/ProfileView.tsx`) avec historique, commandes favorites et « Commander à nouveau ».

**Commande**
- Choix Livraison / À emporter. En retrait, l'adresse envoyée est « Retrait sur place – PGXV+6R7, Dakar » et la note commence par « À EMPORTER » (le serveur n'a pas de champ dédié).
- Page de commande en deux colonnes. Adresse, quartier, nom et téléphone mémorisés après la première commande (`services/clientData.ts`).
- Confirmation avant d'annuler le panier et avant de se déconnecter (`ui/ConfirmDialog.tsx`).

**Connexion / inscription** : reprise du parcours d'Alioune (connexion unique, confirmation du mot de passe, code OTP, déconnexion confirmée) avec le design actuel.

## Fichiers supprimés
`menu/PopularCarousel.tsx`, `home/SpecialOfferBanner.tsx`, `home/HeroSearch.tsx`, `hooks/useTheme.ts`.

## Points à traiter avant la mise en ligne
1. **Accès admin codé en dur (non repris).** L'ancienne `AuthModal` acceptait `admin / admin123` avec un jeton écrit dans le code. La nouvelle version ne contient plus ce contournement : les comptes du personnel sont reconnus par `POST /api/auth/token/`. Le même jeton de développement existe encore dans `admin_app` (`DEV_DEFAULT_TOKEN`) : à retirer ou à limiter au mode développement.
2. **OTP simulé.** Le code est `454647` et il est affiché à l'écran : aucun SMS n'est envoyé. Les comptes clients sont simulés dans le navigateur (aucune vérification du mot de passe). À remplacer par une vraie vérification côté serveur.
3. **Deux grilles de livraison.** La page contact et la commande utilisent maintenant la même grille (`lib/delivery.ts`, 9 zones). Les délais par zone n'existent plus ; « 20 à 45 min » reste en texte général (FAQ, footer) sans source.
4. **Retrait sur place.** À remplacer par un vrai champ côté serveur (mode de réception) plutôt que la mention dans l'adresse et les notes.
5. **Boissons.** Les 6 canettes BMC (bissap, bouye, mangue, tamarin, thé glacé, chocolat) sont définies dans `data/mockMenu.ts` à 800 F (prix à confirmer). Si le serveur renvoie sa propre carte, ces boissons doivent y être créées, sinon elles ne sont pas commandables (le serveur répond « article introuvable »).
6. **Port 8000.** Sur la machine de Lansana, ce port est pris par un autre projet. Le site client est lancé avec `VITE_API_BASE_URL=http://localhost:8001/api` (fichier `client_website/.env.local`, non versionné). Pour `admin_app`, le proxy de `vite.config.ts` vise 8000 : à adapter si besoin.

## Lancer en local
```
cd backend
$env:DJANGO_DEBUG="True"; python manage.py migrate; python manage.py runserver 127.0.0.1:8001
cd ..\client_website
# créer .env.local avec : VITE_API_BASE_URL=http://localhost:8001/api
npm run dev
```
