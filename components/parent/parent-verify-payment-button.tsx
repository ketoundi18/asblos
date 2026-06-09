"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useFormStatus } from "react-dom";
import { continueEnrollmentWizardAfterPaymentAction } from "@/lib/actions/parent-payment";
import { Button } from "@/components/ui/button";

function VerifyButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Vérification…
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Vérifier si mon paiement Bancontact est confirmé
        </>
      )}
    </Button>
  );
}

export function ParentVerifyPaymentButton({ childId }: { childId: string }) {
  const action = continueEnrollmentWizardAfterPaymentAction.bind(null, childId);

  return (
    <form action={action} className="space-y-2">
      <VerifyButton />
      <p className="text-center text-xs text-muted-foreground">
        Seulement si vous venez de payer sur Mollie dans un autre onglet.
      </p>
    </form>
  );
}
