# BMC Food — Application Admin (cuisine & caisse)

Poste de pilotage du restaurant : alertes de nouvelles commandes (sonnerie + notifications), tableau de bord des commandes et gestion du Plat du Jour.

**Stack** : React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion (Framer Motion) · lucide-react

## Démarrage

```bash
cd admin_app
npm install
npm run dev        # http://localhost:5174
```

| Commande          | Rôle                                                       |
| :---------------- | :--------------------------------------------------------- |
| `npm run dev`     | Serveur de développement                                   |
| `npm run build`   | Vérification TypeScript + build de production dans `dist/` |
| `npm run lint`    | ESLint (règles React Hooks + TypeScript)                   |
| `npm run preview` | Sert le build de production localement                     |

### API backend

Par défaut, l'admin appelle l'API Django sur `http://localhost:8000/api`.
Pour changer d'adresse, copier `.env.example` en `.env.local` et modifier `VITE_API_BASE_URL`.

## Organisation du code

```text
src/
├── components/admin/
│   ├── AlertActivationPrompt.tsx  # Écran « Démarrer le service » (débloque son + notifications)
│   └── AlertModal.tsx             # Fenêtre d'alerte des nouvelles commandes + « Prendre en charge »
├── hooks/useNewOrderAlerts.ts     # Interrogation de l'API, sonnerie, notifications, acquittement
├── services/
│   ├── api.ts                     # apiRequest<T>(), ApiError, endpoints d'alerte
│   ├── audioAlertService.ts       # Carillon Web Audio (aucun fichier MP3)
│   └── notificationService.ts     # Notification API du navigateur
├── lib/format.ts                  # formatFcfa(), formatTime()
├── lib/labels.ts                  # Libellés des moyens de paiement
└── types/index.ts                 # Modèles TypeScript, miroir des sérialiseurs Django
```

La charte graphique et les conventions sont les mêmes que le site client : voir `client_website/README.md`.

## Module A2 : alertes de commande

1. **À l'ouverture**, l'écran « Démarrer le service » demande un clic. Ce clic est obligatoire : les navigateurs bloquent le son et les demandes de notification tant que personne n'a interagi avec la page.
2. **Toutes les 4 secondes**, l'app interroge `GET /api/orders/events/unnotified/`.
3. **Dès qu'une commande non notifiée arrive** :
   - un carillon à deux tons (880 Hz puis 1174 Hz) retentit toutes les 3 secondes ;
   - une notification système « 🔔 Nouvelle commande BMC-XXXX » / « Montant : X XXX F CFA » s'affiche (une seule par commande) ;
   - la fenêtre d'alerte affiche la référence, l'heure, les plats, le client, l'adresse, le paiement et le montant recalculé par le serveur.
4. **« Prendre en charge »** coupe la sonnerie immédiatement, ferme les notifications et envoie `POST /api/orders/events/unnotified/` avec **uniquement les références affichées** : une commande arrivée entre-temps continuera de sonner.
5. Si le serveur ne répond plus, un bandeau rouge l'indique et l'app réessaie seule. Un acquittement perdu pendant une coupure est renvoyé automatiquement.

## Brancher le tableau de bord (module A1)

Le composant `AdminDashboard` prend place dans le `<main>` de `App.tsx` (emplacement commenté).
Réutiliser `apiRequest<T>()` de `services/api.ts` pour les appels `GET /api/orders/` et `PATCH /api/orders/<ref>/status/`,
ainsi que `PAYMENT_METHOD_LABELS`, `formatFcfa()` et `formatTime()`.
Le tableau de bord n'a pas à gérer la sonnerie : `useNewOrderAlerts` s'en charge déjà.

## Avant la démonstration

- [ ] Ouvrir l'admin dans Chrome ou Edge sur l'ordinateur de démonstration, volume système monté.
- [ ] Cliquer sur « Activer les alertes » et accepter les notifications.
- [ ] Cliquer sur « Tester la sonnerie » pour vérifier le son.
- [ ] Garder l'onglet admin ouvert : un onglet fermé ne peut pas sonner.

### Limites connues

- Sur Chrome Android, les notifications système nécessitent un service worker (non inclus dans le MVP) : la sonnerie et la fenêtre d'alerte restent actives.
- Un onglet resté longtemps en arrière-plan peut être ralenti par le navigateur : privilégier un onglet ou une fenêtre dédiés.
