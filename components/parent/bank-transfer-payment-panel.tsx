"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Upload } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIbanForDisplay } from "@/lib/payments/transfer-reference";

function SubmitProofButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending || disabled}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Envoi de la preuve…
        </>
      ) : (
        <>
          <Upload className="h-4 w-4" />
          Envoyer la preuve de virement
        </>
      )}
    </Button>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-sm" />
        <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label={`Copier ${label}`}>
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

type Props = {
  amountLabel: string;
  iban: string;
  accountHolder: string;
  transferReference: string;
  instructions?: string | null;
  proofSubmitted: boolean;
  rejectionNote?: string | null;
  submitAction: (formData: FormData) => void | Promise<void>;
  wizardMode?: boolean;
};

export function BankTransferPaymentPanel({
  amountLabel,
  iban,
  accountHolder,
  transferReference,
  instructions,
  proofSubmitted,
  rejectionNote,
  submitAction,
  wizardMode,
}: Props) {
  const ibanDisplay = formatIbanForDisplay(iban);

  if (proofSubmitted) {
    return (
      <div className="space-y-4 rounded-lg border border-success-border bg-success-muted/40 p-4">
        <p className="font-medium text-success-foreground">Preuve reçue — merci !</p>
        <p className="text-sm text-muted-foreground">
          L&apos;ASBL confirmera votre paiement sous 48 h ouvrées. Vous recevrez une
          notification dès validation.
        </p>
        <p className="text-xs text-muted-foreground">
          Communication utilisée : <span className="font-mono">{transferReference}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">1.</span> Effectuez un virement de{" "}
          <span className="font-semibold text-foreground">{amountLabel}</span>
          {" "}(copiez IBAN et communication ci-dessous).
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">2.</span> Revenez ici et envoyez
          votre preuve (PDF, JPEG ou PNG, max 5 Mo).
        </p>

        <CopyField label="Montant" value={amountLabel} />
        <CopyField label="IBAN" value={ibanDisplay} />
        <CopyField label="Titulaire du compte" value={accountHolder} />
        <CopyField label="Communication (obligatoire)" value={transferReference} />

        {instructions ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{instructions}</p>
        ) : null}
      </div>

      {rejectionNote ? (
        <div className="rounded-md border border-warning-border bg-warning-muted px-4 py-3 text-sm text-warning-foreground">
          <p className="font-medium">Preuve refusée</p>
          <p className="mt-1">{rejectionNote}</p>
          <p className="mt-2 text-xs">Vous pouvez renvoyer une nouvelle preuve ci-dessous.</p>
        </div>
      ) : null}

      <form action={submitAction} className="space-y-4">
        {wizardMode ? <input type="hidden" name="wizard" value="1" /> : null}
        <div className="space-y-2">
          <Label htmlFor="proof">Preuve de virement</Label>
          <Input
            id="proof"
            name="proof"
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            required
          />
          <p className="text-xs text-muted-foreground">
            Capture d&apos;écran de l&apos;application bancaire, PDF ou photo du reçu.
          </p>
        </div>
        <SubmitProofButton />
      </form>
    </div>
  );
}
