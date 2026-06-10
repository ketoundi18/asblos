# DECISIONS — Registre des décisions AsblOS

> Décisions structurantes déjà actées. Format : **Date | Décision | Raison | Alternatives rejetées**  
> Dernière mise à jour : 2026-06-06

---

## Stack & infrastructure

| Date | Décision | Raison | Alternatives rejetées |
|------|----------|--------|----------------------|
| 2026-03 | **Next.js 15 App Router** + Server Actions | RSC natif, pas de API REST à maintenir, déploiement Vercel simple | Pages Router + API routes séparées ; Remix |
| 2026-03 | **Supabase** (Auth + Postgres + RLS) | RLS au niveau BDD = défense en profondeur pour données enfants ; Auth intégrée | Firebase (RLS faible) ; Postgres auto-hébergé sans RLS |
| 2026-03 | **Zod** validation côté serveur | Schémas partagés, messages d'erreur contrôlés | Validation manuelle ; Yup |
| 2026-03 | **shadcn/ui + Tailwind** | Composants accessibles, personnalisables, cohérents avec charte | Material UI (look corporate) ; CSS modules seuls |
| 2026-06 | **Playwright** e2e | Parcours parent wizard + smoke démo staff reproductibles | Cypress ; tests manuels seuls |
| 2026-06 | **Sentry** optionnel prod | Monitoring erreurs sans bloquer le dev local | LogRocket ; aucun monitoring |

---

## Rôles & permissions

| Date | Décision | Raison | Alternatives rejetées |
|------|----------|--------|----------------------|
| 2026-03 | **4 rôles staff** : ADMIN, TRAVAILLEUR, BENEVOLE, STAGIAIRE | Reflète la réalité terrain ASBL (direction, salarié, stagiaire, bénévole) | Rôle unique « staff » ; granularité par permission custom |
| 2026-03 | **Rôle PARENT** séparé (5e rôle) | Espace `/espace-parents/*` isolé — pas de mélange staff/parent | Compte parent = staff avec flag |
| 2026-03 | **Accès complet** : ADMIN + TRAVAILLEUR (`isStaffFullAccess`) | Travailleurs gèrent le quotidien ; admin = gouvernance + RGPD | Tout réservé à ADMIN |
| 2026-03 | **Accès limité** : BENEVOLE + STAGIAIRE | Consultation + présences uniquement — pas de paiements ni création enfant | Même droits que travailleur |
| 2026-06 | **Pointage** : TRAVAILLEUR, STAGIAIRE, BENEVOLE — **pas ADMIN** | L'admin gère l'équipe, ne pointe pas son propre temps en V1 | ADMIN peut aussi pointer |
| 2026-06 | **Staff créé par ADMIN** via `/equipe/membres` | Contrôle total ; pas de signup public staff | Invitation email self-service |
| 2026-06 | **Signup parent** via `/espace-parents/inscription` avec `user_metadata.signup_source=parent` | Seul canal parent autorisé (migration 029) | Signup Auth ouvert |

---

## Données & sécurité

| Date | Décision | Raison | Alternatives rejetées |
|------|----------|--------|----------------------|
| 2026-03 | **RLS sur toutes les tables** avec PII enfant | Même si l'app est compromise, Postgres filtre par rôle | Sécurité applicative seule |
| 2026-03 | **Helpers RLS** : `is_active_user()`, `get_my_role()`, `is_staff_full()`, `is_parent()` | Policies lisibles, DRY en SQL | Policies inline dupliquées |
| 2026-03 | **Soft delete** (`deleted_at`) sur `children` et `activities` | Conservation légale + possibilité d'anonymisation RGPD | DELETE CASCADE physique |
| 2026-03 | **Anonymisation** via `anonymized_at` + RPC `anonymize_child` | Effacement RGPD sans perdre l'historique agrégé | Suppression totale avec perte d'audit |
| 2026-06 | **Validation parent-enfant** via `verified_at` sur lien guardian | Parent ne voit l'enfant staff qu'après validation ASBL | Accès immédiat par e-mail guardian |
| 2026-06 | **Audit** table `logs_audit` — lecture ADMIN, écriture service role | Traçabilité RGPD et opérationnelle | Logs stdout seulement |
| 2026-06 | **Webhook Mollie** : secret dans URL `?secret=` + re-fetch API | Mollie n'envoie pas de header Authorization (bug #2) | Header `X-Mollie-Webhook-Secret` |

---

## Métier & UX

| Date | Décision | Raison | Alternatives rejetées |
|------|----------|--------|----------------------|
| 2026-06 | **Wizard inscription parent** 5 étapes (Enfant → Formule → Jours → Paiement → Terminé) | Parcours guidé pour utilisateurs peu technophiles | Formulaire unique long |
| 2026-06 | **Compte de flexibilité horaire** (module `/mon-service`) | Besoin ASBL : objectif journalier, tolérance 5 min, solde ± plafonds | Export Excel manuel des heures |
| 2026-06 | **Clôture soldes** cron 01h00 Europe/Brussels + RPC `settle_staff_time_*` | Recalcul automatique « chaque nuit » — message démo simple | Clôture manuelle admin |
| 2026-06 | **Planning** (`/planning`) ≠ **Mon service** (`/mon-service`) | Planning = activités enfants ; Mon service = heures staff | Fusion en une seule page |
| 2026-06 | **Double modèle** `enrollment_status` + `memberships` (atténué RPC 026/030) | Historique Module 3/4 — unification reportée V2 | Refactor complet avant livraison |
| 2026-06 | **Paiements offline V1** reportés | Mollie + simulation locale suffisants pour démo | Cash + chèque en V1 |

---

## Documentation & process

| Date | Décision | Raison | Alternatives rejetées |
|------|----------|--------|----------------------|
| 2026-06 | **Migrations numérotées** 001→037, ordre strict | Reproductibilité multi-environnements | Schéma push direct Supabase UI |
| 2026-06 | **EVOLUTION_SESSIONS.md** journal fin de session | Mémoire projet pour agents IA et humains | Wiki externe |
| 2026-06 | **Commits sur `GO commit` explicite** | Évite commits non voulus en pair-programming IA | Auto-commit à chaque changement |
| 2026-06 | **Agentic docs** (CONSTITUTION, DECISIONS, LESSONS, FRICTION) | Contexte persistant pour Cursor / agents autonomes | Prompts ad hoc sans mémoire |
