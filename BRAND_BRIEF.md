# Brand Brief — AsblOS

> **Version :** 1.0 — 6 juin 2026  
> **Public cible :** Staff ASBL, bénévoles, parents d'enfants mineurs (Belgique)  
> **Principe directeur :** *Rassurer, simplifier, respecter.*

---

## 1. Mission et valeurs

### Mission (1 phrase)
**AsblOS aide les ASBL belges à prendre soin des enfants avec sérénité — moins de paperasse, plus de présence humaine.**

### Valeurs (3 maximum)

| Valeur | Signification | Justification |
|--------|---------------|---------------|
| **Bienveillance** | Chaque écran doit apaiser, jamais stresser | Parents anxieux, staff surchargé — l'outil ne doit pas ajouter de pression |
| **Clarté** | Une action = un message = un résultat visible | Utilisateurs peu technophiles ; le français simple prime sur le jargon |
| **Confiance** | Données d'enfants protégées, parcours transparents | RGPD et crédibilité institutionnelle sont non négociables |

---

## 2. Ton de voix

### Personnalité
AsblOS parle comme un **éducateur bienveillant et organisé** — pas comme un logiciel d'entreprise, pas comme une app enfantine.

### Principes rédactionnels

| Faire ✅ | Éviter ❌ |
|----------|-----------|
| « Votre inscription est bien enregistrée » | « Transaction successful » |
| « L'équipe valide votre dossier sous 48 h » | « Pending admin approval » |
| « Une question ? Contactez l'ASBL » | Messages d'erreur techniques (stack trace, codes HTTP) |
| Tutoiement **interdit** — vouvoiement systématique | Ton froid, administratif, ou culpabilisant |
| Phrases courtes (≤ 15 mots quand possible) | Listes de 10 étapes d'un coup |

### Exemples par contexte

| Contexte | Ton |
|----------|-----|
| **Succès** | Chaleureux, factuel : « C'est fait. Merci pour votre confiance. » |
| **Attente** | Rassurant : « Tout est en ordre de votre côté. L'ASBL finalise la validation. » |
| **Erreur** | Calme + solution : « Nous n'avons pas pu enregistrer cette information. Réessayez ou contactez l'ASBL. » |
| **Staff terrain** | Direct, actionnable : « 12 présents · 2 absents » |

---

## 3. Palette de couleurs

Couleurs douces, contrastes suffisants (WCAG AA visé), compatibles **shadcn/ui** (variables CSS HSL) et **vieux Android**.

### Couleurs principales

| Rôle | Nom | Hex | HSL (shadcn) | Usage |
|------|-----|-----|--------------|-------|
| **Primaire** | Bleu Sérénité | `#4D91D6` | `210 62% 57%` | Boutons principaux, liens, navigation active |
| **Fond** | Crème Douce | `#FBFAF8` | `40 33% 98%` | Arrière-plan global — chaleur sans blanc agressif |
| **Texte** | Ardoise | `#252A33` | `220 20% 18%` | Corps de texte, titres |

### Couleurs secondaires

| Rôle | Nom | Hex | HSL (shadcn) | Usage |
|------|-----|-----|--------------|-------|
| **Accent positif** | Vert Accompagnement | `#5CAD5C` | `122 39% 55%` | Succès, étapes complétées, badges « Validé » |
| **Secondaire UI** | Bleu Brume | `#EEF3F8` | `210 30% 94%` | Fonds de cartes secondaires, zones info |
| **Muted** | Gris Doux | `#F0EEEA` | `40 20% 94%` | Textes secondaires, séparateurs |
| **Alerte douce** | Ambre Calme | `#D4A054` | `38 55% 58%` | Attente, action requise (pas rouge sauf danger) |
| **Destructif** | Rouge Mesuré | `#DC3D3D` | `0 72% 51%` | Suppression, erreur bloquante uniquement |

### Justifications

- **Bleu primaire** : couleur de confiance institutionnelle, moins froide que le bleu corporate — déjà alignée avec `globals.css` actuel.
- **Crème de fond** : évite le blanc pur (#FFF) qui fatigue sur mobile et paraît « médical ».
- **Vert accent** : progression et réussite sans rivaliser avec le primaire.
- **Ambre pour l'attente** : plus humain qu'un orange vif ou un rouge d'erreur pour « en cours de validation ».

### Couleurs interdites
Neon, rose fluo, violet saturé, noir pur (#000) en fond, dégradés arc-en-ciel.

---

## 4. Typographie

**2 polices Google Fonts maximum** — chargées via `next/font/google`, compatibles Tailwind.

| Rôle | Police | Poids | Justification |
|------|--------|-------|---------------|
| **Titres & UI** | [**Nunito**](https://fonts.google.com/specimen/Nunito) | 600, 700 | Formes arrondies, accueillantes, très lisibles sur mobile |
| **Corps de texte** | [**Source Sans 3**](https://fonts.google.com/specimen/Source+Sans+3) | 400, 500 | Neutre, excellente lisibilité longue durée, support FR complet |

### Échelle typographique (Tailwind)

| Élément | Classe | Taille approx. |
|---------|--------|----------------|
| Titre page (staff) | `text-2xl font-bold` | 24 px |
| Titre page (parent) | `text-xl font-semibold` | 20 px |
| Sous-titre section | `text-sm font-semibold uppercase tracking-wide text-muted-foreground` | 14 px |
| Corps | `text-base` (Source Sans 3) | 16 px minimum |
| Bouton | `text-sm font-medium` | 14 px |
| Légende / aide | `text-sm text-muted-foreground` | 14 px |

**Règle accessibilité :** jamais en dessous de **14 px** pour du texte informatif ; **16 px** pour les paragraphes parents.

---

## 5. Style global et guidelines

### Ambiance visuelle
- **Cards blanches** (`#FFFFFF`) sur fond crème — ombre légère, coins arrondis (`--radius: 0.75rem`).
- **Espacement généreux** : padding minimum 16 px sur mobile, 24 px sur desktop.
- **Icônes** : Lucide (déjà shadcn) — traits fins, taille 20–24 px, couleur `text-muted-foreground` ou `text-primary`.
- **Photos d'enfants** : jamais en placeholder générique souriant — respect du droit à l'image ; avatars initiales si pas d'autorisation.

### Deux espaces, deux rythmes

| Espace | Rythme | Style |
|--------|--------|-------|
| **Staff** (`/`, `/enfants`…) | Efficace, dense mais aéré | Navigation latérale, tableaux, badges statut |
| **Parents** (`/espace-parents/*`) | Lent, rassurant, une action à la fois | Grandes cartes, étapes visuelles (stepper), peu de jargon |

### Composants shadcn/ui — usage

| Composant | Guideline |
|-----------|-----------|
| `Button` | `default` = action principale (1 seul par écran) · `outline` = secondaire · `ghost` = navigation |
| `Card` | Unité de contenu parent ; titre + description + action en bas |
| `Badge` | Statuts uniquement — couleurs sémantiques (vert=ok, ambre=attente, rouge=refus) |
| `Alert` | Erreurs avec titre humain + bouton « Réessayer » ou « Contacter l'ASBL » |
| `Toast` | Confirmations légères (3 s) — jamais pour erreurs critiques |

### Iconographie statuts (parents)

| Statut | Couleur | Message type |
|--------|---------|--------------|
| Fait | Vert accent | « Inscription enregistrée » |
| En cours | Ambre | « En attente de validation par l'ASBL » |
| Action requise | Primaire | « Finaliser le paiement » |
| Bloqué | Muted | « Disponible après validation » |

---

## 6. Trois règles concrètes d'application

### Règle 1 — Un écran, une intention
Chaque page ne propose **qu'une action principale** visible (bouton primaire unique).  
*Exemple parent :* la page paiement = payer. Pas de menu distrayant.  
*Justification :* réduit la charge cognitive des parents non technophiles.

### Règle 2 — Le vert célèbre, l'ambre informe, le rouge protège
- **Vert** = succès confirmé (jamais pour un bouton d'action).
- **Ambre** = patience requise, pas d'erreur.
- **Rouge** = danger réel (suppression, échec bloquant).  
*Justification :* évite l'anxiété des parents qui voient du rouge pour un simple « en attente ».

### Règle 3 — Mobile d'abord, 360 px minimum
Tous les composants doivent être utilisables sur un **Android entrée de gamme** (360 × 640 px) :  
boutons min. 44 px de hauteur, textes 16 px, contrastes testés.  
*Justification :* une large part des parents et bénévoles n'utilisent que leur téléphone.

---

## 7. Alignement avec l'existant

Le fichier `app/globals.css` implémente déjà une base cohérente avec ce brief (bleu sérénité, crème, vert accent).  
Les textes de `lib/parent/serenity.ts` incarnent le ton « bienveillance + clarté » — à généraliser à tout l'espace parent.

### Prochaines étapes branding (hors scope immédiat)
- Charger Nunito + Source Sans 3 via `next/font` (remplacer `system-ui` actuel).
- Documenter les variables CSS dans un commentaire en tête de `globals.css`.
- Favicon + logo AsblOS (initiales ou pictogramme maison + enfant stylisé, traits simples).

---

## Résumé en une ligne

**AsblOS se sent comme un carnet d'ASBL numérique : chaleureux, clair, jamais intimidant — la technologie disparaît derrière la confiance.**
