"use client";

import { useFormStatus } from "react-dom";
import { EnrollmentConfirmDialog } from "@/components/parent/enrollment-confirm-dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function EnrollmentConfirmBridge({
  open,
  onOpenChange,
  onConfirm,
  childSummary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  childSummary: string;
}) {
  const { pending } = useFormStatus();
  return (
    <EnrollmentConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      pending={pending}
      childSummary={childSummary}
    />
  );
}

export function EnrollSubmitButton({ onOpenConfirm }: { onOpenConfirm: () => void }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="button"
      size="lg"
      className="w-full sm:flex-1"
      disabled={pending}
      onClick={onOpenConfirm}
    >
      {pending ? (
        <>
          <LoadingSpinner />
          Enregistrement…
        </>
      ) : (
        "Enregistrer et continuer"
      )}
    </Button>
  );
}

export function EnrollmentFormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      {message}
    </div>
  );
}
