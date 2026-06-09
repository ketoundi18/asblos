---
name: ux-pro-max
description: >-
  Designs and improves AsblOS user experience for parents and staff: mobile-first
  flows, French copy, one-action-per-screen, loading/error/success states, and
  WhatsApp-simple interactions. Use when improving UX, simplifying a flow, parent
  journey, wizard, mobile layout, messages utilisateur, or when the user says UX,
  parcours, confusion, or mobile Android.
---

# UX Pro Max — AsblOS

Objectif : **aussi simple qu'un WhatsApp** pour parents et staff peu technophiles.

Lire aussi : `BRAND_BRIEF.md`, `.cursor/rules/asblos-project.mdc`.

## Deux espaces, deux rythmes

| Espace | Routes | UX |
|--------|--------|-----|
| **Parents** | `/espace-parents/*` | Lent, rassurant, **1 action à la fois**, grandes cibles |
| **Staff** | `/`, `/enfants`, … | Efficace, badges, actions rapides, nav mobile bas |

Ne jamais mélanger les patterns (pas de tableau dense côté parent).

## Les 3 règles d'or

1. **Un écran = une intention** — 1 seul bouton `default` (primaire) visible.
2. **Vert = fait · Ambre = patience · Rouge = danger** — pas de rouge pour « en attente ».
3. **Mobile d'abord (360×640)** — boutons ≥ 44px, texte corps ≥ 16px parent.

## Workflow UX (avant de coder)

1. **Nommer l'utilisateur** : parent anxieux ? staff pressé sur le terrain ?
2. **Définir l'intention** : que doit-il faire en 10 secondes ?
3. **Cartographier** : entrée → étapes → succès → erreurs possibles.
4. **Réduire** : supprimer champs/boutons non essentiels.
5. **États obligatoires** : chargement, vide, erreur, succès — tous avec message FR humain.
6. **Implémenter** : shadcn/ui + tokens (`warning`, `success`) — pas de couleurs en dur.
7. **Tester** : fenêtre 360px ou vieux Android ; `npm run dev:clean` + Cmd+Shift+R.

## Ton de voix (parents)

- **Vouvoiement** systématique — jamais tutoiement.
- Phrases courtes (≤ 15 mots si possible).
- Pas de jargon : « cotisation » pas « transaction », « l'ASBL » pas « admin ».
- Erreur = calme + solution : « Réessayez » ou « Contactez l'ASBL ».

| État | Exemple |
|------|---------|
| Succès | « C'est enregistré. Merci pour votre confiance. » |
| Attente | « Tout est en ordre de votre côté. L'ASBL finalise la validation. » |
| Erreur | « Nous n'avons pas pu enregistrer. Réessayez dans un instant. » |

Réutiliser l'esprit de `lib/parent/serenity.ts` (étapes visuelles, `reassurance`).

## Patterns parent recommandés

| Pattern | Usage |
|---------|--------|
| **Stepper** | Wizard inscription (`parent-enrollment-wizard`) |
| **Carte sérénité** | Suivi enfant — étapes done/current/waiting/locked |
| **Barre mobile bas** | Nav 3 onglets + FAB « Inscrire » (masqués sur wizard) |
| **Card + 1 CTA** | Page paiement, choix créneaux |
| **Alert banner** | `alert-banner-warning` / `alert-banner-success` |

Masquer chrome mobile sur : `/inscrire`, `/paiement`, `/choisir-creneaux` (cf. `lib/parent/parent-mobile-chrome.ts`).

## Patterns staff recommandés

| Pattern | Usage |
|---------|--------|
| **Barre bas mobile** | 5 slots max — `StaffMobileNav` |
| **Badges statut** | `warning` = urgent, `success` = ok |
| **Cartes action** | Dashboard « Ma journée » |

## Checklist états UI (chaque écran)

```
- [ ] Chargement : skeleton ou spinner + texte (« Chargement… »)
- [ ] Vide : illustration légère + prochaine action claire
- [ ] Erreur : message FR + bouton réessayer / retour
- [ ] Succès : confirmation visible (toast Sonner via `?success=` + `flash-messages.ts`)
- [ ] Mobile 360px : pas de scroll horizontal, pas de bouton caché
- [ ] Focus clavier / aria-label sur actions icône seules
```

## Anti-patterns UX

- 3 boutons primaires sur le même écran
- Rouge pour « en attente de validation »
- Messages techniques (`Error 500`, `RLS`, noms de colonnes)
- Formulaire long sans étapes ni progression
- FAB ou barre fixe qui cache le bouton « Valider »
- Tutoiement

## Livrables attendus

Quand tu proposes une amélioration UX, fournir :

1. **Problème** (1 phrase, côté utilisateur)
2. **Solution** (avant / après en mots simples)
3. **Fichiers touchés** (minimal)
4. **Test manuel** (3 clics max décrits)

Demander **GO** explicite avant gros refactor multi-pages.

## Références

- Checklist détaillée : [parent-ux-checklist.md](parent-ux-checklist.md)
- Backend / permissions : skill `backend-asblos`
- Revue avant merge : skill `code-reviewer`
- Messages utilisateur : `lib/messages/flash-messages.ts` + toasts Sonner (pas de texte inventé hors ce fichier)
