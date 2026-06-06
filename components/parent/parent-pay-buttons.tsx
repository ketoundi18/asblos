"use client";

import type { ReactNode } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { startParentPaymentAction } from "@/lib/actions/parent-payment";
import { Button } from "@/components/ui/button";

function PayButton({
  label,
  variant,
}: {
  label: ReactNode;
  variant: "default" | "outline";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" variant={variant} disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Redirection vers Mollie…
        </>
      ) : (
        label
      )}
    </Button>
  );
}

type Props = {
  childId: string;
  feeLabel: string;
};

export function ParentPayButtons({ childId, feeLabel }: Props) {
  const payBancontact = startParentPaymentAction.bind(null, childId, "BANCONTACT");
  const payCard = startParentPaymentAction.bind(null, childId, "CARD");

  return (
    <div className="space-y-3">
      <p className="text-center text-2xl font-bold">{feeLabel}</p>
      <form action={payBancontact}>
        <PayButton label="Payer avec Bancontact" variant="default" />
      </form>
      <form action={payCard}>
        <PayButton
          label={
            <>
              <CreditCard className="h-4 w-4" />
              Payer par carte bancaire
            </>
          }
          variant="outline"
        />
      </form>
      <p className="text-center text-xs text-muted-foreground">
        Paiement sécurisé via Mollie · Bancontact et cartes acceptées
      </p>
    </div>
  );
}
