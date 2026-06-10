"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePasswordAction } from "@/lib/actions/change-password";
import { initialChangePasswordState } from "@/lib/actions/auth-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? (
        <>
          <LoadingSpinner />
          Enregistrement…
        </>
      ) : (
        "Enregistrer le nouveau mot de passe"
      )}
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(
    changePasswordAction,
    initialChangePasswordState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mot de passe</CardTitle>
        <CardDescription>
          Choisis un mot de passe personnel que toi seul connais. Indique d&apos;abord
          le mot de passe temporaire reçu de l&apos;admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Mot de passe actuel *</Label>
            <Input
              id="current_password"
              name="current_password"
              type="password"
              required
              autoComplete="current-password"
            />
            {state.fieldErrors.current_password ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.current_password}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">Nouveau mot de passe *</Label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            {state.fieldErrors.new_password ? (
              <p className="text-sm text-destructive">{state.fieldErrors.new_password}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password_confirm">Confirmer le nouveau *</Label>
            <Input
              id="new_password_confirm"
              name="new_password_confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            {state.fieldErrors.new_password_confirm ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.new_password_confirm}
              </p>
            ) : null}
          </div>

          {state.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
