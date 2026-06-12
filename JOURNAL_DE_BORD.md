# Journal de Bord des Bugs — AsblOS

> Fichier de référence pour tracer, comprendre et éviter la répétition des erreurs.
> **Prochain numéro disponible : Bug #5**

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
| Webhook Mollie auth | #2 | Header secret que Mollie n'envoie jamais | Secret en `?secret=` sur webhookUrl + vérif API Mollie dans sync |
| Migration SQL non appliquée en prod | #4 | Code déployé sur Vercel mais trigger Supabase pas mis à jour | Après chaque merge contenant une migration : appliquer dans Supabase SQL Editor + vérifier avec la requête de diagnostic fournie dans le script |

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

**📋 JOURNAL DE BORD - Bug #4**

**Date :** 12 juin 2026
**Module concerné :** Équipe — création compte staff (`/equipe/membres`)
**Description du bug :** En production, le formulaire "Créer le compte" renvoyait "Impossible de créer le compte" sans détail, pour tout nouveau membre staff.

**Diagnostic :** Deux couches à corriger séparément. Le code côté Vercel avait déjà été patché (commits `cc4f1fc` + `7cd6431`), mais le trigger SQL `handle_new_user` en production Supabase était encore à la version 029 — qui bloquait la création Auth si `signup_source` n'était ni `parent` (user_metadata) ni `admin` (app_metadata). La migration 047 (`047_handle_new_user_parent_only.sql`) n'avait pas été appliquée en base prod.

**Explication :** Vercel déploie le code automatiquement ; les migrations Supabase sont manuelles. Il suffit d'oublier d'exécuter une migration en prod pour que le code et la base soient désynchronisés. Le trigger 029 lançait une exception `signup_not_allowed` ou `database error saving new user`, et l'absence de message structuré dans la réponse produisait le fallback générique.

**Solution apportée :** Application de `scripts/fix-handle-new-user-post-046.sql` (= migration 047) dans Supabase SQL Editor en production. Trigger désormais parent-only : ne crée un profil que si `user_metadata.signup_source = 'parent'` ; ignore tous les autres signups (staff créé par l'app via upsert service_role).

**Cause racine :** Migration 047 déployée dans le repo mais non exécutée en base Supabase production.

**Actions préventives :** Après tout merge contenant une migration, exécuter immédiatement dans Supabase SQL Editor. Utiliser la requête de vérification incluse dans le script (`handle_new_user_parent_only_ok = true` + `handle_new_user_no_staff_block_ok = true`) avant de tester en prod.

**Statut :** Corrigé ✅

**Test manuel :**
1. ADMIN → `/equipe/membres` → formulaire avec e-mail neuf, rôle Travailleur → "Créer le compte" → redirect `?success=staff-created`, membre dans la liste
2. Onglet privé → connexion avec les nouveaux identifiants → accès espace staff correct
3. Retenter avec le même e-mail → message "Cet e-mail est déjà utilisé..." (pas le message générique)

---

**📋 JOURNAL DE BORD - Bug #2**

**Date :** 9 juin 2026
**Module concerné :** Paiements — webhook Mollie
**Description du bug :** En production, les webhooks Mollie renvoyaient 401 — sync paiement post-Bancontact cassée.

**Diagnostic :** `isWebhookAuthorized` exigeait `X-Mollie-Webhook-Secret` ou `Authorization: Bearer`, headers que **Mollie n'envoie pas**. Avec secret configuré → 401 systématique. Sans secret en prod → 401 aussi.

**Explication :** Mollie POST uniquement `id=tr_xxx` (form-urlencoded). La sécurité doit reposer sur (1) secret dans l'URL webhook `?secret=` et (2) re-fetch du paiement via API Mollie + correspondance en base AsblOS.

**Solution apportée :** `lib/payments/mollie-webhook.ts` — `buildMollieWebhookUrl()` + `verifyMollieWebhookRequest()` ; route webhook refactorée ; `parent-payment` passe l'URL avec secret.

**Cause racine :** Auth webhook copiée sur un pattern générique incompatible avec le protocole Mollie.

**Actions préventives :** Configurer `MOLLIE_WEBHOOK_SECRET` sur Vercel ; URL dashboard Mollie = `https://app/api/webhooks/mollie?secret=...` ; tester webhook depuis dashboard Mollie après deploy.

**Statut :** Corrigé (code — deploy + env requis)

**Test manuel :**
1. `MOLLIE_API_KEY` + `MOLLIE_WEBHOOK_SECRET` + `NEXT_PUBLIC_APP_URL` sur Vercel
2. Paiement test parent → Bancontact → webhook 200 dans logs Vercel
3. Paiement `PAID` en base + adhésion synchronisée sans retour navigateur
4. `curl -X POST 'http://localhost:3000/api/webhooks/mollie?secret=...' -d 'id=tr_xxx'` → 200 ou sync

---

**📋 JOURNAL DE BORD - Bug #3**

**Date :** 9 juin 2026
**Module concerné :** Paiements — simulation parent / sync adhésion
**Description du bug :** Après « Simuler le paiement », toast « Le paiement simulé n'a pas pu activer l'adhésion » (erreur `membership-paid`).

**Diagnostic :** `sync_enrollment_paid` (migration 027) compare `payments.reference_id` (UUID) à `p_membership_id::text` → PostgreSQL `operator does not exist: uuid = text` (42883). La clé `SUPABASE_SERVICE_ROLE_KEY` fonctionne ; c'est la fonction RPC qui plante.

**Solution apportée :** Migration `030_fix_sync_enrollment_paid_reference.sql` (`reference_id = p_membership_id`) ; fallback TypeScript si 030 pas encore appliquée en base.

**Statut :** Corrigé (code + migration SQL à exécuter dans Supabase)

**Test manuel :**
1. Exécuter `030_fix_sync_enrollment_paid_reference.sql` dans Supabase SQL Editor
2. Parent → inscription soutien scolaire → Simuler le paiement
3. Toast succès + adhésion `AWAITING_ASBL` côté staff

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
| 4 | 12 juin 2026 | Équipe — création staff | Corrigé ✅ | "Impossible de créer le compte" — migration 047 non appliquée en prod |
| 3 | 9 juin 2026 | Paiements — simulation | Corrigé | Toast `membership-paid` — RPC type mismatch uuid/text |
| 2 | 9 juin 2026 | Paiements Mollie | Corrigé | Webhook 401 — auth incompatible Mollie |
| 1 | 9 juin 2026 | Auth + RLS | Corrigé (029) | Signup BENEVOLE + parent sans verified_at |
