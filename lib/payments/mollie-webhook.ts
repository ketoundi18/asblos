import { type NextRequest } from "next/server";

/**
 * URL webhook passée à Mollie à la création du paiement.
 * Mollie envoie POST application/x-www-form-urlencoded avec `id=tr_xxx` uniquement —
 * pas de header custom. Le secret est donc dans l'URL (?secret=).
 */
export function buildMollieWebhookUrl(appUrl: string): string {
  const base = `${appUrl.replace(/\/$/, "")}/api/webhooks/mollie`;
  const secret = process.env.MOLLIE_WEBHOOK_SECRET?.trim();
  if (!secret) return base;
  return `${base}?secret=${encodeURIComponent(secret)}`;
}

/**
 * Vérifie que la requête webhook est autorisée.
 * - Prod → `MOLLIE_WEBHOOK_SECRET` obligatoire + ?secret= (ou headers pour tests curl)
 * - Dev sans secret → ouvert (tests locaux)
 */
export function verifyMollieWebhookRequest(request: NextRequest): boolean {
  const secret = process.env.MOLLIE_WEBHOOK_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !secret) {
    return false;
  }

  if (secret) {
    const querySecret = request.nextUrl.searchParams.get("secret");
    if (querySecret === secret) return true;

    const headerSecret = request.headers.get("x-mollie-webhook-secret");
    if (headerSecret === secret) return true;

    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;

    return false;
  }

  return true;
}

export async function parseMollieWebhookPaymentId(
  request: Request
): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    const id = form.get("id");
    return typeof id === "string" && id.startsWith("tr_") ? id : null;
  }

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { id?: string };
    return typeof body.id === "string" && body.id.startsWith("tr_") ? body.id : null;
  }

  return null;
}

/** Erreurs où Mollie ne doit pas retenter indéfiniment — on répond 200. */
export function isMollieWebhookNoRetryError(error?: string): boolean {
  if (!error) return false;
  return (
    error === "Paiement introuvable en base." ||
    error.includes("No payment exists") ||
    error.includes("not found")
  );
}
