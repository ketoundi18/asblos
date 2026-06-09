# Checklist UX parent — AsblOS

## Parcours critiques à garder fluides

| Parcours | Étapes | Point de friction connu |
|----------|--------|---------------------------|
| Inscription compte | `/espace-parents/inscription` | E-mail déjà utilisé (admin) |
| Connexion | `/espace-parents/connexion` | E-mail non confirmé Supabase |
| Inscrire enfant | wizard 5 étapes | Paiement, créneaux optionnels |
| Paiement | simulate ou Mollie | Retour `/paiement/retour` |
| Suivi | `/espace-parents` carte sérénité | Lien parent non validé ASBL |

## Écran parent — revue rapide

- [ ] Titre clair (`text-2xl font-bold` ou `text-xl font-semibold`)
- [ ] Sous-texte `text-muted-foreground` qui explique « pourquoi »
- [ ] Un seul bouton bleu principal
- [ ] Bouton « Retour » ou fil d'Ariane si wizard
- [ ] Statut enfant visible sans jargon (Validé / En attente / À payer)

## Mobile (360px)

- [ ] `min-h-11` ou `h-12` sur boutons tactiles
- [ ] FAB + barre bas : padding bas via `ParentContentArea`
- [ ] Pas de hover-only (tout accessible au tap)
- [ ] Texte formulaire ≥ 16px (`text-base` sur inputs parent si doute)

## Messages — bon vs mauvais

| ❌ Mauvais | ✅ Bon |
|-----------|--------|
| `Invalid login credentials` | « E-mail ou mot de passe incorrect. » |
| `EN_ATTENTE_PAIEMENT` | « Cotisation à finaliser » |
| `Error: RLS policy` | « Impossible d'afficher cette fiche. Contactez l'ASBL. » |
| « Cliquez ici » | « Finaliser le paiement » |

## Staff vs parent

- Parent ne voit **jamais** menu staff (`/enfants`, `/paiements` staff).
- Staff ne doit pas être renvoyé vers `/espace-parents` sauf rôle PARENT.

## Test manuel type (2 min)

1. `npm run dev:clean` + Cmd+Shift+R
2. Mode mobile Chrome DevTools (360px)
3. Parcours : connexion parent → Mes enfants → + Inscrire → 1ère étape
4. Vérifier : pas de chevauchement bas d'écran, messages FR
