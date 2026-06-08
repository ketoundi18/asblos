"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  parentSignupAction,
} from "@/lib/actions/auth";
import { initialParentSignupState } from "@/lib/actions/auth-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? (
        <>
          <LoadingSpinner />
          Création…
        </>
      ) : (
        "Créer mon compte"
      )}
    </Button>
  );
}

export function ParentSignupForm() {
  const [state, formAction] = useFormState(
    parentSignupAction,
    initialParentSignupState
  );

  if (state.success) {
    return (
      <div className="space-y-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <p className="font-medium">Compte créé !</p>
        {state.needsEmailConfirmation ? (
          <>
            <p>
              Supabase demande une <strong>confirmation par e-mail</strong> avant
              la connexion. Clique le lien reçu, puis reviens ici.
            </p>
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950">
              <p className="font-medium">En développement (recommandé)</p>
              <p className="mt-1 text-xs">
                Supabase → Authentication → Sign In / Providers → Email →
                désactive <strong>Confirm email</strong>, puis recrée un compte
                test ou confirme l&apos;e-mail manuellement dans Users.
              </p>
            </div>
          </>
        ) : (
          <p>
            Tu peux te connecter tout de suite. L&apos;ASBL validera le lien avec
            ton enfant après inscription.
          </p>
        )}
        <Button asChild className="w-full">
          <Link href="/espace-parents/connexion">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nom complet *</Label>
        <Input id="full_name" name="full_name" required />
        {state.fieldErrors.full_name ? (
          <p className="text-sm text-destructive">{state.fieldErrors.full_name}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail *</Label>
        <Input id="email" name="email" type="email" required />
        {state.fieldErrors.email ? (
          <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone *</Label>
        <Input id="phone" name="phone" type="tel" required />
        {state.fieldErrors.phone ? (
          <p className="text-sm text-destructive">{state.fieldErrors.phone}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe *</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
        {state.fieldErrors.password ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password_confirm">Confirmer le mot de passe *</Label>
        <Input id="password_confirm" name="password_confirm" type="password" required />
        {state.fieldErrors.password_confirm ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password_confirm}</p>
        ) : null}
      </div>
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}
      <SubmitButton />
    </form>
  );
}
