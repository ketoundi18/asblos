# Inventaire service role (`createAdminClient`)

Le client **service role** contourne toutes les politiques RLS. Il ne doit servir qu’aux opérations système où le JWT utilisateur ne suffit pas.

| Fichier | Usage légitime |
|---------|----------------|
| `lib/audit/log-audit.ts` | Écriture `audit_logs` (pas de policy INSERT client) |
| `lib/payments/sync-mollie.ts` | Webhook Mollie sans session |
| `lib/payments/sync-enrollment-paid.ts` | Mise à jour post-paiement |
| `lib/payments/mark-membership-paid.ts` | Confirmation cotisation (post-Mollie / simulation) |
| `lib/actions/parent-payment/simulate-payment.ts` | Simulation dev/staging |
| `lib/actions/parent-payment/start-mollie-payment.ts` | Création paiement côté serveur |
| `lib/actions/equipe/create-staff-member.ts` | Création compte Auth + profil |
| `lib/actions/equipe/toggle-staff-active.ts` | Désactivation compte Auth |
| `lib/actions/child-gdpr.ts` | Export / anonymisation RGPD |
| `lib/staff-time/settlement.ts` | Règlement heures (batch interne) |
| `lib/enrollment/rollback-parent-enrollment.ts` | Rollback transactionnel inscription parent |
| `lib/membership/apply-school-support-upgrade.ts` | Upgrade adhésion via RPC admin |

## Retiré (GO F — juin 2026)

- ~~`lib/supabase/staff-read.ts`~~ → `getSchoolSupportAdminQueue()` utilise `createClient()` + RLS `profiles_select_staff_full`.

## Règle

N’ajoutez **pas** de nouveau `createAdminClient()` pour de la lecture staff : étendez les policies RLS (`is_staff_full()`, `is_staff_limited()`, etc.) et utilisez `createClient()`.
