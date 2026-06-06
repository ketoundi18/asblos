import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { syncMolliePaymentByInternalId } from "@/lib/payments/sync-mollie";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function applyMembershipPaidFromPayment(paymentId: string) {
  const supabase = await createClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("child_id, reference_id, purpose, status")
    .eq("id", paymentId)
    .maybeSingle<{
      child_id: string;
      reference_id: string | null;
      purpose: string | null;
      status: string;
    }>();

  if (!payment || payment.status !== "PAID") return;

  if (payment.purpose === "MEMBERSHIP" || !payment.purpose) {
    await supabase
      .from("children")
      .update({ enrollment_status: "PAYE_EN_ATTENTE_ASBL" } as never)
      .eq("id", payment.child_id);

    if (payment.reference_id) {
      await supabase
        .from("memberships")
        .update({ status: "AWAITING_ASBL" } as never)
        .eq("id", payment.reference_id)
        .eq("status", "AWAITING_PAYMENT");
    }
  }
}

export default async function ParentPaiementRetourPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  let status: "paid" | "pending" | "failed" | "unknown" = "unknown";

  if (ref) {
    const result = await syncMolliePaymentByInternalId(ref);
    if (result.status === "PAID") {
      status = "paid";
      await applyMembershipPaidFromPayment(ref);
    } else if (result.status === "FAILED") status = "failed";
    else if (result.status === "PENDING") status = "pending";
    revalidatePath("/espace-parents");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          {status === "paid" ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div>
                <p className="text-lg font-semibold">Paiement reçu</p>
                <p className="text-sm text-muted-foreground">
                  Merci ! L&apos;ASBL va valider l&apos;inscription sous peu.
                </p>
              </div>
              <Button asChild>
                <Link href="/espace-parents?success=paiement">Retour — Mes enfants</Link>
              </Button>
            </>
          ) : status === "pending" ? (
            <>
              <Clock className="h-12 w-12 text-amber-500" />
              <div>
                <p className="text-lg font-semibold">Paiement en cours</p>
                <p className="text-sm text-muted-foreground">
                  Bancontact peut prendre quelques minutes. Reviens sur Mes enfants
                  dans un instant.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/espace-parents">Mes enfants</Link>
              </Button>
            </>
          ) : status === "failed" ? (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <div>
                <p className="text-lg font-semibold">Paiement non abouti</p>
                <p className="text-sm text-muted-foreground">
                  Tu peux réessayer depuis Mes enfants.
                </p>
              </div>
              <Button asChild>
                <Link href="/espace-parents">Réessayer</Link>
              </Button>
            </>
          ) : (
            <>
              <Clock className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">Retour du paiement</p>
                <p className="text-sm text-muted-foreground">
                  Consulte Mes enfants pour voir le statut mis à jour.
                </p>
              </div>
              <Button asChild>
                <Link href="/espace-parents">Mes enfants</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
