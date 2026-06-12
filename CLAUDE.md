# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Complète (ne remplace pas) la doc détaillée du repo.

## Projet

**AsblOS** = application web de gestion pour ASBL belges (enfants mineurs).
Remplace papier/Excel. UX simple, 100 % français, mobile-first.

- **Prod** : https://asblos.vercel.app
- **Ne pas confondre** : `monasbl.be` = autre site, pas cette app
- **Utilisateur** : débutant — expliquer en français simple, une étape à la fois

## Stack (ne pas changer)

Next.js 15 App Router · TypeScript strict · Tailwind · shadcn/ui · Supabase (Auth + Postgres + RLS) · Zod · Server Actions · Vercel · Node ≥ 24

## Commandes courantes

```bash
# Dev
npm run dev:clean          # démarre le serveur (port 3000, un seul terminal)
npm run dev:stop           # arrête proprement

# Vérification
npm run typecheck          # tsc --noEmit
npm run lint               # eslint
npm run css:check          # vérifie que Tailwind compile sans 404
CI=true npm run build      # build complet (seulement si dev arrêté !)

# Tests unitaires (vitest)
npm run test               # run une fois
npm run test:watch         # mode watch
npx vitest run lib/auth/password-reset-url.test.ts   # fichier unique

# Tests e2e (Playwright)
npm run test:e2e           # headless
npm run test:e2e:ui        # mode UI interactif
npm run cleanup:e2e        # nettoyer les données de test

# Supabase
npm run gen:types          # régénère types/database.ts après changement schéma
npm run check:supabase     # vérifie la connexion au projet distant
```

**Ne pas** lancer `npm run build` pendant que `dev` tourne — le cache `.next` se corrompt (CSS 404).
Si page sans style : `npm run dev:stop` → `rm -rf .next` → `npm run dev:clean`.

## Deux interfaces

| Espace | Routes | Rôles |
|--------|--------|-------|
| Staff | `/connexion`, `/`, `/enfants`, `/activites`, `/planning`, `/paiements`, `/equipe`, `/mon-service`, `/rapports`… | ADMIN, TRAVAILLEUR, BÉNÉVOLE, STAGIAIRE |
| Parents | `/espace-parents/*` | PARENT uniquement |

**PARENT ≠ staff.** Un parent ne voit/gère que **ses** enfants (`parent_child_links`, RLS).

## Architecture backend

```
app/(app)/          → pages staff (Server Components)
app/(parent)/       → espace parents isolé
app/(terrain)/      → vue terrain pointage activités (layout allégé)
lib/data/           → lectures seules (queries, jamais de mutation)
lib/actions/        → mutations ("use server", Zod, redirect)
lib/actions/*-state.ts  → types d'état formulaire (jamais d'objet exporté depuis "use server")
lib/validations/    → schémas Zod
lib/auth/permissions.ts → source de vérité des droits (canXxx)
lib/auth/session.ts → requireProfile(), getCurrentProfile()
lib/supabase/server.ts  → createClient() — respecte RLS
lib/supabase/admin.ts   → createAdminClient() — service_role, serveur uniquement
lib/audit/log-audit.ts  → journal actions sensibles (RGPD, paiement…)
lib/messages/flash-messages.ts → source de vérité des messages flash (toasts Sonner)
supabase/migrations/    → schéma SQL numéroté (ordre strict)
types/database.ts       → types générés (npm run gen:types)
```

### Workflow mutation (Server Action)

1. `requireProfile()` → vérifier `canXxx(role)` dans `permissions.ts`
2. Valider avec Zod (`lib/validations/`)
3. Écrire via `createClient()` (RLS) ou `createAdminClient()` (webhook, RGPD, création staff)
4. `logAuditEvent()` si flux sensible (création enfant, paiement, validation, RGPD)
5. `revalidatePath` + `redirect("?error=code")` ou `?success=code`
6. Codes flash → définis dans `lib/messages/flash-messages.ts` uniquement — pas de bannière HTML ad hoc

### Flash messages — règle stricte

Toujours passer par un code `redirect("/chemin?success=code")` ou `?error=code`.
Avant d'utiliser un code : vérifier qu'il existe dans `resolveSuccessToast` / `resolveErrorToast` dans `flash-messages.ts`. Si absent, l'**ajouter d'abord** dans ce fichier, puis utiliser le code dans le redirect.
Ne jamais créer de `<div>` alerte custom sur la page pour les retours d'action globaux.

### Permissions — fonctions disponibles (`lib/auth/permissions.ts`)

- Enfants : `canCreateChild`, `canModifyChild`, `canDeleteChild`, `canViewFullChildProfile`
- Activités : `canManageActivities`, `canRegisterChildToActivity`, `canMarkAttendance`
- Paiements : `canRecordPayment`
- Admin : `canManageUsers`, `canExportReports`, `canManageChildGdpr`
- Rôles : `isParentRole`, `isStaffRole` (`lib/auth/roles.ts`)

### Création de comptes

- **Parent** : inscription `/espace-parents/inscription` → trigger SQL `handle_new_user` (migration **047**) crée le profil si `user_metadata.signup_source=parent`
- **Staff** : ADMIN via `/equipe/membres` → `createAuthUserAdmin()` avec `app_metadata: { signup_source:"admin", role, created_by:"asblos_admin" }` puis upsert `profiles` (le trigger n'intervient pas)

## Migrations Supabase

- Ordre strict : voir `supabase/INSTALL.md` (001 → **047**)
- **007a avant 007** (enum PARENT)
- Après changement schéma : `npm run gen:types`
- Après merge d'une migration : rappeler au user de l'exécuter dans **Supabase Dashboard → SQL Editor**
- Nouvelle valeur enum → fichier migration séparé `NNNa_*.sql` avant usage
- RPC `SECURITY DEFINER` → toujours ajouter :
  ```sql
  REVOKE ALL ON FUNCTION public.ma_fonction(...) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.ma_fonction(...) TO service_role;
  ```
- Vérification : `scripts/verify-supabase-migrations.sql`

## Règles non négociables

- **RLS** sur toute nouvelle table avec données personnelles
- **Jamais** faire confiance à l'UI seule — permissions côté serveur
- **Jamais** exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
- **Parent** : vérifier que le `childId` appartient au parent avant toute mutation
- **Paiements** : ordre PAID → sync (jamais l'inverse)
- **RGPD** : anonymisation via RPC `anonymize_child` (028) uniquement
- **Pas de commit** sans `GO commit` explicite de l'utilisateur
- **Scope minimal** — corriger ce qui est demandé, pas refactoriser à côté
- Par défaut : plan court → attendre **GO** avant de coder

## Docs à lire avant une grosse modification

| Priorité | Fichier | Contenu |
|----------|---------|---------|
| 1 | `CONSTITUTION.md` | Mission, valeurs, DoD |
| 2 | `.cursor/skills/backend-asblos/SKILL.md` | Workflow backend complet |
| 3 | `DECISIONS.md` | Décisions déjà actées |
| 4 | `supabase/INSTALL.md` | Migrations 001→047 |
| 5 | `docs/SERVICE_ROLE_INVENTORY.md` | Usages service_role |
| 6 | `JOURNAL_DE_BORD.md` | Bugs connus et fixes |
| 7 | `EVOLUTION_SESSIONS.md` | Livraisons récentes |

## Intégrations

| Service | Emplacement |
|---------|-------------|
| Mollie paiements | `lib/mollie/`, `/api/webhooks/mollie` |
| Webhook Mollie | secret dans URL `?secret=` (Mollie ne supporte pas les headers) |
| Cron pointage | `/api/cron/staff-time-settlement` (`CRON_SECRET`) |
| Emails (Brevo) | `docs/BREVO.md` — config prod à faire |
| Sentry | optionnel prod |
