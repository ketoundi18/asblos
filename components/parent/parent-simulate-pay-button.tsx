"use client";

import { Loader2, FlaskConical } from "lucide-react";
import { useFormStatus } from "react-dom";
import { simulateParentPaymentAction } from "@/lib/actions/parent-payment";
import { Button } from "@/components/ui/button";

function SimulateButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="secondary"
      size="lg"
      className="w-full border border-dashed border-amber-400 bg-amber-50 text-amber-950 hover:bg-amber-100"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Simulation en cours…
        </>
      ) : (
        <>
          <FlaskConical className="h-4 w-4" />
          Simuler le paiement Bancontact (test)
        </>
      )}
    </Button>
  );
}

export function ParentSimulatePayButton({
  childId,
  wizardMode,
}: {
  childId: string;
  wizardMode?: boolean;
}) {
  const action = simulateParentPaymentAction.bind(null, childId);

  return (
    <form action={action} className="space-y-2">
      {wizardMode ? <input type="hidden" name="wizard_mode" value="1" /> : null}
      <SimulateButton />
      <p className="text-center text-xs text-muted-foreground">
        Mode développement — aucun argent réel. Disparaît en production.
      </p>
    </form>
  );
}
