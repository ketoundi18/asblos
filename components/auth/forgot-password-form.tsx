"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordResetAction } from "@/lib/actions/password-reset";
import { initialForgotPasswordState } from "@/lib/actions/password-reset-state";
import type { PasswordResetChannel } from "@/lib/validations/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type ForgotPasswordFormProps = {
  channel: PasswordResetChannel;
  loginHref: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? (
        <>
          <LoadingSpinner />
          Envoi en cours…
        </>
      ) : (
        "Envoyer le lien"
      )}
    </Button>
  );
}

export function ForgotPasswordForm({ channel, loginHref }: ForgotPasswordFormProps) {
  const [state, formAction] = useFormState(
    requestPasswordResetAction,
    initialForgotPasswordState
  );

  if (state.success) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          {state.message}
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href={loginHref}>Retour à la connexion</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="channel" value={channel} />
      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={channel === "staff" ? "prenom@monasbl.be" : "votre@email.com"}
          required
        />
        {state.fieldErrors.email ? (
          <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
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
      <Button asChild variant="ghost" className="w-full">
        <Link href={loginHref}>Retour à la connexion</Link>
      </Button>
    </form>
  );
}
