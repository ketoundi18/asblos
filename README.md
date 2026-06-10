# AsblOS

Application web de gestion pour ASBL belges — simple, sécurisée, en français.

## Prérequis

1. **Node.js 24+** — [https://nodejs.org](https://nodejs.org) (vérifie avec `node -v`)
2. Un projet **Supabase** (région Francfort recommandée)

## Installation rapide

```bash
cd ~/Projects/asblos
npm install
cp .env.local.example .env.local
# Remplis .env.local avec tes clés Supabase
npm run dev:clean
```

Ouvre [http://localhost:3000](http://localhost:3000).

### Base de données

Applique les migrations SQL dans l'ordre : **[supabase/INSTALL.md](./supabase/INSTALL.md)** (001 → 040).

Crée ensuite un compte **ADMIN** dans Supabase → Authentication → Users, avec App Metadata :

```json
{"signup_source":"admin","role":"ADMIN"}
```

## Modules disponibles

| Module | Routes | Rôles |
|--------|--------|-------|
| Connexion staff | `/connexion` | Tous staff |
| Ma journée | `/` | Staff |
| Enfants | `/enfants` | Staff |
| Activités + présences | `/activites` | Staff |
| Planning | `/planning` | Staff |
| Soutien scolaire | `/soutien-scolaire` | Admin, Travailleur |
| Paiements | `/paiements` | Admin, Travailleur |
| Familles & réglages | `/administration` | Admin |
| Rapports & audit | `/rapports` | Admin |
| Équipe | `/equipe`, `/equipe/membres`, `/equipe/horaires`, `/equipe/rapport` | Admin |
| Mon service (pointage) | `/mon-service` | Travailleur, Stagiaire, Bénévole |
| Espace parents | `/espace-parents` | Parents |
| Mon compte | `/mon-compte` | Tous |

## Présenter à une ASBL

Checklist et scénario 30 min : **[DEMO.md](./DEMO.md)**

## Tests

```bash
npm run css:check
npm run typecheck
npm run lint
npm run test          # Vitest (logique métier)
npm run test:e2e -- e2e/demo-smoke.spec.ts
```

Variables e2e : voir `.env.local.example` (`E2E_STAFF_EMAIL`, `E2E_PARENT_EMAIL`, `E2E_CLOCK_STAFF_EMAIL` pour `/mon-service`, …).

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Database + RLS)
- Zod + Server Actions
- Playwright (e2e)
- Sentry (prod, optionnel)

## Documentation projet

| Fichier | Contenu |
|---------|---------|
| [CONSTITUTION.md](./CONSTITUTION.md) | Règles fondamentales (mission, limites, DoD) |
| [DECISIONS.md](./DECISIONS.md) | Registre des décisions architecture |
| [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) | Apprentissages & patterns à éviter |
| [FRICTION_LOG.md](./FRICTION_LOG.md) | Journal des blocages et résolutions |
| [DEMO.md](./DEMO.md) | Parcours démo vendable |
| [supabase/INSTALL.md](./supabase/INSTALL.md) | Migrations SQL ordonnées |
| [DATA_DICTIONARY.md](./DATA_DICTIONARY.md) | Schéma données |
| [BRAND_BRIEF.md](./BRAND_BRIEF.md) | Charte visuelle |
| [JOURNAL_DE_BORD.md](./JOURNAL_DE_BORD.md) | Bugs & correctifs |
| [EVOLUTION_SESSIONS.md](./EVOLUTION_SESSIONS.md) | Historique des livraisons |

## Scripts utiles

```bash
npm run dev:clean    # Un seul serveur, cache .next vidé
npm run dev:stop     # Arrête le serveur local
npm run gen:types    # Regénère types/database.ts depuis Supabase
```
