# Checklist composants — AsblOS

## Avant merge UI

### Tokens & CSS
- [ ] Couleurs via `primary`, `warning`, `success`, `destructive`, `muted` — pas `amber-*` / `green-*`
- [ ] Titres via `font-heading` (Nunito) si h1–h6 dans `globals.css`
- [ ] Corps via `font-sans` (Source Sans 3)
- [ ] Rayons : `rounded-lg`, `rounded-xl`, `rounded-md` — cohérent avec `--radius: 0.75rem`
- [ ] Pas de `style={{ color: '#...' }}` inline

### Boutons
- [ ] 1 seul `variant="default"` visible par écran
- [ ] Hauteur ≥ 44 px (`h-11` default, `h-12` lg)
- [ ] `disabled:opacity-50` respecté — état chargement via texte ou spinner
- [ ] Icône + label : `gap-2`, icône `h-4 w-4` ou `h-5 w-5`

### Cartes & listes
- [ ] `Card` avec `CardHeader` / `CardTitle` / `CardDescription` / `CardContent`
- [ ] Listes parent : puces ou étapes visuelles — pas de tableau dense
- [ ] Staff tableaux : `Table` shadcn avec overflow scroll mobile si besoin

### Formulaires
- [ ] `Label` associé à chaque champ (`htmlFor` / `id`)
- [ ] Erreurs Zod → message FR sous le champ
- [ ] Champs touch-friendly : `Input` hauteur suffisante, `text-base` sur mobile parent
- [ ] Select natif Android : `FormNativeSelect` si liste longue sur vieux téléphones

### Navigation & chrome mobile
- [ ] Parent : barre bas `lg:hidden`, desktop `hidden lg:block`
- [ ] Wizard/paiement/créneaux : pas de FAB ni double nav (`shouldHideParentMobileChrome`)
- [ ] `safe-area-inset-bottom` sur nav fixe iPhone
- [ ] `aria-current="page"` sur lien actif

### Accessibilité
- [ ] Contraste texte/fond ≥ AA (crème + ardoise OK)
- [ ] Boutons icône seuls : `aria-label` en français
- [ ] Focus visible : `focus-visible:ring-2 focus-visible:ring-ring`
- [ ] Pas d'info uniquement par la couleur (ajouter texte ou icône)

### États
- [ ] Loading : `LoadingSpinner` + message
- [ ] Empty : texte + CTA vers prochaine action
- [ ] Succès global : redirect + code flash connu
- [ ] Erreur global : toast ou `ErrorRecoveryPanel`

### Dev CSS
- [ ] Pas de `npm run build` pendant `dev:clean`
- [ ] Si page sans style : `dev:stop` → `dev:clean` → Cmd+Shift+R

## Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `app/globals.css` | Variables CSS + alert banners |
| `tailwind.config.ts` | Mapping tokens |
| `lib/fonts.ts` | Nunito + Source Sans 3 |
| `components/ui/button.tsx` | Variantes boutons (h-11 default) |
| `components/parent/parent-nav.tsx` | Nav desktop/mobile |
| `components/parent/parent-content-area.tsx` | Padding bas mobile |
