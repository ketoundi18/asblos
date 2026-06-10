# FRICTION LOG — AsblOS

> Journal des blocages réels et de leur résolution.  
> Dernière mise à jour : 2026-06-09

---

## 2026-06 — CSS `layout.css` 404 (page sans style)

**Blocage :** L'app ressemble à un « vieux site sans CSS » — texte brut, pas de couleurs, pas de cartes. Signalé **plusieurs fois** par l'utilisateur ; non détecté lors d'audits code-only.

**Symptôme visible :** HTML OK, classes Tailwind présentes dans le DOM, mais **aucun style appliqué**.

**Cause :** Le fichier `/_next/static/css/app/layout.css` renvoie **404** — dossier `.next/static/css/app/` vide ou cache corrompu. **Ce n'est pas** un bug Tailwind/globals.css en soi.

**Déclencheurs fréquents :**
1. **Deux serveurs** `next dev` en parallèle (ports 3000 + 3001)
2. **`npm run build` pendant que `npm run dev` tourne** → mélange prod/dev dans `.next`
3. Arrêt brutal du serveur sans `dev:stop`

**Résolution :**
```bash
npm run dev:stop
rm -rf .next
npm run dev:clean
```
Puis **Cmd+Shift+R** dans le navigateur sur http://localhost:3000

**Vérification agent (obligatoire avant « c'est bon ») :**
```bash
CSS=$(curl -s http://localhost:3000/connexion | grep -oE 'href="(/_next/static/css/[^"]+)"' | head -1 | sed 's/href="//;s/"//')
curl -s -o /dev/null -w "layout.css: %{http_code} size:%{size_download}\n" "http://localhost:3000${CSS}"
```
→ Attendu : `200` et size > 10000 octets.

**Éviter :** Règle permanente `.cursor/rules/agentic.mdc` § Règle CSS ; **prévenir l'utilisateur** après changements layout/fonts/UI ; ne jamais conclure un audit sans ce check si le dev tourne.

---

## 2026-06 — Alertes Sentry en dev (webpack / next-devtools)

**Blocage :** Emails Sentry « high priority » pour `GET /connexion` — `__webpack_modules__ is not a function`, module `next-devtools` introuvable.

**Cause :** Cache `.next` corrompu pendant `npm run dev` **+** `SENTRY_ENABLE_DEV=true` dans `.env.local` → erreurs dev envoyées à Sentry comme en prod.

**Résolution :** `SENTRY_ENABLE_DEV=false` par défaut ; filtre `beforeSend` dans `lib/monitoring/sentry-options.ts` pour ignorer le bruit webpack/cache.

**Éviter :** Ne jamais activer Sentry dev sans test volontaire (`/api/debug/sentry-test`) ; `npm run dev:clean` si webpack plante.

---

## 2026-06 — Backlog audit soir (S2–S4, M4–M7, D1)

**Blocage :** Audit Cursor + Claude — sel IP sur service role, hashAuditIp mort, downgrade staff-read, enfants orphelins, guardian silencieux, archivage sans audit.

**Résolution :** `AUDIT_IP_SALT` seul sel ; `getAuditIpHash()` sur login/GDPR/paiements ; `createStaffReadClient` fail loud ; compensation INACTIF create-child ; erreurs guardian update-child ; `CHILD_ARCHIVED` + UUID guards.

**Éviter :** Définir `AUDIT_IP_SALT` en prod (openssl rand -hex 32) ; tester création enfant + archivage dans `/rapports` audit.

---

## 2026-06 — Cache Next.js corrompu (e2e)

**Blocage :** 4 tests e2e échouaient — `Runtime Error: Cannot find module './6141.js'` sur `/soutien-scolaire/nouveau` ; wizard parent bloqué à l'étape 1.

**Cause :** Deux instances `next dev` sur le port 3000 + arrêts brutaux → chunk webpack invalide dans `.next/`.

**Résolution :**
```bash
npm run dev:stop
rm -rf .next
npm run test:e2e
```
→ **16/16 passés**, 3 skipped (config manquante).

**Éviter :** Toujours `npm run dev:clean` ; ne jamais lancer un second `npm run dev` sans `dev:stop`.

---

## 2026-06 — Migrations Supabase non synchronisées

**Blocage :** Messages flash « migration manquante », dashboard Mon service vide, RPC introuvables en local.

**Cause :** Code à jour (031–037) mais SQL Editor Supabase en retard ; dev et prod sur des schémas différents.

**Résolution :** Appliquer migrations dans l'ordre via [supabase/INSTALL.md](./supabase/INSTALL.md) ; messages F1 explicites dans l'UI.

**Éviter :** Checklist DEMO.md « migrations 001→037 » avant toute démo ; noter la dernière migration appliquée en commentaire Supabase.

---

## 2026-06 — Signup Auth ouvert (Bug #1)

**Blocage :** Comptes BENEVOLE créés par n'importe qui ; parents accédaient à des enfants staff sans validation ASBL.

**Cause :** Trigger `handle_new_user` assignait BENEVOLE par défaut ; migration 011 avait retiré `verified_at` du SELECT parent.

**Résolution :** Migration `029_parent_signup_rls_hardening.sql` — reject signup sauf parent/staff metadata ; restore `my_verified_child_ids()`.

**Éviter :** Staff uniquement via ADMIN + `app_metadata` ; ne jamais « repair » RLS sans policy parallèle.

---

## 2026-06 — Webhook Mollie 401 (Bug #2)

**Blocage :** Paiements Bancontact OK côté Mollie mais adhésion jamais activée en prod.

**Cause :** Code attendait `X-Mollie-Webhook-Secret` — header que Mollie n'envoie pas.

**Résolution :** `buildMollieWebhookUrl()` avec `?secret=` ; `verifyMollieWebhookRequest()` re-fetch via API.

**Éviter :** Lire la doc Mollie avant d'implémenter l'auth webhook ; tester depuis dashboard Mollie post-deploy.

---

## 2026-06 — sync_enrollment_paid uuid vs text (Bug #3)

**Blocage :** Toast « Le paiement simulé n'a pas pu activer l'adhésion » après simulation parent.

**Cause :** RPC comparait `payments.reference_id` (UUID) à `p_membership_id::text` → PostgreSQL 42883.

**Résolution :** Migration `030_fix_sync_enrollment_paid_reference.sql` + fallback TS si 030 pas encore appliquée.

**Éviter :** Tester simulation paiement dans le wizard après chaque changement RPC payments.

---

## 2026-06 — Nav mobile tronquée par rôle

**Blocage :** ADMIN sans lien Activités ; TRAVAILLEUR sans Paiements — découvert en audit #2.

**Cause :** `slice(0,5)` sur une liste nav unique trop longue.

**Résolution :** Listes nav explicites par rôle dans `app/(app)/layout.tsx`.

**Éviter :** Tester nav mobile (DevTools) pour **chaque rôle** après changement layout.

---

## 2026-06 — Tests e2e pointage avec compte ADMIN

**Blocage :** `staff-mon-service.spec.ts` skippé ou échouait — ADMIN ne peut pas accéder à `/mon-service`.

**Cause :** `canClockStaffTime()` exclut ADMIN volontairement (décision phase 0 horaires).

**Résolution :** Helper `E2E_CLOCK_STAFF_EMAIL` + création TRAVAILLEUR via `/equipe/membres`.

**Éviter :** Documenter dans `.env.local.example` ; créer compte travailleur démo avant tests pointage.

---

## 2026-06 — types/database.ts en retard

**Blocage :** ~60 occurrences `as never` ; tables `school_support_*`, `staff_time_*` mal typées.

**Cause :** Migrations 017–036 ajoutées sans `npm run gen:types`.

**Résolution :** En cours — régénérer depuis Supabase CLI quand schéma distant à jour.

**Éviter :** `gen:types` dans la checklist post-migration ; CI warning si tables manquantes.

---

## 2026-06 — Parcours parent sans rollback (dette)

**Blocage :** Enfant orphelin si échec membership après création (audit #2 critique).

**Cause :** Pas de transaction englobant wizard + Server Actions multiples.

**Résolution :** **Non résolu V1** — atténué par RPC sync ; rollback prévu V2.

**Éviter :** Tester wizard BASE + SCHOOL_SUPPORT bout en bout après chaque changement `parent-enrollment.ts`.

---

## Index rapide

| Date | Domaine | Symptôme | Statut |
|------|---------|----------|--------|
| 2026-06 | Dev / CSS | layout.css 404 | ⚠️ Process (dev:clean + règle agent) |
| 2026-06 | Dev / e2e | webpack 6141.js | ✅ Résolu (clean .next) |
| 2026-06 | Supabase | Migrations manquantes | ⚠️ Process (INSTALL.md) |
| 2026-06 | Auth / RLS | Signup BENEVOLE | ✅ Résolu (029) |
| 2026-06 | Paiements | Webhook 401 | ✅ Résolu |
| 2026-06 | Paiements | sync uuid/text | ✅ Résolu (030) |
| 2026-06 | UX mobile | Nav tronquée | ✅ Résolu |
| 2026-06 | E2e | Compte ADMIN pointage | ✅ Résolu (E2E_CLOCK_*) |
| 2026-06 | Types | database.ts retard | ⏳ En cours |
| 2026-06 | Parent | Pas de rollback | ❌ Dette V2 |
