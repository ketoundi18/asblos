---
name: frontend-design-senior
description: >-
  Implements AsblOS UI with Next.js 15, Tailwind, and shadcn/ui: tokens, typography,
  layout, components, accessibility, and mobile-first polish. Use when building or
  styling pages, components, forms, cards, navigation, fixing visual bugs, CSS issues,
  or when the user says design, interface, shadcn, Tailwind, or mise en page.
---

# Frontend Design Senior — AsblOS

Expert UI **AsblOS** : Next.js 15 App Router · Tailwind · shadcn/ui · Lucide.

**Complémentaire** (pas redondant) :
- `ux-pro-max` → parcours, ton, intention utilisateur
- **Ce skill** → implémentation visuelle, tokens, composants, CSS

Lire : `BRAND_BRIEF.md`, `app/globals.css`, `.cursor/rules/asblos-project.mdc`.

## Stack UI (ne pas changer)

| Outil | Usage |
|-------|--------|
| shadcn/ui | `components/ui/*` — Button, Card, Badge, Dialog, Form… |
| Tailwind | Tokens sémantiques — **jamais** `amber-*`, `green-*`, `blue-*` en dur |
| Lucide | Icônes 20–24 px, `aria-hidden` si décoratif |
| Polices | `lib/fonts.ts` — Nunito titres (`font-heading`), Source Sans 3 corps (`font-sans`) |
| `cn()` | `lib/utils` pour classes conditionnelles |

## Tokens couleur (source de vérité)

Variables dans `app/globals.css` — utiliser les classes Tailwind mappées :

| Token | Usage |
|-------|--------|
| `primary` | Action principale, nav active, liens |
| `background` / `foreground` | Fond crème, texte ardoise |
| `card` | Cartes blanches sur fond crème |
| `muted` / `muted-foreground` | Texte secondaire, zones neutres |
| `warning` + `warning-muted` + `warning-border` | Attente, alertes douces |
| `success` + `success-muted` + `success-border` | Succès, étapes faites |
| `destructive` | Danger réel uniquement (suppression, échec bloquant) |

Classes utilitaires projet : `.alert-banner-warning`, `.alert-banner-success`, `.surface-warning`, `.surface-success`.

## Règles visuelles AsblOS

1. **1 bouton `default` par écran** — le reste en `outline` ou `ghost`
2. **Vert = fait · Ambre = patience · Rouge = danger** — pas de rouge pour « en attente »
3. **Mobile 360×640** — boutons `h-11` min (44 px), corps `text-base` côté parent
4. **Cards** : `rounded-xl border bg-card` + padding `p-4` ou `p-6`
5. **Espacement page parent** : `max-w-lg mx-auto px-4` — contenu centré, lisible
6. **Pas de photos enfant génériques** — initiales ou placeholder neutre

## Patterns layout

### Staff
```tsx
// Page staff typique
<div className="space-y-6">
  <h1 className="text-2xl font-bold">Titre</h1>
  <Card>...</Card>
</div>
```

### Parents
```tsx
// Page parent — une colonne, aérée
<div className="space-y-6">
  <div>
    <h1 className="text-xl font-semibold">Titre</h1>
    <p className="text-sm text-muted-foreground">Sous-titre rassurant</p>
  </div>
  <Card>...</Card>
</div>
```

### Nav parent (déjà en place — ne pas réinventer)
- Desktop : `ParentDesktopNav` — `hidden lg:block`, onglets en haut
- Mobile : `ParentMobileNav` — `fixed bottom-0`, `lg:hidden`
- FAB : `ParentInscribeFab` — masqué sur wizard (`lib/parent/parent-mobile-chrome.ts`)
- Padding contenu : `ParentContentArea` — `pb-[calc(6.5rem+env(safe-area-inset-bottom))]` sur mobile

## Composants shadcn — choix rapide

| Besoin | Composant | Variante |
|--------|-----------|----------|
| Action principale | `Button` | `default`, `size="default"` ou `lg` parent |
| Action secondaire | `Button` | `outline` |
| Navigation légère | `Button` | `ghost`, `size="sm"` |
| Bloc contenu | `Card` + `CardHeader` + `CardContent` | — |
| Statut | `Badge` | tokens `warning` / `success` / `secondary` |
| Formulaire | `Form` + `Input` / `Select` / `Textarea` | labels via `Label` |
| Chargement | `LoadingSpinner` | + texte « Chargement… » |
| Erreur réseau | `ErrorRecoveryPanel` | — |
| Modale | `Dialog` | titre FR humain |

## Server vs Client Components

- **Server par défaut** — pas de `"use client"` sans raison
- `"use client"` si : hooks (`useState`, `usePathname`), événements, formulaires interactifs
- Extraire le minimum client (ex. `ParentNavClient`, pas tout le layout)

## Messages succès/erreur

- Redirects globaux → `?success=` / `?error=` + `lib/messages/flash-messages.ts` → toast Sonner
- Erreurs formulaire → inline sous le champ (`FormMessage`)
- **Ne pas** créer de bandeau alerte custom si un toast ou token suffit

## Workflow (avant de coder UI)

1. Lire composants voisins (même espace staff/parent)
2. Réutiliser `components/ui/*` — ne pas recréer un bouton/carte
3. Vérifier tokens (pas de couleur hex en dur dans le JSX)
4. Tester 360 px + desktop `lg`
5. Vérifier :
   ```bash
   npm run typecheck && npm run lint
   ```
   Build seulement si dev arrêté : `CI=true npm run build`

## Anti-patterns UI

- `className="bg-amber-100 text-green-600"` — utiliser `warning-muted`, `success`
- 3+ boutons `default` sur un écran
- `text-xs` pour du texte informatif parent (< 14 px)
- `fixed` sans gérer le padding bas (chevauchement FAB/nav)
- Importer `globals.css` hors `app/layout.tsx` / `global-error.tsx`
- Installer le skill externe `nextlevelbuilder/ui-ux-pro-max` (conflit avec tokens AsblOS)

## Definition of Done UI

- [ ] Tokens sémantiques, pas de couleurs Tailwind brutes
- [ ] 1 CTA primaire visible
- [ ] Mobile 360 px OK (pas de scroll horizontal)
- [ ] États loading / empty / error / success
- [ ] `typecheck` + `lint` OK
- [ ] Cohérent avec `BRAND_BRIEF.md`

## Références

- Checklist composants : [components-checklist.md](components-checklist.md)
- UX parcours & copy : skill `ux-pro-max`
- Backend / actions : skill `backend-asblos`
- Revue PR : skill `code-reviewer`
