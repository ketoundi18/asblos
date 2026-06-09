# Patterns SQL & RLS — AsblOS

## Numérotation migrations connues (ne pas réutiliser)

001 profiles · 004 children · 007/007a parent · 010 enrollment · 023 payments RLS ·
025 audit · 026 parent flow atomic · 027 security RPC hardening · 028 anonymize_child ·
029 signup parent + RLS verified_at

Prochaine libre : **030+**

## Template RPC sensible (RGPD, paiement, enrollment)

```sql
CREATE OR REPLACE FUNCTION public.ma_fonction(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- logique transactionnelle
END;
$$;

REVOKE ALL ON FUNCTION public.ma_fonction(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ma_fonction(UUID) TO service_role;
```

Appeler depuis `createAdminClient().rpc(...)` après vérif rôle serveur.

## RLS — esprit AsblOS

| Acteur | Règle générale |
|--------|----------------|
| Staff | Selon rôle via `get_my_role()` / policies par table |
| Parent | Ses lignes via `parent_child_links` ou `created_by = auth.uid()` |
| Public | Presque rien — auth routes séparées |

Toute nouvelle table avec PII enfant : **RLS obligatoire** + test policy parent vs staff.

## Parent enrollment (026)

- Création enfant parent : RPC atomique `create_parent_enrollment_core`
- Sync paiement : `sync_enrollment_paid` — après statut PAID côté app

## Erreurs RPC → UI

Mapper messages Supabase vers **codes flash** connus de `lib/messages/flash-messages.ts` :

```typescript
function mapError(message: string): string {
  if (message.includes("Could not find the function")) return "migration_required";
  if (message.includes("child_not_anonymizable")) return "already_anonymized";
  return "generic";
}
```

Puis `redirect("/chemin?error=migration_required")` — le toast Sonner est affiché par `FlashToastHandler` (`components/ui/flash-toast-handler.tsx`).

**Ne pas** : bandeau HTML ad hoc, texte d'erreur Supabase brut, ni code inventé absent de `flash-messages.ts` (sinon toast générique « Un petit souci technique »).

## Audit trail

Tables / actions sensibles → `logAuditEvent` :

- `CHILD_CREATED`, `CHILD_VALIDATED`, `CHILD_ANONYMIZED`
- `PAYMENT_*`, changements `ASBL_SETTINGS`

## Tests manuels backend typiques

**Staff ADMIN** : action autorisée → succès ; **BENEVOLE** → refus.

**Parent A** : ne voit/modifie pas enfant de **Parent B** (test IDOR).

**Sans migration** : message clair, pas de faux succès RGPD.
