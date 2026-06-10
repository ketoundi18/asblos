"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createStaffMemberAction } from "@/lib/actions/equipe/create-staff-member";
import { initialCreateStaffMemberState } from "@/lib/actions/equipe-state";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { CreatableStaffRole } from "@/lib/validations/staff-member";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormNativeSelect } from "@/components/ui/form-native-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const ROLE_OPTIONS: CreatableStaffRole[] = ["TRAVAILLEUR", "STAGIAIRE", "BENEVOLE"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? (
        <>
          <LoadingSpinner />
          Création…
        </>
      ) : (
        "Créer le compte"
      )}
    </Button>
  );
}

export function CreateStaffMemberForm() {
  const [state, formAction] = useFormState(
    createStaffMemberAction,
    initialCreateStaffMemberState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ajouter un membre</CardTitle>
        <CardDescription>
          Crée un compte travailleur, stagiaire ou bénévole. Communique le mot de
          passe temporaire — la personne pourra le changer dans{" "}
          <strong>Mon compte</strong> dès sa première connexion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet *</Label>
            <Input id="full_name" name="full_name" required autoComplete="name" />
            {state.fieldErrors.full_name ? (
              <p className="text-sm text-destructive">{state.fieldErrors.full_name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="off"
            />
            {state.fieldErrors.email ? (
              <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <FormNativeSelect
              id="role"
              name="role"
              defaultValue="TRAVAILLEUR"
              options={ROLE_OPTIONS.map((role) => ({
                value: role,
                label: ROLE_LABELS[role],
              }))}
            />
            {state.fieldErrors.role ? (
              <p className="text-sm text-destructive">{state.fieldErrors.role}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe temporaire *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
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
                required
                minLength={8}
                autoComplete="new-password"
              />
              {state.fieldErrors.password_confirm ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.password_confirm}
                </p>
              ) : null}
            </div>
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
