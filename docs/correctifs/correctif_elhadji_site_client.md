# Correctifs site client : El Hadji (develop, commit 83afb5f et branche client-website-elhadji)

Contexte : ton dernier commit sur `develop` (« animation d'entrée, nouveau footer et section vidéo plein écran ») est arrivé après la refonte. Ta branche `client-website-elhadji` date du 22 octobre et a 67 commits de retard.

## À faire
1. Vérifie que ton nouveau footer et ta section vidéo respectent la refonte : fond noir, boutons jaunes, textes vrais (mardi à dimanche, 11h à 02h), pas de bande d'appel à l'action photo dans le footer.
2. Vérifie que l'animation d'entrée n'ajoute pas de délai bloquant : l'accueil doit être utilisable tout de suite. Respecte `prefers-reduced-motion`.
3. La vidéo plein écran doit être compressée, avoir un `poster`, et ne pas se charger en 3G avant le contenu. Le JS du site fait déjà 582 kB : pense au chargement différé (`React.lazy`).
4. Supprime ta branche `client-website-elhadji` si tout est repris dans `develop`, pour éviter qu'on la fusionne par erreur et qu'elle ramène d'anciennes versions (`Footer.tsx`, `ContactModal.tsx`, `DailySpecialBanner.tsx` ont été refaits).
5. Corrige les 4 erreurs lint du client : `App.tsx:106`, `AuthModal.tsx:117`, `ProvisionalCheckout.tsx:77`, `SearchOverlay.tsx:43` (setState appelé directement dans un effet : à remplacer par un état dérivé ou un gestionnaire d'événement).
6. Aligne les codes produits de l'accueil (`FeaturedGrid`) sur ceux de la base : `bb-fraiches`, `bg-cheese`, `ck-wings`, `fr-maison` et d'autres n'existent pas côté serveur et font échouer la commande. Avec Pathé : soit tu retires ces produits, soit il les ajoute au seed.
