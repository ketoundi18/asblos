import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BankTransferPaymentPanel } from "@/components/parent/bank-transfer-payment-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCentsForDisplay } from "@/lib/config/payments";
import { getAsblSettingsForCurrentYear } from "@/lib/data/asbl-settings";
import { submitActivityBankTransferProofAction } from "@/lib/actions/parent-payment/submit-bank-transfer-proof";
import { ensureBankTransferPayment } from "@/lib/payments/ensure-bank-transfer-payment";
import {
  hasActivityBankConfig,
  resolveActivityBankDetails,
} from "@/lib/payments/resolve-bank-details";
import { requireParentProfileOrRedirect } from "@/lib/payments/parent-payment-guards";
import { createClient } from "@/lib/supabase/server";

export default async function ParentActivityPaiementPage({
  params,
}: {
  params: Promise<{ activityId: string; childId: string }>;
}) {
  const { activityId, childId } = await params;
  const profile = await requireParentProfileOrRedirect();
  const supabase = await createClient();
  const { settings } = await getAsblSettingsForCurrentYear();

  const { data: activity } = await supabase
    .from("activities")
    .select(
      "id, title, price_cents, payment_bank_iban, payment_bank_account_holder, payment_transfer_reference"
    )
    .eq("id", activityId)
    .maybeSingle<{
      id: string;
      title: string;
      price_cents: number;
      payment_bank_iban: string | null;
      payment_bank_account_holder: string | null;
      payment_transfer_reference: string | null;
    }>();

  if (!activity || (activity.price_cents ?? 0) <= 0) {
    notFound();
  }

  const { data: child } = await supabase
    .from("children")
    .select("id, first_name, last_name")
    .eq("id", childId)
    .is("deleted_at", null)
    .maybeSingle<{ id: string; first_name: string; last_name: string }>();

  if (!child) notFound();

  const { data: registration } = await supabase
    .from("activity_registrations")
    .select("id, payment_status")
    .eq("activity_id", activityId)
    .eq("child_id", childId)
    .eq("registered_by", profile.id)
    .maybeSingle<{ id: string; payment_status: string }>();

  if (!registration) {
    redirect(`/espace-parents/activites/${activityId}?error=inscription`);
  }

  if (registration.payment_status === "PAID") {
    redirect(`/espace-parents/activites/${activityId}?success=inscription`);
  }

  const bankDetails = resolveActivityBankDetails(activity, settings);
  const bankReady = hasActivityBankConfig(activity, settings);
  const feeLabel = formatCentsForDisplay(activity.price_cents);

  let proofSubmitted = false;
  let transferReference = bankDetails?.transferReference ?? "";
  let rejectionNote: string | null = null;

  if (bankReady && bankDetails) {
    const prepared = await ensureBankTransferPayment({
      childId,
      parentId: profile.id,
      amountCents: activity.price_cents,
      purpose: "ACTIVITY",
      referenceId: registration.id,
      transferReferenceOverride: bankDetails.transferReference,
    });

    if (prepared.ok) {
      transferReference = prepared.draft.transferReference;
      proofSubmitted = prepared.draft.payment.status === "PROOF_SUBMITTED";
      rejectionNote = prepared.draft.payment.proof_rejection_note;
    }
  }

  const submitAction = submitActivityBankTransferProofAction.bind(
    null,
    activityId,
    childId
  );

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href={`/espace-parents/activites/${activityId}`}>
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;activité
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Paiement par virement</h1>
        <p className="text-muted-foreground">
          {activity.title} — {child.first_name} {child.last_name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Coordonnées bancaires</CardTitle>
        </CardHeader>
        <CardContent>
          {!bankReady || !bankDetails ? (
            <p className="text-sm text-warning-foreground">
              L&apos;ASBL n&apos;a pas encore configuré de compte bancaire.
              Contactez l&apos;équipe.
            </p>
          ) : (
            <BankTransferPaymentPanel
              amountLabel={feeLabel}
              iban={bankDetails.iban}
              accountHolder={bankDetails.accountHolder}
              transferReference={transferReference}
              instructions={bankDetails.instructions}
              proofSubmitted={proofSubmitted}
              rejectionNote={rejectionNote}
              submitAction={submitAction}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
