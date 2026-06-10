import { type NextRequest } from "next/server";
import {
  isMollieWebhookNoRetryError,
  parseMollieWebhookPaymentId,
  verifyMollieWebhookRequest,
} from "@/lib/payments/mollie-webhook";
import { syncMolliePaymentByProviderId } from "@/lib/payments/sync-mollie";
import { isMollieConfigured } from "@/lib/mollie/client";
import { reportError } from "@/lib/monitoring/report-error";
import { getAuditIpHashFromHeaders } from "@/lib/audit/request-ip";

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

    const ipHash = getAuditIpHashFromHeaders(request.headers);
    const result = await syncMolliePaymentByProviderId(molliePaymentId, { ipHash });

    if (!result.ok) {
      if (isMollieWebhookNoRetryError(result.error)) {
        return new Response(null, { status: 200 });
      }
      await reportError(new Error(result.error), {
        surface: "mollie-webhook",
        molliePaymentId,
      });
      return new Response("Sync failed", { status: 422 });
    }

    return new Response(null, { status: 200 });
  } catch (err) {
    await reportError(err, { surface: "mollie-webhook" });
    return new Response("Webhook error", { status: 500 });
  }
}
