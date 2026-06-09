# Journal de Bord des Bugs — AsblOS

> Fichier de référence pour tracer, comprendre et éviter la répétition des erreurs.
> **Prochain numéro disponible : Bug #2**

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

| Pattern | Bugs concernés | Cause commune | Prévention |
|---------|----------------|---------------|------------|
| RLS assoupli « pour débloquer » | #1 | Migration repair sans verified_at | verified_at pour SELECT parent ; inscriptions en cours via policy séparée (010) |
| Signup Auth ouvert | #1 | Trigger assignait BENEVOLE par défaut | Migration 029 : reject sauf parent (user_metadata) ou staff (app_metadata admin) |

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

---

**📋 JOURNAL DE BORD - Bug #1**

**Date :** 9 juin 2026  
**Module concerné :** Auth + RLS parent  
**Description du bug :** Inscription Auth publique créait des comptes BENEVOLE ; parents voyaient des enfants liés sans validation ASBL (migration 011).

**Diagnostic :** `handle_new_user` (024) assignait BENEVOLE à tout signup sans `signup_source=parent`. Migration 011 supprimait `verified_at` sur `children_select_parent`. Un attaquant ou un parent auto-lié par e-mail guardian accédait à des données médicales avant validation admin.

**Explication :** La sécurité ne doit pas reposer sur « l'UI n'expose pas le signup staff » — Supabase Auth accepte `signUp` via la clé anon. Côté enfant, deux policies OR : liens non vérifiés + fiches créées par le parent ; la première était trop permissive.

**Solution apportée :** Migration `029_parent_signup_rls_hardening.sql` — reject signup sauf parent (user_metadata) ou staff (app_metadata admin) ; restaure `my_verified_child_ids()` sur SELECT parent ; `my_parent_child_ids()` = vérifiés + inscriptions en cours uniquement.

**Cause racine :** Migration 011 « repair » pour débloquer un cas test sans réintroduire la validation ; trigger signup pensé pour le dev, pas la prod.

**Actions préventives :** Appliquer 029 en prod ; créer staff avec `app_metadata: {"signup_source":"admin","role":"..."}` ; ne jamais assouplir RLS sans policy parallèle pour inscriptions en cours.

**Statut :** Corrigé (migration 029 — à appliquer dans Supabase SQL Editor)

**Test manuel :**
1. Appliquer 029 dans Supabase SQL Editor
2. Parent auto-lié non validé → `/espace-parents` ne montre pas l'enfant staff existant
3. Parent inscrit un enfant via wizard → enfant visible pendant le parcours
4. Admin valide le lien → enfant visible après validation
5. `signUp` anon sans metadata → échec (pas de profil BENEVOLE)

---

## Index rapide

| # | Date | Module | Statut | Titre court |
|---|------|--------|--------|-------------|
| 1 | 9 juin 2026 | Auth + RLS | Corrigé (029) | Signup BENEVOLE + parent sans verified_at |
