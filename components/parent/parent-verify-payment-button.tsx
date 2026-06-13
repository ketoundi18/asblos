"use client";

import { Loader2, CheckCircle2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { continueEnrollmentWizardAfterPaymentAction } from "@/lib/actions/parent-payment";
import { Button } from "@/components/ui/button";

function ContinueButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Vérification…
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4" />
          J&apos;ai envoyé ma preuve — continuer
        </>
      )}
    </Button>
  );
}

export function ParentVerifyPaymentButton({ childId }: { childId: string }) {
  const action = continueEnrollmentWizardAfterPaymentAction.bind(null, childId);

  return (
    <form action={action} className="space-y-2">
      <ContinueButton />
      <p className="text-center text-xs text-muted-foreground">
        Cliquez après avoir envoyé votre preuve de virement sur la page paiement.
      </p>
    </form>
  );
}
