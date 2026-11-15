# Audit des règles métier : BMC Food

Objectif : lister ce qui manque ou reste flou dans les règles métier d'un restaurant populaire (tacos, burgers, plats sénégalais) avec commande en ligne, retrait sur place et livraison.

Méthode : lecture des modèles et des règles déjà codées (`Order`, `OrderItem`, `MenuItem`, `Customer`, horaires, paiement, statuts), plus les constats des revues précédentes. Les points marqués **(à vérifier)** n'ont pas été confirmés dans le code : ils demandent une décision métier ou un test.

Priorité : **P0** = risque d'argent ou d'erreur de commande en production, **P1** = important avant le lancement, **P2** = amélioration.

## 1. Ce qui existe déjà
- Prix recalculés côté serveur (le client n'envoie que `code` et `quantité`).
- Horaires d'ouverture (mardi à dimanche 11h à 02h, fuseau Africa/Dakar) : branche de Pathé, non fusionnée.
- Statuts de commande avec transitions contrôlées (le saut `pending` → `preparing` est refusé).
- Moyens de paiement : espèces, Wave, Orange Money. Statuts de paiement : `unpaid`, `pending`, `paid`, `refund_pending`.
- Plat du jour, plats populaires, disponibilité par article (`is_available`).
- Compte client (nom, téléphone unique, adresse), suivi de commande par référence, limitation de débit.

## 2. Mode de retrait : le trou le plus important (P0)
Le modèle `Order` n'a **aucun champ « type de commande »**. L'adresse est obligatoire pour toute commande. Or le restaurant fait :
| Mode | Besoin | État |
|---|---|---|
| Livraison | adresse, frais, zone, livreur | adresse seulement, pas de frais serveur, pas de zone |
| À emporter (le client vient) | pas d'adresse, heure de retrait | absent |
| Sur place (table) | numéro de table ou comptoir | absent |

Situations à traiter :
- Un client veut venir chercher sa commande : il doit aujourd'hui inventer une adresse.
- Le KDS ne sait pas s'il faut préparer pour un livreur, un client au comptoir ou une table.
- Heure de retrait souhaitée (« je passe dans 30 min ») : absente. Il faut aussi un délai minimum de préparation.
- Statuts différents selon le mode : « prête à retirer » pour l'emporter, « en livraison » pour la livraison.

## 3. Livraison (P0/P1)
- **Frais de livraison** : calculés côté client seulement, **non facturés par le serveur** (le total serveur les ignore). Le restaurant perd ces frais ou le client voit un autre montant.
- **Zones desservies** : aucune règle. Que répondre à un client hors zone (Dakar uniquement ? quartiers ?) ?
- **Frais par zone ou par distance**, et **franchise** (livraison offerte au-delà d'un montant) : à décider.
- **Commande minimale** pour la livraison : absente.
- **Livreur** : pas d'assignation, pas de suivi, pas de téléphone du livreur, pas de « livré ». Que se passe-t-il si le client ne répond pas ?
- **Adresse** : texte libre, sans repère (au Sénégal, les repères comptent : « en face de la pharmacie… »), sans position GPS ni lien Google Maps.
- **Heure limite de livraison** par rapport à la fermeture (02h) : une commande à 01h50 est-elle encore livrable ?

## 4. Menu, options et personnalisation (P0/P1)
Un taco ou un burger n'est jamais commandé « tel quel ». Le modèle `OrderItem` n'a que nom, prix unitaire et quantité.
- **Options et suppléments** absents : taille (simple, double, XL), viande (poulet, bœuf, mixte), sauces, fromage supplémentaire, sans oignon, frites incluses ou non. Rien pour les prix variables ni les formules.
- **Menus et formules** (burger + frites + boisson) : pas de notion de menu composé ni de prix réduit.
- **Note par article** : seule une note globale de commande existe (`notes`). En cuisine, « sans piment » sur le mauvais article crée des erreurs.
- **Allergènes** (arachide, gluten, lait, poisson) : aucune information. Les plats sénégalais contiennent souvent de l'arachide ou du poisson. Risque santé.
- **Plats halal / porc** : à indiquer clairement si le restaurant le garantit.
- **Disponibilité par horaire** : certains plats ne se servent que le midi (ex. thiéboudienne) ou en quantité limitée. Il n'existe qu'un interrupteur global `is_available`.
- **Stock du jour** : « plus de poulet » ou « 20 portions seulement ». Rien pour décrémenter, et rien n'avertit le client avant de payer.
- **Plat du jour** : un seul indicateur ; pas de dates de validité ni de rotation automatique.
- **Prix qui change entre le panier et la commande** : le client voit l'ancien prix dans son panier. Il faut un message clair si le total change au moment de valider.
- **Article retiré de la carte alors qu'il est dans un panier ou une commande en cours** : `OrderItem` est protégé par `PROTECT`, donc on ne peut pas supprimer un article déjà vendu. Il faut prévoir « archiver » au lieu de supprimer.
- **Boissons** : bv-1 retiré, 4 boissons à 800 F ; pas d'option « sans glace », pas de bouteille ou de format.

## 5. Paiement (P0)
- **Wave et Orange Money sont simulés** : aucune vraie intégration, aucun webhook de confirmation. Une commande Wave reste `pending` à vie, ou il faut valider à la main.
- **Qui passe `pending` → `paid` ?** Règle manuelle ou automatique ? Preuve de paiement ?
- **Commande payée mais jamais préparée** (rupture, fermeture) : le remboursement n'a que le statut `refund_pending`, sans procédure ni suivi de qui rembourse et quand.
- **Paiement échoué ou abandonné** : la commande est-elle annulée au bout de X minutes ? Les articles restent-ils réservés ?
- **Paiement à la livraison** : le livreur encaisse. Qui encaisse la monnaie ? Prévoir « appoint » (le client indique le billet qu'il donnera). Rien pour la caisse du livreur.
- **Pourboire** : pas prévu.
- **Reçu / facture / ticket** : un impression de ticket existe côté KDS, mais ni reçu client ni numéro de facture, ni TVA **(à vérifier)** : le restaurant est-il assujetti ?
- **Clôture de caisse journalière** et rapprochement espèces / Wave / Orange Money : absents.

## 6. Cycle de vie et annulation (P1)
- **Annulation par le client** : quand est-elle permise (avant préparation seulement) ? Frais ? Pas de règle visible.
- **Annulation par le restaurant** (rupture, rush, fermeture) : motif obligatoire ? Prévenir le client automatiquement ? Remboursement ?
- **Commande jamais confirmée ou jamais retirée** (client absent) : durée avant annulation, perte sèche, blocage des clients abusifs.
- **Retard** : pas de délai estimé affiché au client, pas d'alerte à la cuisine au-delà d'un seuil côté client (le KDS a des seuils chronométrés).
- **Modification d'une commande déjà envoyée** (ajouter un article, changer l'adresse) : impossible, ou non défini.
- **Commande en double** (double clic, mauvaise connexion) : pas de clé d'idempotence **(à vérifier)**. Deux commandes identiques arrivent à la cuisine.
- **Commande reçue pendant la fermeture** : bloquée par la règle de Pathé, mais la règle n'est pas encore en production.
- **Commande en dernière minute** (juste avant 02h) : délai de préparation, dernière prise de commande ? Règle à fixer, par exemple « dernière commande à 01h30 ».
- **Horaires exceptionnels** : fêtes (Tabaski, Korité, Magal), jour de repos exceptionnel, fermeture imprévue. Les horaires sont codés en dur ; l'administrateur ne peut pas les changer ni fermer le restaurant d'un clic.

## 7. Capacité et rush (P1)
- **Limite de commandes simultanées** : aucune. En cas d'affluence, la cuisine est submergée et les délais explosent.
- **Pause cuisine** (« on ne prend plus de commandes pendant 20 min ») : pas d'interrupteur.
- **Temps de préparation par article** (un taco ≠ un mafé) : absent, donc pas d'estimation d'attente réaliste.
- **Priorité** : commande sur place versus livraison versus commande planifiée.
- **Commandes groupées ou événements** (30 tacos pour un anniversaire) : quantité maximale par article ? Préavis ? Acompte ? Aucune règle. Pour l'instant n'importe quelle quantité est acceptée, ce qui permet aussi de bloquer la cuisine par erreur ou par abus.

## 8. Clients, comptes et fidélité (P1/P2)
- **Identification par numéro de téléphone** : format sénégalais (+221, 77/78/76/70/75) non vérifié **(à vérifier)** ; pas de confirmation par SMS ou WhatsApp. N'importe qui peut commander avec le numéro d'un autre.
- **Commande sans compte (invité)** : possible ou obligatoire ? Doublons de client si le numéro est écrit différemment (77… / +22177…).
- **Suivi de commande par référence** : le suivi public (tâche I13) n'expose aucune donnée personnelle, avec un 404 uniforme. Le risque est donc faible : seuls le statut et les articles sont devinables (référence à 6 chiffres). *(Correction : cette ligne annonçait d'abord un risque P0, à tort.)*
- **Notifications** : aucun SMS ni WhatsApp ni push « votre commande est prête ». C'est le canal n°1 au Sénégal.
- **Programme de fidélité, parrainage, codes promo** : un fichier de promotions existe (`BMC_PROMOTIONS_FILE`), mais pas de code promo appliqué côté serveur, pas de règles de cumul, de plafond ni d'usage unique.
- **Historique et recommande** (« refaire ma dernière commande ») : à vérifier côté client.
- **Avis et réclamations** : aucun canal (commande froide, article manquant, erreur de commande), pas de remboursement partiel.
- **Données personnelles** : durée de conservation, droit de suppression du compte (loi sénégalaise 2008-12) : à définir.
- **Clients abusifs** (faux numéros, commandes jamais retirées) : pas de liste de blocage.

## 9. Administration et équipe (P1)
- **Rôles et droits** : caissier, cuisinier, livreur, gérant. Qui peut annuler, rembourser, changer un prix ? **(à vérifier)** : un seul niveau d'accès semble exister.
- **Journal d'audit** : qui a changé un prix, une commande, un statut ? Sans historique, impossible de résoudre un litige.
- **Jeton d'accès admin écrit en dur dans le code** de l'admin (déjà signalé à Alioune).
- **Tableau de bord** : chiffre d'affaires du jour, plats les plus vendus, panier moyen, annulations, temps moyen de préparation **(à vérifier)**.
- **Gestion du menu par l'administrateur** : modifier prix, disponibilité, plat du jour, photos sans passer par le code ou le seed.
- **Plusieurs points de vente** : un seul restaurant est supposé. Si BMC ouvre un second point, il faut un modèle d'établissement.
- **Impression et son** : ticket cuisine, alerte sonore pour nouvelle commande ; fonctionnement hors ligne si la connexion coupe (fréquent) **(à vérifier)**.

## 10. Légal, finance et exploitation (P1/P2)
- **TVA, mentions légales, conditions générales de vente, politique de remboursement** : à rédiger.
- **Prix affichés TTC ?** Frais de service ?
- **Comptabilité** : export des ventes (par jour, par moyen de paiement).
- **Hygiène et traçabilité** : pas applicable en code mais à mentionner (allergènes, DLC).
- **Sauvegardes de la base, journalisation, monitoring**, et plan en cas de panne (retour au téléphone ou WhatsApp). Le seed doit être lancé à la main sur chaque serveur.
- **Fuseau horaire** : le Sénégal est en UTC+0 sans changement d'heure ; vérifier que le serveur et les téléphones ne décalent pas les horaires.

## 11. Scénarios de test à jouer avant le lancement
1. Client commande un taco à 01h55 : accepté ? préparé ? livrable ?
2. Client commande 3 plats dont un tombe en rupture pendant le paiement.
3. Client paie par Wave puis ferme l'application : la commande est-elle créée ?
4. Client double-clique sur « Commander » avec une connexion lente.
5. Client demande « à emporter », mais le site exige une adresse.
6. Client annule 2 minutes après la commande ; puis après le début de préparation.
7. Livreur injoignable, client absent à l'adresse.
8. Le restaurant manque de poulet : retirer l'article pour les commandes en cours.
9. Soirée de rush : 40 commandes en 15 minutes.
10. Lundi (fermé) et jour férié : message au client, commande planifiée possible ?
11. Client change son numéro ou en a deux : deux comptes ?
12. Client conteste un montant ou reçoit une commande erronée : procédure de remboursement.
13. Allergie à l'arachide : le client peut-il le signaler et qui le lit en cuisine ?
14. Commande de groupe de 30 menus pour le lendemain.

## 12. Ordre de traitement conseillé
1. **Décisions métier** (avec le gérant) : modes de commande, zones et frais, annulation, délais, horaires exceptionnels, TVA.
2. **P0 techniques** : champ `order_type` (+ heure de retrait, table), frais de livraison facturés par le serveur, vrai paiement Wave/Orange Money avec confirmation, idempotence des commandes.
3. **P1** : options/suppléments par article, notes par article, stock et rupture, interrupteur d'ouverture et de pause dans l'admin, notifications SMS/WhatsApp, rôles et journal d'audit, annulation et remboursement.
4. **P2** : fidélité et codes promo, avis, tableau de bord, multi-établissements.

Les étapes 2 et 3 ci-dessus touchent à la fois le backend (Pathé), l'admin/KDS (Alioune) et le site client (El Hadji). Il faut d'abord valider le modèle de données commun, c'est-à-dire `order_type`, les options et les frais, pour éviter trois implémentations incompatibles.
