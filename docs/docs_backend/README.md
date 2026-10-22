# Documentation Backend — Ibrahima & Pathé

Dossier de suivi du travail de l'équipe backend BMC FOOD.

## Contenu

| Fichier | Rôle |
|---------|------|
| [../repartition_taches_backend.md](../repartition_taches_backend.md) | **Document de référence de la répartition** : fiches I1–I9 / P1–P9, interfaces, dépendances, risques, décisions à prendre |
| [journal_ibrahima.md](journal_ibrahima.md) | Suivi et preuves d'Ibrahima (I1–I9 uniquement) |
| [journal_pathe.md](journal_pathe.md) | Suivi et preuves de Pathé (P1–P9 uniquement) |

## Règles
- **Situation de départ** : aucune tâche n'a été exécutée. Le code du dépôt (squelette initial) n'est pas une preuve de réalisation.
- **Statuts** : `À faire` → `En cours` → `À tester` → `En revue` → `Validée`. `Validée` exige exécution, critères vérifiés, preuves consignées et revue croisée.
- **Chaque journal ne contient que les tâches de son propriétaire.** Les fiches détaillées ne sont pas dupliquées : elles vivent dans le document de référence.
- **Ordre de priorité des documents en cas de contradiction** : consignes du projet (guide de collaboration, pilotage) > feuille de route backend > répartition et journaux.

## Fiche d'exécution (à ajouter dans le journal de son propriétaire)

```markdown
### <ID> — <Titre>
- **Date** :
- **Branche / commit** :
- **Ce qui a été fait** :
- **Fichiers modifiés** :
- **Décisions techniques** :
- **Comment tester** : (commande, curl, ou lien Swagger)
- **Preuves** : (sortie de commande, résultat de tests)
- **Points d'attention / limites** :
```

## Documentation de référence à tenir à jour
- Documentation de l'API : Swagger (générée à partir du code ; I5, I6, P7).
- Guide d'installation : `backend/README.md` *(à créer, P8)*.
