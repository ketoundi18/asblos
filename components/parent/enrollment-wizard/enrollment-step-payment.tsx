"use client";

import Link from "next/link";
import { ParentPayButtons } from "@/components/parent/parent-pay-buttons";
import { ParentSimulatePayButton } from "@/components/parent/parent-simulate-pay-button";
import { ParentVerifyPaymentButton } from "@/components/parent/parent-verify-payment-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  childId: string;
  childName: string;
  schoolSupportFeeLabel: string;
  mollieReady: boolean;
  simulationEnabled: boolean;
};

export function EnrollmentStepPayment({
  childId,
  childName,
  schoolSupportFeeLabel,
  mollieReady,
  simulationEnabled,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 4 — Cotisation</CardTitle>
        <CardDescription>
          Finalisez le paiement pour {childName}.
          {schoolSupportFeeLabel !== "Gratuit" ? ` Total : ${schoolSupportFeeLabel}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {simulationEnabled ? <ParentSimulatePayButton childId={childId} wizardMode /> : null}
        {mollieReady ? (
          <ParentPayButtons childId={childId} feeLabel={schoolSupportFeeLabel} />
        ) : null}
        {!simulationEnabled && !mollieReady ? (
          <p className="text-sm text-warning-foreground">
            Paiement en ligne bientôt disponible. Contactez l&apos;ASBL.
          </p>
        ) : null}
        <Button asChild variant="outline" className="w-full">
          <Link href={`/espace-parents/paiement/${childId}?wizard=1`}>
            Ouvrir la page paiement complète
          </Link>
        </Button>
        {mollieReady ? <ParentVerifyPaymentButton childId={childId} /> : null}
      </CardContent>
    </Card>
  );
}
