# Refonte de la fiche produit (client_website) : à exécuter par Antigravity

Claude vérifie ensuite. Branche : `feature/frontend/fiche-produit-v2`, créée à partir de `develop` à jour. Pas de `push --force`, pas de fusion dans `develop` ni `test`. Un commit par étape, en français.

## Pourquoi
Sur la fiche d'un plat (`client_website/src/components/menu/ProductDetailModal.tsx`), les options sont quatre listes déroulantes identiques (« Sans… », « Sauce », « Accompagnements », « Précision »). Le client ne comprend pas qu'il faut dérouler, ni ce que veulent dire « Sans… », « 2 au choix, incluses » ou « Pour la cuisine ». Il faut une seule page lisible au premier coup d'œil, sans liste déroulante.

## Fichiers à modifier
- `client_website/src/components/menu/ProductDetailModal.tsx` : refonte de l'affichage (supprimer le composant `Disclosure`, le code mort `showRemark`).
- `client_website/src/data/productOptions.ts` : règles par famille de plat (voir ci-dessous).
Ne pas toucher au panier, au parcours de commande ni au backend. Le texte de personnalisation continue de partir dans la note de la ligne de panier, comme aujourd'hui (`onAddToCart(product, quantity, note)`), et chaque accompagnement reste une ligne de panier séparée.

## Règles métier des sauces (décidées par le lead)
| Famille | Sauces | Retirer des ingrédients |
|---|---|---|
| **Tacos** | **obligatoires** : au moins 1, maximum 2, ou le bouton « Sans sauce » | oui |
| **Burger** | **aucune sauce** : ne jamais afficher le bloc sauces | oui |
| Sandwich, chawarma | facultatives, maximum 2 | oui |
| Finger food (tenders, wings, poulet, pastel, sambousa) | facultatives, maximum 1 | non |
| Boissons, sauces, accompagnements | aucune option | non |

Détection : tacos d'abord, puis burger, puis sandwich/chawarma, puis finger food (garder l'ordre pour qu'un « burger » ne reçoive jamais de sauces). Ajouter `saucesRequired: boolean` à `ProductOptions`.

## Nouvelle mise en page : une seule page, tout visible
Quatre blocs numérotés, dans cet ordre, chacun avec **un numéro, une question, une consigne courte et une étiquette « Obligatoire » ou « Facultatif »**. Les blocs qui ne s'appliquent pas à la famille sont absents (pas de trou dans la numérotation : numéroter dynamiquement).

1. **Tes sauces** (tacos, sandwich, chawarma, finger food ; absent pour le burger)
   - Consigne : « Choisis jusqu'à 2 sauces » (ou « Choisis 1 sauce » pour le finger food). **Ne jamais écrire « offertes », « incluses » ni « gratuites ».**
   - Compteur visible : « 1/2 ».
   - Boutons : Samouraï, Algérienne, Fromagère maison, Blanche, Barbecue.
   - Tacos uniquement : étiquette « Obligatoire » et un bouton **« Sans sauce »**, en toutes lettres. Choisir « Sans sauce » décoche les sauces ; choisir une sauce décoche « Sans sauce ».
   - Limite atteinte : ne pas griser sans explication. Afficher la phrase « Maximum atteint : retire une sauce pour en changer ». Les sauces non choisies restent touchables si on veut remplacer (option : le choix suivant remplace le plus ancien).
2. **Tu veux enlever quelque chose ?** (tacos, burger, sandwich, chawarma)
   - Consigne : « Touche un ingrédient pour le retirer ».
   - Boutons directement visibles, libellés complets : « Sans ketchup », « Sans mayonnaise », « Sans moutarde », « Sans oignons », « Sans salade », « Sans tomate », « Sans cornichons ». Un ingrédient retiré passe en rouge, barré, avec une croix.
3. **Un petit plus ?** (accompagnements, boissons, frites)
   - Consigne : « Boissons, frites, desserts ».
   - Afficher les 3 premiers avec photo, nom, prix (« + 800 F ») et bouton « + » ; un bouton « Voir tout (N) » pour les autres. Comportement des quantités inchangé.
   - Ne plus ouvrir ce bloc par défaut ni le mettre avant les choix du plat.
4. **Une demande ou une allergie ?**
   - Étiquette « Facultatif ». Trois boutons rapides : « Allergie », « Bien cuit », « Sans piment ». Le bouton « Allergie » insère « Allergie : » au début du champ et y place le curseur. Les autres ajoutent leur texte.
   - Champ texte de 140 caractères maximum, visible (pas replié), avec un placeholder « Ex. allergie à l'arachide, bien cuit… ».

**Résumé et barre du bas** (toujours visible)
- Une ligne de résumé au-dessus du bouton, par exemple « Samouraï, Algérienne · sans oignons · 1 boisson ». Masquée si rien n'est choisi.
- Bouton « Ajouter · prix total ». Pour un tacos sans sauce choisie et sans « Sans sauce », le bouton est désactivé et affiche « Choisis une sauce ».
- Note envoyée au panier : `Sans oignons · Sauce : Samouraï, Algérienne · <précision>` comme aujourd'hui ; avec « Sans sauce » : `Sans sauce`.

**Téléphone (360 à 430 px)**
- Photo plus basse (environ 40 % de la hauteur de l'écran maximum) pour que le bloc 1 soit visible sans défiler.
- Zones tactiles d'au moins 44 px. Aucun texte coupé par « … ».
- Grand écran : photo à gauche, contenu à droite, comme aujourd'hui.

## Critères d'acceptation
1. Aucune liste déroulante ne reste sur la fiche (plus de `Disclosure` ni de `ChevronDown` pour les options).
2. Tacos : sauces obligatoires, bouton « Sans sauce » fonctionnel, bouton « Ajouter » bloqué tant que rien n'est choisi.
3. Burger : aucun bloc sauces. Finger food : sauces facultatives, 1 maximum. Boisson : fiche sans options.
4. Le mot « offertes », « incluses » ou « gratuites » n'apparaît nulle part.
5. La note envoyée au panier reste du même format (vérifier dans le panier et à la confirmation).
6. `npx tsc -b`, `npm run build` et `npm run lint` à **0 erreur** dans `client_website`.
7. Test à 360 px et sur grand écran, avec un tacos, un burger, un finger food et une boisson.

## À la fin
Pousser la branche et écrire : « Terminé : fiche produit v2, branche feature/frontend/fiche-produit-v2 », en collant les sorties de `tsc`, `build` et `lint`. Claude vérifiera et renverra un fichier de corrections si besoin.
