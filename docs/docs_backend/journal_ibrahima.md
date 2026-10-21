# Journal de suivi — Ibrahima Khalilou Diallo

> **Périmètre : uniquement I1 à I9.** Les tâches de Pathé sont dans [journal_pathe.md](journal_pathe.md).
> Fiches détaillées (objectif, périmètre, cas d'erreur, hors périmètre) : [repartition_taches_backend.md](../repartition_taches_backend.md).
> Branche : `feature/backend/setup-and-pricing` · Aucun `push` sans demande explicite d'Ibrahima.

> [!IMPORTANT]
> Le code existant dans l'archive (squelette initial) **ne prouve aucune tâche réalisée**. Toutes les tâches sont **À faire** tant que leur exécution n'est pas consignée ci-dessous avec preuves.

**Statuts** : `À faire` → `En cours` → `À tester` → `En revue` → `Validée` (uniquement après exécution, vérification de tous les critères, preuves consignées et revue croisée).

## Tableau de suivi

| ID | Tâche | Dépend de | Statut | Preuves consignées | Revue croisée (Pathé) |
|----|-------|-----------|--------|--------------------|------------------------|
| I1 | Arborescence et socle Django | — | À faire | ☐ | ☐ |
| I2 | Modèles, contraintes, migrations (jalon J2) | I1 | À faire | ☐ | ☐ |
| I3 | Moteur de prix, panier, références uniques | I1, I2 | À faire | ☐ | ☐ |
| I4 | Transitions de commande, statuts de paiement, lecture des commandes | I1, I2, D2, D6 | À faire | ☐ | ☐ |
| I5 | Socle Swagger / OpenAPI | I1 | À faire | ☐ | ☐ |
| I6 | Schémas de requêtes/réponses, format d'erreur | I3, I4, I5 | À faire | ☐ | ☐ |
| I7 | Sécurité, configuration sensible, contrôle d'accès | I1, D1 | À faire | ☐ | ☐ |
| I8 | Revue croisée, PR, intégration | toutes les tâches `En revue` | À faire | ☐ | — |
| I9 | Tenue de ce journal (continu) | — | À faire | ☐ | ☐ |

> *Planification* : création de ce journal vierge = travail de planification, **non compté comme exécution de I9**.

## Critères d'acceptation à cocher (résumé — détail dans le document de référence)

**I1** ☐ arborescence conforme au guide · ☐ `manage.py check` sans erreur · ☐ `makemigrations --check --dry-run` sans changement · ☐ `GET /api/health/` → 200 · ☐ version de Python consignée
**I2** ☐ champs B1 complets · ☐ migrations sans conflit (base vide et base remplie) · ☐ contraintes vérifiées par essai de violation · ☐ jalon J2 annoncé à Pathé
**I3** ☐ total = Σ(prix en base × quantité) · ☐ prix client sans effet · ☐ entrée invalide → 400, aucune commande créée · ☐ création atomique · ☐ référence unique même en collision · ☐ contrat de commande publié (validé par les tests P5)
**I4** ☐ matrice de transitions publiée (après D2) · ☐ transition interdite → 400 · ☐ `payment_status` invalide → 400 · ☐ référence inconnue → 404 · ☐ filtre `?status=` validé (validé par les tests P6)
**I5** ☐ schéma OpenAPI servi sans erreur bloquante · ☐ page Swagger accessible · ☐ dépendance dans `requirements.txt`
**I6** ☐ schéma requête/réponse pour chaque endpoint B4 · ☐ format d'erreur unique documenté · ☐ C1 sans écart
**I7** ☐ aucun secret en dur · ☐ DEBUG/hôtes/CORS par environnement · ☐ endpoints admin refusés aux anonymes · ☐ politique d'accès publiée avant câblage de P3/P4 (validé par les tests P6)
**I8** ☐ toutes les tâches de Pathé relues, retours consignés · ☐ PR vers `develop` (reviewer Lansana Coly) · ☐ suite de tests, `check`, démarrage au vert
**I9** ☐ statuts cohérents avec les preuves · ☐ aucune fiche rédigée avant exécution · ☐ commande de reproduction dans chaque fiche

## Décisions en attente concernant mes tâches
D1 (authentification admin) · D2 (cycle de vie) · D6 (paiement) · D8 (intégration de la structure) · D10 (format d'erreur) · D12 (quantité max) · D13 (version Python) — voir section 6 du document de référence.

---

## Fiches d'exécution
*(à renseigner au fur et à mesure : date · branche/commit · ce qui a été fait · fichiers modifiés · décisions · commande de test · preuves · limites)*
