import { syncMolliePaymentByProviderId } from "@/lib/payments/sync-mollie";

export async function POST(request: Request) {
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

    await syncMolliePaymentByProviderId(molliePaymentId);
    return new Response(null, { status: 200 });
  } catch {
    return new Response("Webhook error", { status: 500 });
  }
}
