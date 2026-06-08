# Journal de Bord des Bugs — AsblOS

> Fichier de référence pour tracer, comprendre et éviter la répétition des erreurs.
> **Prochain numéro disponible : Bug #1**

---

## Instructions (règles du journal)

Chaque fois qu'un bug ou une erreur est signalé, une entrée doit être **créée ou mise à jour** dans ce fichier.

### Format obligatoire de réponse (chat)

```
---

**📋 JOURNAL DE BORD - Bug #XX**

**Date :** [Date actuelle]
**Module concerné :** (ex: Fiche Enfant, Auth, Paiements…)
**Description du bug :** [Résumé clair]

**Diagnostic :** (ce qui ne va pas et pourquoi)
**Explication :** (simple et pédagogique)
**Solution apportée :** (code corrigé avec commentaires)
**Cause racine :** (pourquoi ça s'est produit)
**Actions préventives :** (comment éviter que ça revienne)
**Statut :** [Corrigé / En cours / À surveiller]

---
```

### Règles de maintenance

1. **Numérotation chronologique** — Bug #1, #2, #3… sans trou.
2. **Mise à jour cumulative** — Toutes les entrées restent dans ce fichier (ne pas supprimer l'historique).
3. **Patterns récurrents** — À chaque nouveau bug, vérifier si la cause ressemble à un bug précédent et mettre à jour la section ci-dessous.
4. **Résumé périodique** — Tous les **5 à 10 bugs**, ajouter une entrée dans « Résumés des tendances ».
5. **Proactivité** — Si un risque de répétition est détecté pendant le développement, alerter immédiatement (même sans bug signalé).

### Checklist après correction d'un bug

- [ ] Entrée ajoutée ou mise à jour dans ce fichier
- [ ] Patterns récurrents vérifiés
- [ ] Test manuel documenté (3 étapes minimum)
- [ ] Statut mis à jour (Corrigé / En cours / À surveiller)

---

## Patterns récurrents identifiés

_Aucun pattern confirmé pour l'instant — le journal vient d'être initialisé._

| Pattern | Bugs concernés | Cause commune | Prévention |
|---------|----------------|---------------|------------|
| _Exemple_ | _#1, #4, #7_ | _Données non validées avec Zod avant insertion_ | _Toujours valider côté Server Action + schéma Zod partagé_ |
| _Exemple_ | _#2, #5_ | _RLS Supabase mal configuré sur nouvelle table_ | _Migration RLS dans la même PR que la création de table + test avec rôle parent/staff_ |

---

## Résumés des tendances

### Résumé #0 — Initialisation (6 juin 2026)

- **Bugs enregistrés :** 0
- **État :** Journal créé, système prêt à recevoir les signalements.
- **Risques à surveiller (préventif, non comptés comme bugs) :**
  - Nouvelles tables sans policies RLS testées (staff vs parent)
  - Server Actions sans validation Zod avant écriture Supabase
  - Migrations Supabase non appliquées en local (022–024)
  - Création enfant staff sans transaction (adhésion peut échouer partiellement)

---

## Entrées des bugs

<!-- Les nouvelles entrées s'ajoutent ci-dessous, du plus récent au plus ancien -->

_Aucun bug enregistré pour l'instant. Le premier signalement créera **Bug #1**._

---

## Index rapide

| # | Date | Module | Statut | Titre court |
|---|------|--------|--------|-------------|
| — | — | — | — | _Aucune entrée_ |
