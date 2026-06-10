# Installation base de données AsblOS

> Applique les migrations **dans l'ordre** via **Supabase → SQL Editor → New query → Run**.  
> Une migration = un fichier = un Run (sauf indication contraire).

## Nouvelle instance (installation complète)

| # | Fichier | Module |
|---|---------|--------|
| 1 | `001_profiles.sql` | Comptes staff + rôles |
| 2 | `001_profiles_fix.sql` | Correctif profiles (si 001 déjà appliqué sans fix) |
| 3 | `002_fix_missing_profiles.sql` | Profiles orphelins |
| 4 | `003_fix_login.sql` | Connexion |
| 5 | `004_children.sql` | Enfants + tuteurs |
| 6 | `005_activities.sql` | Activités + présences |
| 7 | `006_align_staff_roles.sql` | Rôles staff |
| 8 | `007a_parent_enum.sql` | Enum parent (**avant** 007) |
| 9 | `007_parent_role.sql` | Rôle PARENT |
| 10 | `008_parent_see_linked_children.sql` | RLS parents |
| 11 | `009_parent_links_delete.sql` | Suppression liens parent |
| 12 | `010_parent_enrollment.sql` | Inscription parent |
| 13 | `011_repair_parent_see_children.sql` | Correctif RLS |
| 14 | `012_activity_parent_options.sql` | Visibilité activités |
| 15 | `013_parent_activities_rls.sql` | RLS activités parents |
| 16 | `014_memberships_v2.sql` | Cotisations |
| 17 | `015_payments_purpose.sql` | Paiements |
| 18 | `016_activity_registration_payment.sql` | Inscription activité + paiement |
| 19 | `017_school_support_module.sql` | Soutien scolaire |
| 20 | `018_memberships_backfill.sql` | Données cotisations |
| 21 | `019_memberships_parent_upgrade.sql` | Upgrade parent |
| 22 | `020_school_support_upgrade_rpc.sql` | RPC soutien |
| 23 | `021_enrollment_slots.sql` | Créneaux inscription |
| 24 | `022_memberships_staff_insert.sql` | Staff → adhésions |
| 25 | `023_security_payments_rls.sql` | Sécurité paiements |
| 26 | `024_harden_user_signup.sql` | Inscription durcie |
| 27 | `025_logs_audit.sql` | Journal d'audit |
| 28 | `026_parent_flow_atomic.sql` | Flux parent atomique |
| 29 | `027_security_rpc_hardening.sql` | RPC sécurisées |
| 30 | `028_anonymize_child_rpc.sql` | Anonymisation RGPD |
| 31 | `029_parent_signup_rls_hardening.sql` | RLS inscription parent |
| 32 | `030_fix_sync_enrollment_paid_reference.sql` | Sync paiement cotisation |
| 33 | `031_staff_time_enums_helpers.sql` | Horaires — enums |
| 34 | `032_staff_time_contracts.sql` | Objectifs horaires |
| 35 | `033_staff_time_entries.sql` | Pointages |
| 36 | `034_staff_time_ledger_balances.sql` | Solde + ledger |
| 37 | `035_staff_time_security_fixes.sql` | Sécurité horaires |
| 38 | `036_staff_time_settlement_applied_delta.sql` | Correctif clôture |
| 39 | `037_upsert_staff_contract_rpc.sql` | Upsert contrat atomique (audit H1) |

## Fichiers de réparation (instance existante uniquement)

N'exécute **que si** tu as une erreur précise documentée dans `JOURNAL_DE_BORD.md` :

- `006_repair.sql`
- `011_repair_parent_see_children.sql` (doublon possible avec #13 — vérifie si déjà appliqué)

## Après les migrations

1. Crée un compte **ADMIN** : Supabase → Authentication → Users → Add user  
   App Metadata : `{"signup_source":"admin","role":"ADMIN"}`
2. Lance l'app : `npm run dev`
3. Connecte-toi sur `/connexion`

## Vérification rapide

| Page | Si erreur « module pas disponible » |
|------|-------------------------------------|
| `/enfants` | Migrations 004+ manquantes |
| `/espace-parents` | 007a + 007+ manquantes |
| `/mon-service` | 031–036 manquantes |
| `/equipe/rapport` | 031–036 manquantes |

## Regénérer les types TypeScript

```bash
npm run gen:types
```

(Remplace `lsgppnhyuwcgnpylwepg` dans `package.json` par ton project-id Supabase si différent.)
