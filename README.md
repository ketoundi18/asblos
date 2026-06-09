# AsblOS

Application web de gestion pour ASBL belges — simple, sécurisée, en français. 

## Prérequis

1. **Node.js 20+** — [https://nodejs.org](https://nodejs.org) (version LTS)
2. Un projet **Supabase** (région Francfort)

## Installation

### 1. Installer les dépendances

```bash
cd ~/Projects/asblos
npm install
```

### 2. Configurer les variables d'environnement

Copie le fichier d'exemple :

```bash
cp .env.local.example .env.local
```

Ouvre `.env.local` et remplis avec tes valeurs Supabase :

```
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta_cle_anon_public
SUPABASE_SERVICE_ROLE_KEY=ta_cle_service_role
```

### 3. Créer la table profiles dans Supabase

1. Va dans **Supabase → SQL Editor**
2. Ouvre le fichier `supabase/migrations/001_profiles.sql`
3. Copie-colle le contenu et clique **Run**

### 4. Créer ton premier compte ADMIN

1. Supabase → **Authentication → Users → Add user**
2. Entre un e-mail et un mot de passe (8 caractères minimum)
3. Coche **Auto Confirm User**
4. Dans **App Metadata** (pas User Metadata), colle :
   ```json
   {"signup_source":"admin","role":"ADMIN"}
   ```
   **`role` doit être une valeur exacte de l'enum** (majuscules, sans faute) :
   `ADMIN` · `TRAVAILLEUR` · `BENEVOLE` · `STAGIAIRE` — sinon le trigger Supabase **échoue** et le compte n'est pas créé.
5. Clique **Create user**

> **Important (migration 029)** : sans `app_metadata.signup_source = "admin"`, la création du compte est **refusée** (protection contre l'inscription publique staff). Les parents passent par `/espace-parents/inscription` uniquement.

6. Vérifie dans **Table Editor → profiles** que le rôle est bien **ADMIN**

### 5. Lancer l'application

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.

## Module 1 — Ce qui fonctionne

- Page de connexion en français
- 4 rôles : ADMIN, TRAVAILLEUR, STAGIAIRE, BENEVOLE
- Protection de toutes les routes (middleware)
- Menu adapté au rôle
- Déconnexion

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Database)
- Zod + Server Actions

