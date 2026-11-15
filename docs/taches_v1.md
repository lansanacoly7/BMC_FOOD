# Tâches V1 : correction des règles métier essentielles

Source : `docs/audit_regles_metier.md`. On ne corrige que l'essentiel pour la V1 ; le reste est reporté (voir la fin).

Règle de travail : une branche par personne à partir de `develop` à jour, de petits commits, et on prévient le lead technique quand c'est poussé. Le lead relit, teste, puis fusionne dans `develop` et `test`.

## 1. Contrat d'API commun (à respecter par tous)

**Création : `POST /api/orders/`**
```json
{
  "customer_name": "Awa Ndiaye",
  "phone": "77 123 45 67",
  "order_type": "delivery",            // "delivery" | "pickup"
  "delivery_area": "grand-yoff",       // obligatoire si delivery (identifiant du quartier)
  "address": "Rue 10, en face de la pharmacie",  // obligatoire si delivery, facultative si pickup
  "notes": "Allergie arachide",
  "has_allergy": true,                 // facultatif, défaut false
  "payment_method": "cash",            // "cash" | "wave" | "orange_money"
  "items": [{ "id": "tp-1", "quantity": 2 }]
}
```
- En-tête **`Idempotency-Key: <uuid>`** : un même identifiant ne crée qu'une commande (la 2e requête renvoie la même commande, code 200).
- Le serveur ignore tout prix ou frais envoyé par le client.

**Réponse (en plus de l'existant) :** `order_type`, `delivery_area`, `delivery_fee` (entier, ou `null` si le quartier est « à confirmer par téléphone »), `subtotal`, `total_amount` (= `subtotal` + `delivery_fee`, ou `subtotal` si `delivery_fee` est `null`), `has_allergy`, `cancel_reason`.

**Suivi :** `GET /api/orders/track/?ref=BMC-123456&phone=771234567` (le téléphone doit correspondre, sinon 404 identique à « introuvable »).

**Annulation client :** `POST /api/orders/<ref>/cancel/` avec `{ "phone": "..." }`. Possible seulement si `status = pending`, sinon 409 avec un message clair.

**Annulation admin :** transition vers `cancelled` avec `cancel_reason` obligatoire (texte court).

**Ouverture :** `GET /api/health/` expose `is_open` (horaires), `accepting_orders` (faux si pause ou fermeture manuelle) et `closed_message`. `PATCH /api/admin/settings/` (jeton admin) : `{ "manual_closed": true|false, "closed_message": "..." }`.

**Paiement admin :** `POST /api/admin/orders/<ref>/confirm-payment/` : `payment_status` de `pending` ou `unpaid` vers `paid`.

**Erreurs :** format DRF habituel (`{"champ": ["message"]}`). Une commande refusée parce que le restaurant est fermé ou en pause renvoie 400 avec `{"non_field_errors": ["<message>"]}`.

**Règles par défaut (à confirmer par le lead) :** dernière commande à 01h30 ; annulation client seulement en « en attente » ; grille de frais actuelle de `delivery.ts` ; quartiers « éloignés » sans prix, donc `delivery_fee = null`.

## 2. Backend

### Pathé Fall
1. **D'abord, ton correctif en attente** (`docs/correctifs/correctif_pathe_horaires_et_throttle.md`) : `cache.clear()` dans les tests d'authentification, test du 429 à la 11e requête, justification de la limite par IP, documentation de `BMC_ENFORCE_OPENING_HOURS=0`. Ton travail ne sera fusionné qu'après.
2. **Interrupteur de fermeture manuelle et pause cuisine** : modèle `RestaurantSettings` (une seule ligne), endpoint `PATCH /api/admin/settings/`, champs `accepting_orders` et `closed_message` dans `/api/health/`, refus des commandes quand c'est fermé. Dernière commande à 01h30 incluse.
3. **Garde-fous** : téléphone sénégalais valide (normalisation en `+221…`), montant maximal de commande, longueur maximale de la note, quantité totale maximale.
4. Tests pour chaque règle.

### Ibrahima Khalilou Diallo
1. **Mode de commande** : champ `order_type` sur `Order` (migration), adresse obligatoire seulement en livraison, `has_allergy`.
2. **Frais de livraison calculés par le serveur** : table des quartiers et frais (reprendre la grille de `client_website/src/lib/delivery.ts`, avec un `seed` idempotent), ajout au total, enregistrement de `delivery_fee` et `delivery_area`. Quartier inconnu : 400. Quartier « éloigné » : `delivery_fee = null`.
3. **Idempotence** : en-tête `Idempotency-Key`, stockage de la clé (unique), même réponse pour la même clé.
4. **Suivi protégé** : exiger le téléphone avec la référence, même réponse 404 dans les deux cas d'échec.
5. **Annulation** : endpoint client (en attente seulement) et annulation admin avec `cancel_reason`.
6. **Confirmation de paiement admin** : endpoint `confirm-payment`.
7. Tests, `makemigrations --check` propre, `docs/` mis à jour (contrat).

## 3. Frontend client

### El Hadji Massogui Diop (parcours de commande)
1. Envoyer `order_type`, `delivery_area` (identifiant du quartier), `has_allergy` et l'en-tête `Idempotency-Key` (un nouvel identifiant par tentative de commande, conservé en cas de nouvel essai).
2. Afficher les montants renvoyés par le serveur (sous-total, frais, total) à la confirmation ; ne pas recalculer.
3. Bouton « Commander » désactivé après le premier clic jusqu'à la réponse.
4. Case « J'ai une allergie » (avec rappel de préciser laquelle dans la note).
5. Textes de paiement honnêtes : « Paiement à la livraison ou au retrait » ; pour Wave et Orange Money, « Le restaurant confirme votre paiement par téléphone ». Aucun « Payé » affiché avant que le serveur le renvoie.
6. Bandeau « Fermé » ou « Pause » depuis `/api/health/` (`accepting_orders`, `closed_message`) et bouton de commande bloqué.

### Maïmouna Sall
1. **Avant tout** : mettre ta branche à jour sur `develop` (bannières et vidéos anciennes : ne rien refaire qui existe déjà ; supprimer ce qui est en doublon) et corriger les 3 erreurs de lint du site client.
2. **Page de suivi de commande** : formulaire référence + téléphone, appel du nouvel endpoint de suivi, messages d'erreur clairs, états (en attente, en préparation, prêt, livré, annulé).
3. **Annulation côté client** : bouton « Annuler ma commande » visible seulement en « en attente », avec confirmation, et message « Appelez le restaurant » sinon.
4. Vérification responsive (mobile 360 px) de l'accueil et du suivi.

## 4. Admin et KDS

### Pape Alioune Sène
1. **KDS** : afficher le mode de commande (badge « LIVRAISON » ou « À EMPORTER »), le quartier et le téléphone en livraison, et mettre l'**allergie bien en évidence** (bandeau rouge sur la carte de commande).
2. **Page « Restaurant »** dans l'admin : interrupteur « Fermer le restaurant / Pause cuisine » et champ de message, qui appelle `PATCH /api/admin/settings/`. Affichage de l'état actuel (ouvert, fermé, pause).
3. **Annulation avec motif obligatoire** (liste de motifs courants + texte libre) ; la confirmation affiche le remboursement à faire si la commande est déjà payée.
4. **Bouton « Confirmer le paiement »** pour Wave et Orange Money (appel de `confirm-payment`), visible seulement si le paiement est en attente.
5. Toujours à vérifier : aucun jeton dans le code (validé le 14/11), `npx tsc -b` et `npm run build` à 0 erreur avant de pousser.

## 5. Lead technique (toi)
1. **Valider les décisions** : grille de frais (zones 3, 8 et 9), dernière commande (01h30), annulation en attente seulement. Confirmer ou corriger les valeurs par défaut du contrat ci-dessus.
2. **Valider le contrat d'API** (section 1) avec Pathé, Ibrahima, El Hadji et Alioune avant que quiconque code.
3. **Relire et fusionner** dans cet ordre : Pathé (correctif), Ibrahima, puis El Hadji, Alioune et Maïmouna. Passer les builds et tests entre chaque fusion.
4. **Hébergement** : suivre le déploiement des collègues (voir `docs/deploiement_api_reverse_proxy.md`). Points à exiger : `DJANGO_DEBUG=0`, secret fort, PostgreSQL, `seed_bmc` lancé une fois, sauvegardes, révocation des anciens jetons admin sur tout environnement déployé.
5. **Réunion avec le gérant** : confirmer la grille, les horaires, la politique d'annulation et le message des paiements mobiles ; collecter les allergènes courants pour une version suivante.

## 6. Ordre de travail
1. Lead : validation du contrat (aujourd'hui).
2. Pathé et Ibrahima : backend, en parallèle. Aucun conflit, car les fichiers sont différents (réglages et horaires d'un côté, commandes et modèles de l'autre). Ils publient leur branche dès que les tests passent.
3. El Hadji, Maïmouna et Alioune : en parallèle des deux autres, en s'appuyant sur le contrat (avec des données simulées tant que le backend n'est pas fusionné), puis ils raccordent au vrai backend.
4. Lead : fusion dans l'ordre ci-dessus, puis test complet bout en bout avant de pousser sur `test`.

## 7. Reporté après la V1
Options et suppléments par article, formules et menus, stock et ruptures automatiques, livreur assigné et suivi, vrai paiement Wave et Orange Money, notifications SMS ou WhatsApp, fidélité et codes promo, rôles et journal d'audit, tableau de bord de ventes, clôture de caisse, plusieurs points de vente, horaires exceptionnels programmés.
