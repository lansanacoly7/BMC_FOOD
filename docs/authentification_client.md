# Contrat d'Intégration — Authentification & Espace Client BMC Food

> **Auteur** : Pathé Fall  
> **Destinataires** : Équipe Frontend (Alioune, El Hadji, Maimouna)  
> **Objectif** : Remplacer l'authentification simulée (OTP fictif `454647` et `localStorage`) par l'API REST réelle de BMC Food.

---

## 1. Vue d'ensemble

L'API fournit une authentification autonome par jeton (Token) réservée aux clients.
- Les numéros de téléphone sénégalais sont acceptés avec ou sans indicatif (`+221 77 123 45 67`, `00221771234567`, ou `771234567`) et normalisés à 9 chiffres (`771234567`).
- Les jetons clients sont distincts des jetons staff de cuisine/administration. Un compte client ne peut pas accéder aux routes de l'application admin (KDS / gestion).
- Throttling : les routes d'authentification sont protégées contre les attaques par force brute (10 requêtes / minute par IP).

---

## 2. Endpoints Client

### 2.1 Inscription Client
* **Route** : `POST /api/auth/customer/register/`
* **Accès** : Public
* **Corps de la requête (JSON)** :
```json
{
  "name": "Fatou Ndiaye",
  "phone": "+221 77 856 13 13",
  "password": "MonMotDePasse123",
  "address": "Mermoz Pyrotechnie, Dakar"
}
```
*Note : `address` est facultatif lors de l'inscription.*

* **Réponse de succès (`201 Created`)** :
```json
{
  "success": true,
  "message": "Compte client créé avec succès.",
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 1,
    "name": "Fatou Ndiaye",
    "phone": "778561313",
    "address": "Mermoz Pyrotechnie, Dakar"
  }
}
```

* **Réponses d'erreur (`400 Bad Request`)** :
```json
{
  "success": false,
  "error": "Un compte client existe déjà avec ce numéro de téléphone."
}
```
*(ou `"Numéro de téléphone sénégalais invalide..."`, `"Le mot de passe doit comporter au moins 4 caractères."`)*

---

### 2.2 Connexion Client
* **Route** : `POST /api/auth/customer/login/`
* **Accès** : Public
* **Corps de la requête (JSON)** :
```json
{
  "phone": "778561313",
  "password": "MonMotDePasse123"
}
```

* **Réponse de succès (`200 OK`)** :
```json
{
  "success": true,
  "message": "Connexion réussie.",
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 1,
    "name": "Fatou Ndiaye",
    "phone": "778561313",
    "address": "Mermoz Pyrotechnie, Dakar"
  }
}
```

* **Réponse d'erreur (`400 Bad Request`)** :
```json
{
  "success": false,
  "error": "Numéro de téléphone ou mot de passe incorrect."
}
```

---

### 2.3 Profil et Historique du Client Authentifié
* **Route** : `GET /api/auth/customer/profile/`
* **Accès** : Protégé par jeton client
* **En-tête HTTP obligatoire** :
```http
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

* **Réponse de succès (`200 OK`)** :
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Fatou Ndiaye",
    "phone": "778561313",
    "address": "Mermoz Pyrotechnie, Dakar"
  },
  "recent_orders": [
    {
      "order_ref": "BMC-482915",
      "created_at": "2026-11-15T02:00:00Z",
      "status": "delivered",
      "payment_status": "paid",
      "total_amount": 4500,
      "items_count": 2
    }
  ]
}
```

---

### 2.4 Mise à Jour du Profil
* **Route** : `PATCH /api/auth/customer/profile/`
* **Accès** : Protégé par jeton client
* **Corps de la requête (JSON)** :
```json
{
  "name": "Fatou Ndiaye Diop",
  "address": "Almadies, Dakar"
}
```
* **Réponse de succès (`200 OK`)** : profil mis à jour retourné sous le même format.

---

## 3. Nouveau Support Commande : Frais et Retrait

Lors de la soumission d'une commande via `POST /api/orders/`, deux nouveaux champs sont disponibles :
- `fulfillment_method` : `"delivery"` (par défaut) ou `"pickup"` (à emporter).
- `delivery_area` : identifiant du quartier sélectionné (ex: `"grand-yoff"`, `"almadies"`, `"plateau"`...).

Si `fulfillment_method == "pickup"`, les frais de livraison appliqués par le serveur sont de **0 F CFA**.  
Si `fulfillment_method == "delivery"`, le serveur calcule automatiquement `delivery_fee` selon la grille officielle et l'ajoute au `total_amount`. Le client ne doit jamais envoyer de montant de frais calculé côté client.
