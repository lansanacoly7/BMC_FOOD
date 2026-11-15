# Frais de Livraison — BMC FOOD

> **Source** : grille fournie par Pape Aliou Sène (porteur métier), 21/10/2026  
> **Règle** : les frais de livraison sont **payés par le client**, en plus du prix des plats.  
> **Code** : `client_website/src/lib/delivery.ts` (liste à choix `DeliveryZoneSelect`)

---

## 1. Grille par zone

| Zone | Quartiers | Tarif |
| :--- | :--- | :---: |
| 1 — Très proche | Cité Mixta, Grand Yoff, Patte d’Oie, Arafat | 1 000 F |
| 2 — Proche | Nord Foire, Foire, Liberté 5, Liberté 6, HLM, Dieuppeul, Cité des Eaux | 1 500 F |
| 3 — Dakar nord | Parcelles Assainies, Cambérène, Yoff, Ouest Foire, Tivaouane Peulh | 1 500 – 2 000 F |
| 4 — Dakar centre | Sacré-Cœur, Sicap, Castors, Amitié, Fann, Point E, Fass, Médina | 2 000 F |
| 5 — Dakar ouest | Mermoz, Ouakam, Ngor, Almadies, Mamelles, Corniche Ouest | 2 500 F |
| 6 — Plateau et sud | Plateau, Colobane, Rebeuss, Gueule Tapée, Hann Maristes, Hann Bel-Air | 2 500 F |
| 7 — Banlieue proche | Pikine, Dalifort, Thiaroye, Guédiawaye, Golf Sud, Yeumbeul | 3 000 F |
| 8 — Banlieue éloignée | Keur Massar, Malika, Jaxaay, Rufisque, Sangalkam | 3 000 – 3 500 F |
| 9 — Longue distance | Bargny, Diamniadio, Sébikotane et au-delà | à partir de 3 500 F |

**Décision du 21/10/2026** : Gueule Tapée, citée en zones 4 et 6, est rattachée à la **zone 6 (2 500 F)**.

## 2. Prix par quartier pour les zones à fourchette — ⚠️ à valider par BMC

Wave et Orange Money exigent un montant exact : chaque quartier a donc un prix fixe, proposé selon la distance depuis le restaurant (zone 1 : Grand Yoff / Patte d’Oie).

| Zone | Quartier | Prix proposé |
| :---: | :--- | :---: |
| 3 | Parcelles Assainies, Yoff, Ouest Foire | 1 500 F |
| 3 | Cambérène, Tivaouane Peulh | 2 000 F |
| 8 | Keur Massar | 3 000 F |
| 8 | Malika, Jaxaay, Rufisque, Sangalkam | 3 500 F |
| 9 | Bargny, Diamniadio | 3 500 F |
| 9 | Sébikotane | 4 000 F |
| 9 | Autre destination plus éloignée | prix confirmé par téléphone |

## 3. Implémentation côté backend (V1 — Ibrahima)

La grille officielle (51 quartiers répartis sur les zones 1 à 9) est désormais enregistrée et appliquée côté Django (`backend/api/delivery_grid.py` et modèle `DeliveryArea`, migration `0006_deliveryarea_and_order_v1_fields`, `seed_bmc` idempotent) :

1. **Table `DeliveryArea`** : contient chaque quartier (`slug`, `name`, `zone`, `zone_label`, `fee`, `is_active`), initialisée par la migration `0006` et maintenue de façon non-destructive par `python manage.py seed_bmc` (réinitialisable avec `--reset`).
2. **`POST /api/orders/`** :
   - En mode `order_type="delivery"`, `delivery_area` (ex. `grand-yoff`) et `address` sont obligatoires ; un quartier inconnu renvoie HTTP 400.
   - Pour `autre-destination-plus-eloignee`, `delivery_fee` vaut `null` et `total_amount = subtotal`.
   - En mode `order_type="pickup"`, l'adresse est facultative, `delivery_area=""`, `delivery_fee=0` et `total_amount = subtotal`.
   - Tout prix ou frais envoyé par le client est ignoré par le serveur.
3. **Réponses (`OrderSerializer` & suivi `GET /api/orders/track/<ref>/`)** : exposent `order_type`, `delivery_area` (hors suivi public si sensible, mais `delivery_fee` et `subtotal` présents dans les deux), `delivery_fee`, `subtotal` et `total_amount`.
