"use client";

import { useFormState, useFormStatus } from "react-dom";
import { resetPasswordAction } from "@/lib/actions/password-reset";
import { initialResetPasswordState } from "@/lib/actions/password-reset-state";
import type { PasswordResetChannel } from "@/lib/validations/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type ResetPasswordFormProps = {
  channel: PasswordResetChannel;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? (
        <>
          <LoadingSpinner />
          Enregistrement…
        </>
      ) : (
        "Enregistrer le mot de passe"
      )}
    </Button>
  );
}

export function ResetPasswordForm({ channel }: ResetPasswordFormProps) {
  const [state, formAction] = useFormState(
    resetPasswordAction,
    initialResetPasswordState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="channel" value={channel} />
      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe *</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        {state.fieldErrors.password ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password_confirm">Confirmer *</Label>
        <Input
          id="password_confirm"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        {state.fieldErrors.password_confirm ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password_confirm}</p>
        ) : null}
      </div>

      {state.error ? (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
