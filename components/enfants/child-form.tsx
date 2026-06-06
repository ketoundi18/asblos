"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  CHILD_STATUS_LABELS,
  GUARDIAN_RELATION_LABELS,
} from "@/lib/validations/child";
import type { ChildWithGuardians } from "@/types/child";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FormState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  success?: boolean;
};

type ChildFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initialState: FormState;
  child?: ChildWithGuardians;
  submitLabel: string;
  /** @deprecated Préfère variant="staff" | "parent" */
  showInternalFields?: boolean;
  variant?: "staff" | "parent";
  cancelHref?: string;
  guardianDefaults?: {
    relation?: "MERE" | "PERE" | "TUTEUR" | "AUTRE";
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <LoadingSpinner />
          Enregistrement…
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function FieldError({
  message,
  id,
}: {
  message?: string;
  id: string;
}) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function ChildForm({
  action,
  initialState,
  child,
  submitLabel,
  showInternalFields,
  variant = "staff",
  cancelHref,
  guardianDefaults,
}: ChildFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const isStaff =
    showInternalFields !== undefined ? showInternalFields : variant === "staff";
  const showGuardian = isStaff || variant === "parent";
  const primaryGuardian =
    child?.guardians.find((g) => g.is_primary) ?? child?.guardians[0];
  const guardianRelation =
    primaryGuardian?.relation ?? guardianDefaults?.relation ?? "MERE";
  const guardianFirstName =
    primaryGuardian?.first_name ?? guardianDefaults?.first_name ?? "";
  const guardianLastName =
    primaryGuardian?.last_name ?? guardianDefaults?.last_name ?? "";
  const guardianEmail =
    primaryGuardian?.email ?? guardianDefaults?.email ?? "";
  const guardianPhone =
    primaryGuardian?.phone ?? guardianDefaults?.phone ?? "";
  const backHref =
    cancelHref ?? (child ? `/enfants/${child.id}` : "/enfants");

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
          <CardDescription>Informations de base de l&apos;enfant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                name="first_name"
                defaultValue={child?.first_name}
                required
              />
              <FieldError
                id="first_name-error"
                message={state.fieldErrors.first_name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                name="last_name"
                defaultValue={child?.last_name}
                required
              />
              <FieldError
                id="last_name-error"
                message={state.fieldErrors.last_name}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Date de naissance *</Label>
            <Input
              id="birth_date"
              name="birth_date"
              type="date"
              defaultValue={child?.birth_date}
              required
            />
            <FieldError
              id="birth_date-error"
              message={state.fieldErrors.birth_date}
            />
          </div>
          {isStaff ? (
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <select
                id="status"
                name="status"
                defaultValue={child?.status ?? "ACTIF"}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
              >
                {Object.entries(CHILD_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" name="status" value={child?.status ?? "ACTIF"} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scolarité</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="school_name">École</Label>
            <Input
              id="school_name"
              name="school_name"
              defaultValue={child?.school_name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school_class">Classe</Label>
            <Input
              id="school_class"
              name="school_class"
              placeholder="Ex. 3ème primaire"
              defaultValue={child?.school_class ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Santé &amp; sécurité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              name="allergies"
              placeholder="Ex. arachides, latex…"
              defaultValue={child?.allergies ?? ""}
            />
          </div>
          {isStaff ? (
            <div className="space-y-2">
              <Label htmlFor="medical_notes">Notes médicales (interne)</Label>
              <Textarea
                id="medical_notes"
                name="medical_notes"
                defaultValue={child?.medical_notes ?? ""}
              />
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contact d&apos;urgence</Label>
              <Input
                id="emergency_contact_name"
                name="emergency_contact_name"
                defaultValue={child?.emergency_contact_name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Téléphone urgence</Label>
              <Input
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                type="tel"
                defaultValue={child?.emergency_contact_phone ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autorisations parentales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 rounded-lg border p-3">
            <input
              type="checkbox"
              name="image_rights"
              defaultChecked={child?.image_rights}
              className="h-4 w-4"
            />
            <span className="text-sm">Droit à l&apos;image accordé</span>
          </label>
          {isStaff ? (
            <div className="space-y-2">
              <Label htmlFor="image_rights_date">Date droit à l&apos;image</Label>
              <Input
                id="image_rights_date"
                name="image_rights_date"
                type="date"
                defaultValue={child?.image_rights_date ?? ""}
              />
            </div>
          ) : null}
          <label className="flex items-center gap-3 rounded-lg border p-3">
            <input
              type="checkbox"
              name="outing_authorization"
              defaultChecked={child?.outing_authorization}
              className="h-4 w-4"
            />
            <span className="text-sm">Autorisation de sortie accordée</span>
          </label>
          {isStaff ? (
            <div className="space-y-2">
              <Label htmlFor="outing_auth_date">Date autorisation sortie</Label>
              <Input
                id="outing_auth_date"
                name="outing_auth_date"
                type="date"
                defaultValue={child?.outing_auth_date ?? ""}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {showGuardian ? (
        <Card>
          <CardHeader>
            <CardTitle>Parent / tuteur principal</CardTitle>
            {variant === "parent" ? (
              <CardDescription>Tes coordonnées pour cette inscription</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guardian_relation">Lien de parenté *</Label>
              <select
                id="guardian_relation"
                name="guardian_relation"
                defaultValue={guardianRelation}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
              >
                {Object.entries(GUARDIAN_RELATION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guardian_first_name">Prénom *</Label>
                <Input
                  id="guardian_first_name"
                  name="guardian_first_name"
                  defaultValue={guardianFirstName}
                  required
                />
                <FieldError
                  id="guardian_first_name-error"
                  message={state.fieldErrors.guardian_first_name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_last_name">Nom *</Label>
                <Input
                  id="guardian_last_name"
                  name="guardian_last_name"
                  defaultValue={guardianLastName}
                  required
                />
                <FieldError
                  id="guardian_last_name-error"
                  message={state.fieldErrors.guardian_last_name}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guardian_phone">Téléphone *</Label>
                <Input
                  id="guardian_phone"
                  name="guardian_phone"
                  type="tel"
                  defaultValue={guardianPhone}
                  required
                />
                <FieldError
                  id="guardian_phone-error"
                  message={state.fieldErrors.guardian_phone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_email">E-mail</Label>
                <Input
                  id="guardian_email"
                  name="guardian_email"
                  type="email"
                  defaultValue={guardianEmail}
                />
                <FieldError
                  id="guardian_email-error"
                  message={state.fieldErrors.guardian_email}
                />
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-lg border p-3">
              <input
                type="checkbox"
                name="guardian_can_pickup"
                defaultChecked={primaryGuardian?.can_pickup ?? true}
                className="h-4 w-4"
              />
              <span className="text-sm">Autorisé(e) à récupérer l&apos;enfant</span>
            </label>
          </CardContent>
        </Card>
      ) : null}

      {isStaff ? (
        <Card>
          <CardHeader>
            <CardTitle>Notes internes</CardTitle>
            <CardDescription>Visible uniquement par l&apos;équipe</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={child?.notes ?? ""}
            />
          </CardContent>
        </Card>
      ) : null}

      {state.error ? (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      <SubmitButton label={submitLabel} />

      <Button asChild variant="outline" className="w-full">
        <Link href={backHref}>Annuler</Link>
      </Button>
    </form>
  );
}
