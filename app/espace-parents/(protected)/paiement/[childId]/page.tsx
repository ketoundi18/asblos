import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ParentPayButtons } from "@/components/parent/parent-pay-buttons";
import { ParentSimulatePayButton } from "@/components/parent/parent-simulate-pay-button";
import { ParentEnrollmentStepper } from "@/components/parent/parent-enrollment-stepper";
import { buildEnrollmentWizardSteps } from "@/lib/parent/enrollment-wizard-steps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCentsForDisplay,
  isPaymentSimulationEnabled,
} from "@/lib/config/payments";
import { buildEnrollmentQuote } from "@/lib/enrollment/build-enrollment-quote";
import { getChildPaymentContext } from "@/lib/data/parent-payments";
import { getAsblSettingsForCurrentYear } from "@/lib/data/asbl-settings";
import { isMollieConfigured } from "@/lib/mollie/client";

export default async function ParentPaiementPage({
  params,
  searchParams,
}: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ error?: string; detail?: string; wizard?: string }>;
}) {
  const { childId } = await params;
  const { error, detail, wizard } = await searchParams;
  const wizardMode = wizard === "1";
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
  const mollieReady = isMollieConfigured();
  const simulationEnabled = isPaymentSimulationEnabled();
  const { settings } = await getAsblSettingsForCurrentYear();
  const quote =
    plan === "SCHOOL_SUPPORT"
      ? buildEnrollmentQuote("SCHOOL_SUPPORT", settings)
      : buildEnrollmentQuote("BASE", settings);

  // Ancienne erreur Mollie dans l'URL → on nettoie (Mollie n'est plus utilisé en local)
  if (
    simulationEnabled &&
    !mollieReady &&
    (error === "mollie" || detail?.includes("API key") || detail?.includes("Invalid"))
  ) {
    redirect(`/espace-parents/paiement/${childId}`);
  }

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
            Détail du paiement
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

          <p className="text-sm text-muted-foreground">
            Après paiement, l&apos;ASBL validera l&apos;inscription sous 48 h.
          </p>

          {simulationEnabled ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-warning-foreground">
                Mode test (sans Mollie)
              </p>
              <ParentSimulatePayButton childId={childId} wizardMode={wizardMode} />
            </div>
          ) : null}

          {mollieReady ? (
            <div className="space-y-3">
              {simulationEnabled ? (
                <p className="text-center text-xs text-muted-foreground">
                  — ou paiement réel via Mollie —
                </p>
              ) : null}
              <ParentPayButtons childId={childId} feeLabel={feeLabel} />
            </div>
          ) : simulationEnabled ? null : (
            <div className="rounded-md border border-warning-border bg-warning-muted px-4 py-3 text-sm text-warning-foreground">
              Configuration Mollie requise pour Bancontact et carte bancaire.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
