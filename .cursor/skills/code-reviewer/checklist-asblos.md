# Checklist revue — AsblOS

## Fichiers & structure

- [ ] Lectures dans `lib/data/`, mutations dans `lib/actions/`
- [ ] Pas d'export objet depuis fichier `"use server"` (utiliser `-state.ts`)
- [ ] Types Supabase : pas de contournement `as never` inutile
- [ ] Composants shadcn/ui + tokens Tailwind (`warning`, `success`) — pas de `amber-*` / `green-*` en dur

## Auth & permissions

- [ ] `requireProfile()` / `canManage*` côté serveur
- [ ] PARENT redirigé loin du staff ; staff loin de l'espace parents
- [ ] Parent ne voit que ses enfants (`parent_child_links`, RLS)

## Supabase / SQL

- [ ] Nouvelle migration numérotée dans `supabase/migrations/`
- [ ] `SECURITY DEFINER` : `REVOKE ALL FROM PUBLIC` + grant minimal
- [ ] Enum : script séparé si valeur ajoutée à un type existant
- [ ] Safe to re-run documenté si pertinent

## RGPD

- [ ] Export / anonymisation : admin only
- [ ] Anonymisation via RPC `anonymize_child` (028), pas de multi-update non transactionnel
- [ ] Message clair si migration manquante

## Paiements

- [ ] Simulation : `ALLOW_PAYMENT_SIMULATION` respecté
- [ ] Pas de sync avant statut PAID
- [ ] Webhook Mollie : secret obligatoire en prod

## UI / UX parent

- [ ] Mobile-first, touch targets ≥ 44px
- [ ] Messages erreur/chargement/succès en français humain
- [ ] FAB / barre mobile masqués sur wizard (`/inscrire`, `/paiement`, `/choisir-creneaux`)

## Dev & CI

- [ ] `npm run dev:clean` (pas `dev:reset`)
- [ ] Verrou dev : `.asblos-dev.lock` hors `.next`
- [ ] CI : lint + typecheck + build passent

## PR hygiene

- [ ] Diff focalisé (< ~15 fichiers idéal pour revue débutant)
- [ ] Pas de secrets, pas de `console.log` debug oublié
- [ ] `JOURNAL_DE_BORD.md` si bug corrigé récurrent (optionnel, signaler)
