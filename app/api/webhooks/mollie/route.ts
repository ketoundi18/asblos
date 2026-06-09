import { type NextRequest } from "next/server";
import {
  isMollieWebhookNoRetryError,
  parseMollieWebhookPaymentId,
  verifyMollieWebhookRequest,
} from "@/lib/payments/mollie-webhook";
import { syncMolliePaymentByProviderId } from "@/lib/payments/sync-mollie";
import { isMollieConfigured } from "@/lib/mollie/client";

export async function POST(request: NextRequest) {
  if (!verifyMollieWebhookRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isMollieConfigured()) {
    return new Response("Mollie not configured", { status: 503 });
  }

  try {
    const molliePaymentId = await parseMollieWebhookPaymentId(request);

    if (!molliePaymentId) {
      return new Response("Missing or invalid payment id", { status: 400 });
    }

    const result = await syncMolliePaymentByProviderId(molliePaymentId);

    if (!result.ok) {
      if (isMollieWebhookNoRetryError(result.error)) {
        return new Response(null, { status: 200 });
      }
      console.error("[mollie-webhook] sync failed:", result.error);
      return new Response("Sync failed", { status: 422 });
    }

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("[mollie-webhook] unexpected error:", err);
    return new Response("Webhook error", { status: 500 });
  }
}
