---
name: backend-asblos
description: >-
  Implements and reviews AsblOS backend logic: Server Actions, Supabase RLS,
  SQL migrations, RPC, payments, RGPD, and parent/staff authorization. Use when
  adding or fixing server-side code, database migrations, RLS policies, Supabase
  RPC, lib/actions, lib/data, or when the user says backend, SQL, RLS, or
  Server Action.
---

# Backend — AsblOS

Expert backend pour Next.js 15 + Supabase. Expliquer au user en **français simple** ce que tu fais.

## Architecture (ne pas inventer)

| Couche | Emplacement | Rôle |
|--------|-------------|------|
| Lectures | `lib/data/` | Server Components, pas de mutation |
| Mutations | `lib/actions/` | `"use server"`, formulaires, redirects |
| États formulaire | `lib/actions/*-state.ts` | Jamais d'objet exporté depuis `"use server"` |
| Validation | `lib/validations/` | Zod |
| Permissions | `lib/auth/permissions.ts` | `can*` par rôle — **toujours** côté serveur |
| Session | `lib/auth/session.ts` | `requireProfile()`, `getCurrentProfile()` |
| Admin DB | `lib/supabase/admin.ts` | `createAdminClient()` — service_role, serveur uniquement |
| User DB | `lib/supabase/server.ts` | `createClient()` — respecte RLS |
| Audit | `lib/audit/log-audit.ts` | Flux sensibles (RGPD, paiement, validation) |
| SQL | `supabase/migrations/NNN_*.sql` | Numéroté, safe to re-run si possible |

## Workflow obligatoire (nouvelle feature backend)

1. **Lire** `.cursor/rules/asblos-project.mdc` + fichiers voisins (même domaine).
2. **Autorisation** : `requireProfile()` puis `can*(role)` ou `isParentRole` / `isStaffRole`.
3. **Scope parent** : un parent ne touche **que** ses enfants (`parent_child_links`, `created_by`).
4. **Validation** : Zod sur toute entrée utilisateur.
5. **Implémenter** : lecture `lib/data/`, écriture `lib/actions/`.
6. **SQL si besoin** : migration numérotée + types `types/database.ts` si RPC/table nouvelle.
7. **Messages** : erreurs en français humain (`redirect(?error=...)`, flash, ou return state).
8. **Vérifier** :
   ```bash
   npm run typecheck && npm run lint && CI=true npm run build
   ```
9. **Test manuel** : 3 étapes staff et/ou parent selon le flux.

## Règles de sécurité (non négociables)

- **Jamais** faire confiance à l'UI ou au rôle affiché — vérifier côté serveur.
- **Jamais** `createAdminClient()` pour contourner RLS sans raison (RGPD, webhook, tâche système).
- **Jamais** exposer `SUPABASE_SERVICE_ROLE_KEY` côté client.
- **Parent** : pas d'accès staff ; vérifier `childId` appartient au parent avant mutation.
- **Paiements** : ordre **PAID → sync** ; pas de sync avant statut payé (cf. `lib/actions/parent-payment.ts`).
- **RGPD** : anonymisation via RPC `anonymize_child` (028) uniquement — pas de fallback multi-update.
- **RPC `SECURITY DEFINER`** :
  ```sql
  REVOKE ALL ON FUNCTION public.ma_fonction(...) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.ma_fonction(...) TO service_role;
  ```
- **Nouvelle table** : `ENABLE ROW LEVEL SECURITY` + policies explicites.

## Patterns Server Action

```typescript
"use server";

import { requireProfile } from "@/lib/auth/session";
import { canManageChildren } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function exampleAction(id: string) {
  const profile = await requireProfile();
  if (!canManageChildren(profile.role)) {
    redirect("/enfants?error=permission");
  }
  // ... mutation ...
  revalidatePath("/enfants");
  redirect("/enfants?success=done");
}
```

- Préférer `redirect` + query `?error=` / `?success=` pour flux staff/parent simples.
- `logAuditEvent()` pour : création/validation enfant, paiement, RGPD, changements admin.

## Patterns migration SQL

1. Fichier : `supabase/migrations/029_description.sql`
2. En-tête : prérequis, safe to re-run si applicable
3. Enum nouveau → migration séparée `*a_*` avant usage (convention projet 007a)
4. Après merge : rappeler au user d'exécuter dans **Supabase SQL Editor**
5. Mettre à jour `types/database.ts` (manuel ou `npm run gen:types` si CLI configurée)

## Clients Supabase — quand utiliser quoi

| Client | Quand |
|--------|-------|
| `createClient()` | Lecture/écriture utilisateur sous RLS |
| `createAdminClient()` | RPC service_role, audit cross-user, webhook, RGPD admin |

## Paiements & config

- Simulation : `ALLOW_PAYMENT_SIMULATION` / `lib/config/payments.ts`
- Mollie : `lib/mollie/`, webhook `app/api/webhooks/mollie/route.ts`
- `MOLLIE_WEBHOOK_SECRET` obligatoire en production

## Definition of Done backend

- [ ] Permission serveur vérifiée
- [ ] RLS ou RPC justifié si admin client
- [ ] Zod sur inputs
- [ ] Erreurs FR claires
- [ ] typecheck + lint + build OK
- [ ] Migration documentée si SQL
- [ ] Test manuel 3 étapes décrit au user

## Anti-patterns

- SQL manuel demandé aux users en prod (tout via l'app)
- Plusieurs sujets dans une PR (séparer sécurité / feature / dev)
- `as never` pour masquer un typage — typer depuis `types/database.ts`
- Fallback non transactionnel pour données RGPD

## Références

- Checklist SQL/RLS : [sql-rls-patterns.md](sql-rls-patterns.md)
- Revue avant merge : skill `code-reviewer`
