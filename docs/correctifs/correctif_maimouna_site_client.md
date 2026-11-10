# Correctifs site client : Maimouna (Dev_MaimounaSall)

Contexte : 56 commits (bannières, vidéos héros, footer, offres -20 %, panier flottant). La branche est divergente, avec 67 commits de retard sur `develop`. **Ne fusionne pas telle quelle** : elle écraserait la refonte déjà intégrée.

## Décisions déjà prises (ne pas les défaire)
- Thème **sombre uniquement**. Pas de thème clair.
- **Pas de panier flottant.** Le panier est dans l'en-tête. Ton dernier commit les retire déjà, garde ça.
- **Pas de section « offres -20 % ».** Elle a été retirée : les promos affichées n'existent pas côté serveur.
- Une seule carte produit pour toutes les pages (`ProductCard`). Pas de variantes locales.
- Pas de majuscules forcées, pas d'effets lumineux ou dorés ajoutés.

## À faire
1. `git fetch origin && git checkout -b maimouna/reprise origin/develop`, puis récupère tes éléments un par un avec `git cherry-pick` ou en recopiant les fichiers. Ne fais pas de merge de ta branche entière.
2. Éléments à reproposer s'ils sont utiles : les vidéos héros (en WebM/MP4 compressés, pas de WebP animés lourds), le mini-footer mobile, le verrouillage du scroll du drawer mobile.
3. Poids : tes images 4K et vidéos ne doivent pas dépasser environ 1,5 Mo par fichier sur la page d'accueil. Utilise `loading="lazy"` et un `poster`.
4. Le commit « Mock API Django port 8000 » est annulé : confirme que rien n'en reste (aucun serveur mock dans le dépôt). Le vrai backend utilise le port 8000.
5. Textes vrais uniquement : horaires **mardi à dimanche, 11h à 02h** (fermé le lundi), adresse PGXV+6R7 Dakar, téléphones 77 856 13 13 / 77 106 75 75.
6. Teste sur 360, 390 et 768 px avant de proposer.
