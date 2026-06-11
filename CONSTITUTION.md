# CONSTITUTION — AsblOS

> Règles fondamentales du projet. **Ne changent pas** sans discussion explicite et mise à jour de ce fichier.  
> Dernière révision : 2026-06-06

---

## 1. Mission

**AsblOS** est une application web de gestion pour **ASBL belges** qui accueillent des enfants (accueil extrascolaire, soutien scolaire, activités).

Notre objectif : permettre à une ASBL de gérer **enfants, familles, activités, paiements, équipe et pointage horaire** dans un seul outil — simple, en français, utilisable sur mobile par le staff terrain.

**Produit cible :** vendre / déployer l'app à des ASBL (pas une instance unique pour une seule ASBL). Chaque déploiement = un projet Supabase + une instance Next.js.

**Modules livrés (V1) :**
1. Auth, profils, rôles, enfants
2. Activités, présences, planning
3. Espace parents, inscription wizard
4. Paiements (Mollie), soutien scolaire, audit
5. Équipe, compte de flexibilité horaire (`/mon-service`, `/equipe`)

---

## 2. Valeurs non négociables

| Valeur | Règle concrète |
|--------|----------------|
| **Sécurité des données enfants** | RLS sur toute table avec PII ; jamais de bypass « temporaire » en prod |
| **RGPD** | Soft delete + anonymisation (`anonymized_at`) ; export admin ; audit des actions sensibles |
| **Simplicité utilisateur** | Vouvoiement, français simple, un message clair par action — pas de jargon technique visible |
| **Fiabilité** | Server Actions + Zod avant toute écriture ; états chargement / erreur / succès partout |
| **Transparence staff** | Journal d'audit (`logs_audit`) pour création comptes, pointages, RGPD, paiements |

---

## 3. Principes d'architecture

### Stack verrouillée
- **Next.js 15** App Router · **TypeScript strict** · **Tailwind + shadcn/ui**
- **Supabase** (Auth, PostgreSQL, RLS) · **Zod** + Server Actions
- **Playwright** e2e · **Sentry** optionnel en prod

### Couches applicatives
```
app/(app)/          → pages staff (RSC + loading.tsx)
app/(parent)/       → espace parents isolé
lib/actions/        → mutations (Zod → Supabase → audit)
lib/data/           → lectures (queries typées)
lib/auth/           → permissions.ts = source de vérité des droits UI
supabase/migrations → source de vérité schéma (001 → 046, ordre strict)
```

### Règles de code
1. **Permissions** : toujours `canXxx(role)` dans `lib/auth/permissions.ts` — jamais de `if (role === "ADMIN")` dispersé.
2. **Migrations** : une migration = un fichier numéroté ; appliquer dans l'ordre ([supabase/INSTALL.md](./supabase/INSTALL.md)).
3. **Types** : `types/database.ts` régénéré via `npm run gen:types` après changement schéma.
4. **Messages flash** : toasts via `flash-error-messages.ts` + `?flash=` — pas de messages techniques à l'utilisateur.
5. **Fuseau horaire métier** : `Europe/Brussels` pour pointage et clôtures.

### Agentic Engineering (agents IA / Cursor)
- Lire **CONSTITUTION.md**, **DECISIONS.md**, **LESSONS_LEARNED.md** avant toute modification large.
- Ne pas committer sans **`GO commit`** explicite de l'utilisateur.
- Scope minimal : corriger le problème demandé, pas refactoriser à côté.
- Documenter les frictions dans **FRICTION_LOG.md** et les leçons dans **LESSONS_LEARNED.md**.

---

## 4. Ce qu'on ne fera jamais

| Interdit | Pourquoi |
|----------|----------|
| Signup Auth public pour staff | Créait des comptes BENEVOLE fantômes (bug #1) — staff créé par ADMIN uniquement |
| Désactiver RLS « pour tester » | Données médicales et coordonnées enfants exposées |
| DELETE physique sur `children` / `activities` | Obligations légales + RGPD → soft delete (`deleted_at`) |
| Pointage ADMIN en V1 | Séparation gouvernance / terrain — seuls TRAVAILLEUR, STAGIAIRE, BENEVOLE |
| Tutoiement dans l'UI | Charte [BRAND_BRIEF.md](./BRAND_BRIEF.md) — vouvoiement systématique |
| Couleurs Tailwind brutes (`green-500`, `amber-400`) | Tokens design system (`success`, `warning`, `destructive`) |
| Deux serveurs dev sur port 3000 | Corrompt `.next` → erreurs webpack en e2e |
| Pitch commercial avant checklist [DEMO.md](./DEMO.md) verte | Produit vendable = démo 30 min sans s'excuser |

---

## 5. Definition of Done (toute feature)

- [ ] Permissions staff + RLS Supabase alignées
- [ ] Zod sur inputs · messages flash utilisateur en français
- [ ] `loading.tsx` si page data-heavy
- [ ] Migration SQL numérotée si schéma change
- [ ] Entrée dans **EVOLUTION_SESSIONS.md** en fin de session
- [ ] Test manuel ou e2e sur le parcours critique
- [ ] **`npm run css:check` vert** (layout.css HTTP 200 en dev) — à chaque livraison, pas seulement les changements CSS
