"use client";

import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
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
  bankTransferConfigured: boolean;
};

export function EnrollmentStepPayment({
  childId,
  childName,
  schoolSupportFeeLabel,
  bankTransferConfigured,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          Étape 4 — Cotisation par virement
        </CardTitle>
        <CardDescription>
          Finalisez le paiement pour {childName}.
          {schoolSupportFeeLabel !== "Gratuit" ? ` Total : ${schoolSupportFeeLabel}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!bankTransferConfigured ? (
          <p className="text-sm text-warning-foreground">
            L&apos;ASBL n&apos;a pas encore configuré son IBAN. Contactez l&apos;équipe
            pour finaliser la cotisation.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Vous allez copier l&apos;IBAN et la communication, effectuer le virement,
            puis envoyer une preuve (PDF ou photo). L&apos;ASBL confirme sous 48 h.
          </p>
        )}

        <Button asChild className="w-full" size="lg" disabled={!bankTransferConfigured}>
          <Link href={`/espace-parents/paiement/${childId}?wizard=1`}>
            Payer par virement
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <ParentVerifyPaymentButton childId={childId} />
      </CardContent>
    </Card>
  );
}
