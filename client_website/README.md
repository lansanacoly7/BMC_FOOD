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
│   └── cart/            # Module C2 : CartDrawer (tiroir bottom-sheet) et CartItemRow
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
| `bmc-orange`                                 | `#F97316` | Boutons d'action. **Texte anthracite dessus, jamais blanc** (contraste 2,8:1 insuffisant). |
| `bmc-orange-deep`                            | `#C2410C` | Texte orange sur fond clair (contraste AA).             |
| `bmc-gold`                                   | `#F59E0B` | Badges, prix, mise en valeur.                           |
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

## Brancher le panier (module C2)

`CartDrawer` est un composant de présentation : il reçoit les articles et les actions en props, ce qui permet de le brancher directement sur le `CartContext`.

```tsx
<CartDrawer
  isOpen={isCartOpen}
  onClose={() => setIsCartOpen(false)}
  items={items}                       // CartItem[]
  onUpdateQuantity={updateQuantity}   // (code, quantité) => void
  onRemove={removeFromCart}           // (code) => void
  onCheckout={openCheckout}
/>
```

Fermeture : bouton ✕, touche Échap, clic sur le fond assombri ou glissement de la poignée vers le bas.

## Avant d'ouvrir une Pull Request

- [ ] `npm run build` passe sans erreur TypeScript.
- [ ] `npm run lint` ne remonte aucune erreur.
- [ ] Aucune erreur dans la console du navigateur.
- [ ] Affichage vérifié en 360 px, 390 px et 414 px de large (mode responsive F12).
- [ ] Aucun fichier modifié en dehors de `client_website/`.
