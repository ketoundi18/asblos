import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ParentPayButtons } from "@/components/parent/parent-pay-buttons";
import { ParentSimulatePayButton } from "@/components/parent/parent-simulate-pay-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCentsForDisplay,
  isPaymentSimulationEnabled,
} from "@/lib/config/payments";
import { getChildPaymentContext } from "@/lib/data/parent-payments";
import { isMollieConfigured } from "@/lib/mollie/client";

export default async function ParentPaiementPage({
  params,
  searchParams,
}: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { childId } = await params;
  const { error, detail } = await searchParams;
  const context = await getChildPaymentContext(childId);

  if (!context) notFound();

  if (
    context.paid_payment ||
    context.membership_status === "AWAITING_ASBL" ||
    context.membership_status === "ACTIVE"
  ) {
    redirect("/espace-parents?success=paiement");
  }

  if (context.fee_cents <= 0 || context.membership_status !== "AWAITING_PAYMENT") {
    redirect("/espace-parents");
  }

  const feeLabel = formatCentsForDisplay(context.fee_cents);
  const mollieReady = isMollieConfigured();
  const simulationEnabled = isPaymentSimulationEnabled();

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
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/espace-parents">
            <ArrowLeft className="h-4 w-4" />
            Mes enfants
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

      {error === "config" && !simulationEnabled ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Mollie n&apos;est pas configuré. Ajoute <code>MOLLIE_API_KEY</code> dans{" "}
          <code>.env.local</code> ou utilise la simulation ci-dessous.
        </div>
      ) : null}

      {error === "simulation" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          La simulation n&apos;est disponible qu&apos;en mode développement local.
        </div>
      ) : null}

      {error === "mollie" || (error && detail?.includes("API key")) ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Clé Mollie invalide ou placeholder dans <code>.env.local</code>. En
          local, utilise le bouton jaune{" "}
          <strong>« Simuler le paiement Bancontact (test) »</strong> — ou supprime{" "}
          <code>MOLLIE_API_KEY</code> puis redémarre le serveur.
        </div>
      ) : null}

      {error && !["config", "simulation", "mollie"].includes(error ?? "") && !detail?.includes("API key") ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Impossible de lancer le paiement.
          {detail ? ` (${decodeURIComponent(detail)})` : null}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Cotisation d&apos;inscription — {feeLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Après paiement, l&apos;ASBL validera l&apos;inscription sous 48 h.
          </p>

          {simulationEnabled ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-amber-800">
                Mode test (sans Mollie)
              </p>
              <ParentSimulatePayButton childId={childId} />
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
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Configuration Mollie requise pour Bancontact et carte bancaire.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
