# BMC Food — Site Web Client (mobile-first)

Site de commande en ligne de BMC Food : catalogue, Plat du Jour, panier animé, commande et paiement (Espèces, Wave, Orange Money).

**Stack** : React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion (Framer Motion) · lucide-react

## Démarrage

```bash
cd client_website
npm install
npm run dev        # http://localhost:5173
```

| Commande          | Rôle                                                        |
| :---------------- | :---------------------------------------------------------- |
| `npm run dev`     | Serveur de développement (ajouter `-- --host` pour tester sur un téléphone du même Wi-Fi) |
| `npm run build`   | Vérification TypeScript + build de production dans `dist/`  |
| `npm run lint`    | ESLint (règles React Hooks + TypeScript)                    |
| `npm run preview` | Sert le build de production localement                      |

### API backend

Par défaut, le site appelle l'API Django sur `http://localhost:8000/api`.
Pour changer d'adresse, copier `.env.example` en `.env.local` et modifier `VITE_API_BASE_URL`.

## Organisation du code

```text
src/
├── components/
│   └── cart/            # Panier : Cart, CartDrawer, CartItemRow, CartBar, CartButton
├── context/             # CartProvider (état du panier sauvegardé dans le navigateur)
├── hooks/useCart.ts     # Accès au panier depuis n'importe quel composant
├── lib/format.ts        # formatFcfa() : 3500 → « 3 500 F CFA »
├── services/api.ts      # apiRequest<T>() et ApiError : client HTTP commun vers l'API Django
├── types/index.ts       # Modèles TypeScript, miroir exact des sérialiseurs Django
├── index.css            # Charte BMC Food (tokens Tailwind)
└── main.tsx             # Point d'entrée (MotionConfig respecte « réduire les animations »)
```

## Conventions

### Charte graphique

Tailwind v4 se configure dans `src/index.css` (bloc `@theme`) et non plus dans `tailwind.config.js`.

| Classe Tailwind (`bg-`, `text-`, `border-`…) | Couleur   | Usage                                                   |
| :------------------------------------------- | :-------- | :------------------------------------------------------ |
| `bmc-braise`                                 | `#CF4A08` | Bouton d'action principal (charte v1.1). **Texte blanc dessus** (4,5:1). Appuyé : `bmc-braise-press`. |
| `bmc-orange`                                 | `#F97316` | Ancien orange d'action, encore utilisé par le bandeau Plat du Jour. Jamais de texte blanc dessus (2,8:1). |
| `bmc-orange-deep`                            | `#C2410C` | Texte orange sur fond clair (contraste AA).             |
| `bmc-gold`                                   | `#FCB800` | Or du logo (charte v1.1) : badges, prix, bouton d'ajout. Texte charbon dessus. |
| `bmc-charcoal`                               | `#18181B` | Textes, fonds sombres.                                  |
| `bmc-offwhite`                               | `#FAFAFA` | Fond du site.                                           |

Polices : `font-display` (Bricolage Grotesque) pour les titres et les prix, `font-sans` (Inter, par défaut) pour le texte.

### Animations

Importer depuis `motion/react` (paquet officiel de Framer Motion) :

```tsx
import { AnimatePresence, motion } from 'motion/react'
```

Micro-feedback des boutons : `whileTap={{ scale: 0.95 }}`.

### Données et API

- Les champs des types restent en `snake_case`, comme dans les réponses JSON de Django.
- Un plat est identifié par son `code` (ex. `tp-1`) dans le panier et dans `POST /api/orders/`.
- **Le navigateur n'envoie jamais de prix** : uniquement `{ id: code, quantity }`. Le serveur recalcule le total.
- Afficher les montants avec `formatFcfa()`.

## Le panier

Le panier est un état global, fourni par `<CartProvider>` dans `src/main.tsx`. Il est **sauvegardé dans le navigateur** : il survit à la navigation, au rechargement de la page, et se synchronise entre onglets.

### Lire ou modifier le panier depuis une page

```tsx
const { items, itemCount, subtotal, addToCart, removeFromCart, updateQuantity, clearCart, openCart } = useCart()

addToCart(product)          // bouton « + » d'une carte produit (quantité +1 si déjà au panier)
addToCart(product, 2)       // ajout de plusieurs exemplaires
updateQuantity('tp-1', 3)   // la quantité reste toujours entre 1 et 99
removeFromCart('tp-1')
clearCart()                 // après une commande réussie
```

### Afficher le panier

| Composant | Où le placer |
| :--- | :--- |
| `<Cart onCheckout={ouvrirCheckout} />` | **Une seule fois** dans l'application : barre flottante + tiroir, déjà branchés sur le panier. |
| `<CartButton tone="dark" />` | Dans l'en-tête : icône panier avec pastille braise du nombre d'articles. `tone="light"` sur fond clair. |

- **Barre flottante** (`CartBar`) : visible dès le premier article, cachée quand le tiroir est ouvert. Nombre d'articles, sous-total, « Voir le panier ».
- **Tiroir** (`CartDrawer`) : quantité avec compteur charbon et « + » or, jamais sous 1 (le « − » se désactive), suppression par la corbeille, sous-total, bouton braise « Valider la commande ». Fermeture : ✕, Échap, clic sur le fond ou glissement vers le bas.
- **Photos** : une photo absente ou introuvable (`image_url` du backend) est remplacée par une icône, jamais par une image cassée.
- Laisser environ 112 px de marge en bas des pages (`pb-28`) pour que la barre flottante ne cache pas le contenu.

Le sous-total est indicatif : le serveur recalcule toujours le montant réel de la commande.

## Avant d'ouvrir une Pull Request

- [ ] `npm run build` passe sans erreur TypeScript.
- [ ] `npm run lint` ne remonte aucune erreur.
- [ ] Aucune erreur dans la console du navigateur.
- [ ] Affichage vérifié en 360 px, 390 px et 414 px de large (mode responsive F12).
- [ ] Aucun fichier modifié en dehors de `client_website/`.
