"use client";

import { useTransition } from "react";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import {
  confirmOfflinePaymentAction,
  getPaymentProofSignedUrlAction,
  rejectOfflinePaymentAction,
} from "@/lib/actions/staff-payment/confirm-offline-payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCentsForDisplay } from "@/lib/config/payments";
import type { StaffPaymentRow } from "@/lib/data/payments-staff";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      Confirmer
    </Button>
  );
}

function RejectButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
      Refuser
    </Button>
  );
}

type Props = {
  payment: StaffPaymentRow;
};

export function StaffPaymentProofCard({ payment }: Props) {
  const [viewPending, startView] = useTransition();
  const confirmAction = confirmOfflinePaymentAction.bind(null, payment.id);
  const rejectAction = rejectOfflinePaymentAction.bind(null, payment.id);

  function openProof() {
    startView(async () => {
      const result = await getPaymentProofSignedUrlAction(payment.id);
      if (result.ok && result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    });
  }

  const purposeLabel =
    payment.purpose === "ACTIVITY" ? "Activité" : "Cotisation";

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-warning-border bg-warning-muted/30 p-4">
      <div className="space-y-1 min-w-0">
        <p className="font-semibold">
          {payment.child_first_name} {payment.child_last_name}
        </p>
        <p className="text-sm text-muted-foreground">
          {payment.parent_name} · {payment.parent_email}
        </p>
        <p className="text-xs text-muted-foreground">
          {purposeLabel} · {formatCentsForDisplay(payment.amount_cents)} ·{" "}
          {payment.transfer_reference ?? "—"}
        </p>
        {payment.proof_original_filename ? (
          <p className="text-xs text-muted-foreground truncate max-w-md">
            Fichier : {payment.proof_original_filename}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={openProof}
          disabled={viewPending || !payment.proof_storage_path}
        >
          {viewPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          Voir la preuve
        </Button>

        <form action={confirmAction}>
          <ConfirmButton />
        </form>

        <form action={rejectAction} className="flex flex-col gap-2">
          <div className="space-y-1">
            <Label htmlFor={`reject-${payment.id}`} className="sr-only">
              Motif du refus (optionnel)
            </Label>
            <Input
              id={`reject-${payment.id}`}
              name="rejection_note"
              placeholder="Motif (optionnel)"
              className="h-8 w-40 text-xs"
            />
          </div>
          <RejectButton />
        </form>
      </div>
    </div>
  );
}
