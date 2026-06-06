import createMollieClient, { type MollieClient } from "@mollie/api-client";

import { isPaymentSimulationEnabled } from "@/lib/config/payments";

let client: MollieClient | null = null;

function getMollieApiKey(): string | null {
  const key = process.env.MOLLIE_API_KEY?.trim();
  if (!key) return null;
  if (!key.startsWith("test_") && !key.startsWith("live_")) return null;
  // Ignore les placeholders du type test_xxxxxxxx
  if (key.includes("xxxx") || key.length < 25) return null;
  return key;
}

export function getMollieClient(): MollieClient {
  const apiKey = getMollieApiKey();
  if (!apiKey) {
    throw new Error(
      "MOLLIE_API_KEY invalide ou manquante. En local, utilise la simulation ou ajoute une vraie clé test_ dans .env.local."
    );
  }
  if (!client) {
    client = createMollieClient({ apiKey });
  }
  return client;
}

/** Vrai paiement Mollie — en dev, seulement si ENABLE_MOLLIE=true */
export function isMollieConfigured(): boolean {
  if (!getMollieApiKey()) return false;
  if (isPaymentSimulationEnabled() && process.env.ENABLE_MOLLIE !== "true") {
    return false;
  }
  return true;
}
