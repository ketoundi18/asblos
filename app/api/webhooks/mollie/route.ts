import { syncMolliePaymentByProviderId } from "@/lib/payments/sync-mollie";

function isWebhookAuthorized(request: Request): boolean {
  const secret = process.env.MOLLIE_WEBHOOK_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    return !isProduction;
  }

  const headerSecret = request.headers.get("x-mollie-webhook-secret");
  if (headerSecret === secret) {
    return true;
  }

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isWebhookAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    let molliePaymentId: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      const id = form.get("id");
      if (typeof id === "string") molliePaymentId = id;
    } else {
      const body = (await request.json()) as { id?: string };
      if (body.id) molliePaymentId = body.id;
    }

    if (!molliePaymentId) {
      return new Response("Missing payment id", { status: 400 });
    }

    const result = await syncMolliePaymentByProviderId(molliePaymentId);
    if (!result.ok) {
      return new Response("Sync failed", { status: 422 });
    }

    return new Response(null, { status: 200 });
  } catch {
    return new Response("Webhook error", { status: 500 });
  }
}
