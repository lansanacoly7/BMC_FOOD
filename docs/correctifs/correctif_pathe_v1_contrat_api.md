# Correctif pour Pathé : écarts entre le backend V1 et le contrat d'API

Branche testée : `feature/backend/pathe-fall` (dernier commit `90d395a`, 15 nov.). Elle est à jour sur `develop`, `manage.py check` et `makemigrations --check` sont propres, et les 13 modules de tests passent (dont `test_opening_hours`, `test_pathe_v1`, `test_delivery_and_proxy_throttling`). Le travail de fond est bon. Il reste des écarts avec `docs/taches_v1.md` qui casseraient l'intégration avec les sites.

## Bloquants (à corriger avant la fusion)

**1. Nom du champ de mode de commande : `fulfillment_method` au lieu de `order_type`.**
Le contrat demande `order_type` (`delivery` | `pickup`). Le site d'El Hadji envoie déjà `order_type`. Avec ton serializer, ce champ est ignoré, la valeur par défaut `delivery` s'applique, et une commande « à emporter » est facturée comme une livraison (frais + adresse obligatoire).
- Accepte `order_type` dans `OrderCreateSerializer` et renvoie `order_type` dans `OrderSerializer`. Tu peux garder `fulfillment_method` comme alias en lecture si tu veux, mais `order_type` fait foi.
- Test : une commande `pickup` sans adresse ni quartier → 201, `delivery_fee = 0`, `total_amount = subtotal`.

**2. La grille des frais de livraison est incomplète et gratuite par défaut (`order_rules.py`, `DELIVERY_AREAS_FEES`).**
- Elle ne contient que 10 identifiants. Les quartiers des zones 2 à 8 (Nord Foire, Foire…) manquent, donc `get_delivery_fee` renvoie **0** : livraison gratuite pour la plupart des quartiers.
- `rufisque` et `sangalkam` sont à 3 500 F alors que le commentaire annonce la zone 2 à 1 500 F. Compare avec `client_website/src/lib/delivery.ts` et `docs/frais_livraison_bmc.md`.
- `autre-destination-plus-eloignee` vaut 0 : le contrat dit `delivery_fee = null` (prix confirmé par téléphone), pas gratuit.
- Un quartier inconnu en livraison doit renvoyer **400** (« quartier de livraison inconnu »), pas 0.
- Corrige : reprendre la grille complète depuis `delivery.ts` (mêmes identifiants), ajouter un test qui vérifie chaque quartier de `delivery.ts` ; ajouter un test « quartier inconnu → 400 » et « destination éloignée → `delivery_fee` nul ».

**3. Endpoints du contrat absents.** Le site client (Maïmouna) et l'admin (Alioune) les appellent déjà :
- `POST /api/orders/<ref>/cancel/` (annulation client, `pending` seulement, corps `{ "phone": "..." }`, sinon 409) ;
- annulation admin avec `cancel_reason` obligatoire (champ à ajouter au modèle, et à renvoyer dans la commande et le suivi) ;
- `POST /api/admin/orders/<ref>/confirm-payment/` (`pending` ou `unpaid` → `paid`).
Ce sont les tâches 5 et 6 d'Ibrahima dans `docs/taches_v1.md` : Ibrahima n'a rien poussé. Mets-vous d'accord tous les deux pour que ce soit fait une seule fois.

**4. Pas de protection contre la commande en double.** Le site envoie l'en-tête `Idempotency-Key`. Le backend l'ignore, donc un double clic crée deux commandes. À faire : stocker la clé (unique) sur la commande ; si la clé existe déjà, renvoyer la même commande avec le code 200. Test : deux POST identiques avec la même clé → une seule commande.

**5. `has_allergy` absent.** Ajoute le champ booléen (défaut faux) à la création, au modèle et à la réponse. Le KDS le met en évidence.

## À faire ensuite
6. **Réponse de la commande et du suivi :** ajoute `order_type`, `subtotal`, `delivery_fee`, `has_allergy`, `cancel_reason`. Le suivi `/api/orders/track/<ref>/` ne doit jamais exposer nom, téléphone ni adresse.
7. **Limite d'authentification à 10 par minute :** tu as ajouté la prise en compte du proxy (`throttling.py`, bien). Documente dans `docs/` la valeur 10/min et pourquoi (inscription et connexion), et ajoute le test du 429 à la 11e requête demandé dans `correctif_pathe_horaires_et_throttle.md`.
8. **Conflits à prévoir :** `bmc_backend/settings.py`, `serializers.py`, `auth_views.py` et `test_customer_auth.py` ont aussi été modifiés par Alioune (commit `33395f7`) et `settings.py` par la branche de déploiement d'Antigravity. Ta branche passe avant eux : après ta fusion, c'est à eux de reprendre leurs modifications de backend, pas à toi.

## Quand c'est corrigé
Préviens-moi : je refais la fusion sur une copie de `develop`, je relance les 13 modules de tests et je vérifie les 5 bloquants.
