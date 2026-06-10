/** Erreurs Zod → map pour Server Actions (premier message par champ). */
export type ZodIssueLike = {
  path: (string | number)[];
  message: string;
};

export function mapFieldErrors(issues: ZodIssueLike[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0]);
    if (!fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}

/** Chaîne vide ou espaces → null (insert Supabase). */
export function emptyToNull(value?: string): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}
