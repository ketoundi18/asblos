/** Clés secrètes Supabase (2025+) — distinctes des JWT legacy service_role. */
export function isSupabaseSecretApiKey(key: string): boolean {
  return key.startsWith("sb_secret_");
}

/**
 * Auth Admin rejette `Authorization: Bearer sb_secret_…` (bad_jwt).
 * PostgREST accepte la clé via `apikey` — on retire Bearer pour /auth/v1/ uniquement.
 */
export function createAdminCompatibleFetch(serviceRoleKey: string): typeof fetch {
  if (!isSupabaseSecretApiKey(serviceRoleKey)) {
    return fetch;
  }

  return async (input, init) => {
    const headers = new Headers(init?.headers);
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (
      url.includes("/auth/v1/") &&
      headers.get("Authorization")?.startsWith("Bearer sb_secret_")
    ) {
      headers.delete("Authorization");
    }

    return fetch(input, { ...init, headers });
  };
}
