# Journal de suivi — Pathé Fall

> **Périmètre : uniquement P1 à P9.** Les tâches d'Ibrahima sont dans [journal_ibrahima.md](journal_ibrahima.md).
> Fiches détaillées (objectif, périmètre, cas d'erreur, hors périmètre) : [repartition_taches_backend.md](../repartition_taches_backend.md).
> Branche : `feature/backend/setup-and-pricing` (ou sous-branche dédiée, voir D8).

> [!IMPORTANT]
> Le code existant dans l'archive (squelette initial, dont `seed_bmc.py`) **ne prouve aucune tâche réalisée**. Toutes les tâches sont **À faire** tant que leur exécution n'est pas consignée ci-dessous avec preuves. Aucun test automatisé n'existe dans le dépôt.

**Statuts** : `À faire` → `En cours` → `À tester` → `En revue` → `Validée` (uniquement après exécution, vérification de tous les critères, preuves consignées et revue croisée).

## Tableau de suivi

| ID | Tâche | Dépend de | Statut | Preuves consignées | Revue croisée (Ibrahima) |
|----|-------|-----------|--------|--------------------|---------------------------|
| P1 | Audit du catalogue et conformité du menu | D3, D7 (lecture : aucune) ; corrections après J2 | À faire | ☐ | ☐ |
| P2 | Seed idempotent, stratégie de base | J2 (I2), P1, I1, D4 | À faire | ☐ | ☐ |
| P3 | Plat du Jour : validation stricte | I1, J2, politique I7, D5 | À faire | ☐ | ☐ |
| P4 | Alertes : endpoints et acquittement | I1, J2, politique I7, contrat I6, D14 | À faire | ☐ | ☐ |
| P5 | Tests du moteur de prix | contrat I3 (puis I3 exécuté) | À faire | ☐ | ☐ |
| P6 | Tests des endpoints et réponses HTTP | I3, I4, I7, P3, P4 | À faire | ☐ | ☐ |
| P7 | Annotations Swagger | I5, I6, I7 | À faire | ☐ | ☐ |
| P8 | Installation, exemples curl/Postman | I1, I7, P2, endpoints stabilisés, I5 | À faire | ☐ | ☐ |
| P9 | Tenue de ce journal (continu) | — | À faire | ☐ | ☐ |

> *Planification* : création de ce journal vierge = travail de planification, **non compté comme exécution de P9**.

## Critères d'acceptation à cocher (résumé — détail dans le document de référence)

**P1** ☐ 0 écart non justifié avec le menu officiel · ☐ nombre d'articles/catégories = cible décidée (D3) · ☐ codes uniques · ☐ `GET /api/menu/` ne renvoie que les articles disponibles
**P2** ☐ 2 exécutions = 0 doublon · ☐ aucune commande existante altérée · ☐ stratégie D4 appliquée et documentée · ☐ aucun changement de modèle
**P3** ☐ valeur non booléenne → 400 · ☐ règle D5 respectée en base · ☐ `GET` renvoie le(s) plat(s) attendu(s) · ☐ toggle refusé aux non-autorisés
**P4** ☐ commande visible jusqu'à acquittement · ☐ acquittement ciblé n'affecte que les références données · ☐ entrée invalide → 400 · ☐ comportement « sans références » conforme à D14 · ☐ endpoint non public
**P5** ☐ un test par cas listé · ☐ suite verte · ☐ un test échoue si le moteur lit un prix client (essai négatif)
**P6** ☐ chaque endpoint B4 : un test nominal + un test d'erreur · ☐ permissions testées · ☐ suite verte
**P7** ☐ tous les endpoints B4 annotés · ☐ exemples exécutables et exacts · ☐ codes d'erreur listés · ☐ aucun changement de comportement (P5/P6 verts)
**P8** ☐ guide exécuté de zéro jusqu'à `GET /api/health/` · ☐ tous les exemples rejouables · ☐ aucun secret réel
**P9** ☐ statuts cohérents avec les preuves · ☐ aucune fiche rédigée avant exécution · ☐ commande de reproduction dans chaque fiche

## Décisions en attente concernant mes tâches
D3 (sauces) · D4 (base SQLite) · D5 (Plat du Jour) · D7 (source du menu) · D9 (emplacement tests/README) · D14 (acquittement) — voir section 6 du document de référence.

---

## Fiches d'exécution
*(à renseigner au fur et à mesure : date · branche/commit · ce qui a été fait · fichiers modifiés · décisions · commande de test · preuves · limites)*
