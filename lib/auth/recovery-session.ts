import type { SupabaseClient } from "@supabase/supabase-js";

/** Méthodes AMR Supabase après clic sur un lien reset password (PKCE / OTP). */
const RECOVERY_AMR_METHODS = new Set(["otp", "recovery"]);

export function hasPasswordRecoveryAmr(amr: unknown): boolean {
  if (!Array.isArray(amr) || amr.length === 0) return false;

  return amr.some((entry) => {
    if (typeof entry === "string") {
      return RECOVERY_AMR_METHODS.has(entry);
    }
    if (typeof entry === "object" && entry !== null && "method" in entry) {
      return RECOVERY_AMR_METHODS.has(String((entry as { method: string }).method));
    }
    return false;
  });
}

/** true si la session JWT provient du flux e-mail mot de passe oublié (pas une connexion normale). */
export async function isPasswordRecoverySession(
  supabase: SupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return false;
  return hasPasswordRecoveryAmr(data.claims.amr);
}
