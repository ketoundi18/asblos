# Scripts de correction de données prod — jamais commités tels quels.

Les correctifs ponctuels (lien parent manquant, réparation compte, etc.) ne doivent **pas**
rester dans `supabase/migrations/` avec des noms ou e-mails réels.

## Process

1. Copie `link-parent-child.example.sql` vers un fichier local (ex. `fix-2026-06-10.sql`).
2. Remplace les placeholders `{{PARENT_EMAIL}}`, `{{CHILD_FIRST_NAME}}`, etc.
3. Exécute via Supabase SQL Editor ou :
   ```bash
   supabase db execute --file scripts/hotfix/fix-2026-06-10.sql
   ```
4. Note l’action dans l’audit métier si applicable (`logAuditEvent` côté app).
5. **Ne commite pas** le fichier paramétré — seul le template `.example.sql` reste dans git.

## Fichiers ignorés

Tout fichier dans ce dossier sauf `README.md`, `.gitignore` et `*.example.sql`.
