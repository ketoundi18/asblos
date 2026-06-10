# LESSONS LEARNED — AsblOS

> Mémoire des frictions et apprentissages. Format : **Date | Contexte | Leçon | Action préventive**  
> Dernière mise à jour : 2026-06-09

---

## Sécurité & RLS

| Date | Contexte | Leçon | Action préventive |
|------|----------|-------|-------------------|
| 2026-06 | Bug #1 — signup Auth créait des BENEVOLE ; parents voyaient enfants non validés | La sécurité ne repose **pas** sur « l'UI n'expose pas le signup » — Supabase Auth accepte `signUp` via clé anon | Migration 029 : reject signup sauf metadata parent ou admin ; tester policy parent vs staff à chaque nouvelle table |
| 2026-06 | Migration 011 « repair » RLS parent | Assouplir RLS pour débloquer un test casse la prod — `verified_at` est non négociable | Jamais supprimer `verified_at` du SELECT parent ; policy séparée pour inscriptions en cours (010) |
| 2026-06 | Nouvelles tables staff-time (031–034) | Chaque module ajoute des policies — oublier RLS = fuite horaires / soldes | Checklist : `ALTER TABLE … ENABLE ROW LEVEL SECURITY` + test SELECT soi vs admin vs autre user |

---

## Paiements & webhooks

| Date | Contexte | Leçon | Action préventive |
|------|----------|-------|-------------------|
| 2026-06 | Bug #2 — webhook Mollie 401 en prod | Mollie POST uniquement `id=tr_xxx` — **aucun** header secret custom | Secret dans `webhookUrl?secret=` + re-fetch paiement via API Mollie |
| 2026-06 | Bug #3 — `sync_enrollment_paid` uuid = text | Comparer UUID à TEXT en PostgreSQL → erreur 42883 silencieuse côté RPC | Migration 030 ; typer explicitement les comparaisons UUID en SQL |
| 2026-06 | Dual model enrollment + memberships | Deux chemins peuvent diverger sans transaction | Atténuer via RPC ; unifier en V2 ; fallback TypeScript si migration pas appliquée |

---

## Dev & tests

| Date | Contexte | Leçon | Action préventive |
|------|----------|-------|-------------------|
| 2026-06 | E2e échouaient avec `Cannot find module './6141.js'` | Cache `.next` corrompu quand **deux serveurs dev** tournent ou arrêt brutal | `npm run dev:stop && rm -rf .next` avant `npm run test:e2e` ; utiliser `npm run dev:clean` |
| 2026-06 | Tests `/mon-service` skippés | ADMIN ne peut pas pointer — tests utilisaient le mauvais compte | Variable `E2E_CLOCK_STAFF_EMAIL` pour compte TRAVAILLEUR dédié |
| 2026-06 | Wizard parent bloqué en e2e (étape 1) | Playwright + hydration React : `validateStep1` via refs React fragile | Validation via `getElementById` ; rebuild `.next` propre |
| 2026-06 | Migrations non appliquées en local | Code déployé ≠ schéma Supabase → messages flash « migration manquante » | [supabase/INSTALL.md](./supabase/INSTALL.md) checklist ; messages F1 explicites |
| 2026-06 | Page « sans CSS » en dev (layout.css 404) | **Build/lint vert ≠ CSS chargé** ; cache `.next` corrompu par 2 serveurs ou build+dev simultanés | Vérifier HTTP 200 sur `layout.css` ; `npm run dev:clean` ; **prévenir l'utilisateur** après changements layout/fonts — voir règle agentic § CSS |

---

## UX & frontend

| Date | Contexte | Leçon | Action préventive |
|------|----------|-------|-------------------|
| 2026-06 | Audit CSS — `green-*` / `amber-*` dispersés | Couleurs Tailwind brutes cassent la charte et le dark mode | Tokens `success`, `warning`, `destructive` uniquement |
| 2026-06 | Nav mobile `slice(0,5)` | Barre tronquée = liens manquants par rôle (ADMIN sans Activités, TRAVAILLEUR sans Paiements) | Listes nav **par rôle** explicites dans `layout.tsx` |
| 2026-06 | Dashboard `/mon-service` tout-ou-rien | Une requête en échec (migration) bloquait toute la page | Dégradation gracieuse : entries bloquent ; ledger/solde/contrat affichent fallback |
| 2026-06 | Tutoiement mixte espace parents | Casse la confiance et la charte BRAND_BRIEF | Vouvoiement systématique ; relecture copy avant démo |

---

## Ce qui a bien fonctionné

| Date | Contexte | Leçon | Action préventive |
|------|----------|-------|-------------------|
| 2026-06 | Module horaires phases 0→6 | **Cadrage écrit** (decisions verrouillées) avant migration SQL évite les retours en arrière | Toujours phase 0 DECISIONS + EVOLUTION_SESSIONS avant `GO phase 1` |
| 2026-06 | `lib/auth/permissions.ts` | Fonctions `canXxx(role)` centralisées — audit permissions en un fichier | Nouvelle feature → ajouter permission ici en premier |
| 2026-06 | Flash messages `?flash=` + `flash-error-messages.ts` | UX cohérente staff/parent ; e2e peut assert sur URL | Réutiliser le pattern, pas de toast ad hoc |
| 2026-06 | `e2e/demo-smoke.spec.ts` | 5 écrans staff en ~30 s — filet de sécurité avant démo | Lancer avant chaque présentation ASBL |
| 2026-06 | Création staff par admin `/equipe/membres` | Fini les comptes fantômes ; audit `STAFF_ACCOUNT_CREATED` | Ne jamais rouvrir signup public staff |
| 2026-06 | `DATA_DICTIONARY.md` + migrations numérotées | Agents IA et devs retrouvent la vérité schéma | Mettre à jour après chaque migration |

---

## Patterns à éviter

1. **`as never` massif** dans `types/database.ts` — signe que les types ne suivent pas les migrations → `npm run gen:types`.
2. **Server Action sans Zod** — données invalides en base, messages cryptiques.
3. **Assouplir RLS « temporairement »** — jamais revert sans ticket + migration dédiée.
4. **Tests e2e sur toast Sonner seul** — fragile ; préférer URL, flash param, ou contenu page stable.
5. **Pitch avant checklist DEMO.md** — toujours valider migrations 001–036 + parcours 2× + e2e vert.
