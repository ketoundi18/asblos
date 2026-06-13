import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BankTransferPaymentPanel } from "@/components/parent/bank-transfer-payment-panel";
import { ParentEnrollmentStepper } from "@/components/parent/parent-enrollment-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCentsForDisplay } from "@/lib/config/payments";
import { buildEnrollmentQuote } from "@/lib/enrollment/build-enrollment-quote";
import { getChildPaymentContext } from "@/lib/data/parent-payments";
import { getAsblSettingsForCurrentYear } from "@/lib/data/asbl-settings";
import { ensureBankTransferPayment } from "@/lib/payments/ensure-bank-transfer-payment";
import {
  hasMembershipBankConfig,
  resolveMembershipBankDetails,
} from "@/lib/payments/resolve-bank-details";
import { submitMembershipBankTransferProofAction } from "@/lib/actions/parent-payment/submit-bank-transfer-proof";
import { buildEnrollmentWizardSteps } from "@/lib/parent/enrollment-wizard-steps";
import { requireParentProfileOrRedirect } from "@/lib/payments/parent-payment-guards";

export default async function ParentPaiementPage({
  params,
  searchParams,
}: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ error?: string; detail?: string; wizard?: string; success?: string }>;
}) {
  const { childId } = await params;
  const { wizard } = await searchParams;
  const wizardMode = wizard === "1";
  const profile = await requireParentProfileOrRedirect();
  const context = await getChildPaymentContext(childId);

  if (!context) notFound();

  const plan = context.membership_plan ?? "BASE";

  if (context.paid_payment || context.membership_status === "AWAITING_ASBL") {
    if (plan === "SCHOOL_SUPPORT") {
      redirect("/espace-parents?success=paiement");
    }
    redirect("/espace-parents?success=inscription");
  }

  if (context.membership_status === "ACTIVE" && plan === "BASE") {
    redirect("/espace-parents");
  }

  if (context.fee_cents <= 0 || !context.needs_payment) {
    redirect("/espace-parents");
  }

  const feeLabel = formatCentsForDisplay(context.fee_cents);
  const { settings } = await getAsblSettingsForCurrentYear();
  const quote =
    plan === "SCHOOL_SUPPORT"
      ? buildEnrollmentQuote("SCHOOL_SUPPORT", settings)
      : buildEnrollmentQuote("BASE", settings);
  const bankDetails = resolveMembershipBankDetails(settings);
  const bankReady = hasMembershipBankConfig(settings);
  let proofSubmitted = !!context.proof_submitted_payment;

  let transferReference = context.proof_submitted_payment?.transfer_reference ?? "";
  let rejectionNote =
    context.pending_payment?.proof_rejection_note ??
    context.proof_submitted_payment?.proof_rejection_note ??
    null;

  if (bankReady) {
    const prepared = await ensureBankTransferPayment({
      childId,
      parentId: profile.id,
      amountCents: context.fee_cents,
      purpose: "MEMBERSHIP",
      referenceId: context.membership_id,
    });
    if (prepared.ok) {
      transferReference = prepared.draft.transferReference;
      if (prepared.draft.payment.status === "PROOF_SUBMITTED") {
        proofSubmitted = true;
      }
      if (prepared.draft.payment.proof_rejection_note) {
        rejectionNote = prepared.draft.payment.proof_rejection_note;
      }
    }
  }

  const submitAction = submitMembershipBankTransferProofAction.bind(null, childId);

  return (
    <div className="space-y-6">
      {wizardMode ? (
        <ParentEnrollmentStepper
          steps={buildEnrollmentWizardSteps({
            schoolSupport: plan === "SCHOOL_SUPPORT",
            needsPayment: true,
          })}
          currentKey="paiement"
        />
      ) : null}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href={wizardMode ? "/espace-parents/inscrire" : "/espace-parents"}>
            <ArrowLeft className="h-4 w-4" />
            {wizardMode ? "Retour au parcours" : "Mes enfants"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Finaliser l&apos;inscription</h1>
        <p className="text-muted-foreground">
          Paiement pour{" "}
          <span className="font-medium text-foreground">
            {context.first_name} {context.last_name}
          </span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Paiement par virement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-2 text-sm">
            {quote.lines.map((line) => (
              <li key={line.code} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{line.label}</span>
                <span className="font-medium tabular-nums">
                  {line.cents <= 0 ? "Gratuit" : formatCentsForDisplay(line.cents)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold tabular-nums text-primary">{feeLabel}</span>
          </div>

          {!bankReady ? (
            <div className="rounded-md border border-warning-border bg-warning-muted px-4 py-3 text-sm text-warning-foreground">
              L&apos;ASBL n&apos;a pas encore configuré ses coordonnées bancaires. Contactez
              l&apos;équipe pour finaliser le paiement.
            </div>
          ) : bankDetails ? (
            <BankTransferPaymentPanel
              amountLabel={feeLabel}
              iban={bankDetails.iban}
              accountHolder={bankDetails.accountHolder}
              transferReference={transferReference}
              instructions={bankDetails.instructions}
              proofSubmitted={proofSubmitted}
              rejectionNote={rejectionNote}
              submitAction={submitAction}
              wizardMode={wizardMode}
            />
          ) : null}

          <p className="text-sm text-muted-foreground">
            Après validation de votre preuve, l&apos;ASBL confirmera l&apos;inscription sous 48 h.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
