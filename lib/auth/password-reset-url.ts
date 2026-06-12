import { getAppUrl } from "@/lib/config/payments";
import type { PasswordResetChannel } from "@/lib/validations/password-reset";

/** URL de callback Supabase après clic sur le lien e-mail (Brevo → Auth). */
export function buildPasswordResetRedirectUrl(channel: PasswordResetChannel): string {
  const next = `/auth/nouveau-mot-de-passe?channel=${channel}`;
  return `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}
