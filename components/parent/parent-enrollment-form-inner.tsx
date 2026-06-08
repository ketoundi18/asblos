"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { createParentEnrollmentAction } from "@/lib/actions/parent-enrollment";
import { emptyParentEnrollmentState } from "@/lib/actions/parent-enrollment-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { GUARDIAN_RELATION_LABELS } from "@/lib/validations/child";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SchoolSupportEnrollmentSection,
  type OpenSchoolSupportProgram,
} from "@/components/enrollment/school-support-enrollment-section";

type Props = {
  schoolSupportFeeLabel: string;
  schoolSupportFeeCents: number;
  openPrograms: OpenSchoolSupportProgram[];
  guardianDefaults: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <LoadingSpinner />
          Enregistrement…
        </>
      ) : (
        "Valider l'inscription"
      )}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function ParentEnrollmentFormInner({
  schoolSupportFeeLabel,
  schoolSupportFeeCents,
  openPrograms,
  guardianDefaults,
}: Props) {
  const router = useRouter();
  const [state, formAction] = useFormState(
    createParentEnrollmentAction,
    emptyParentEnrollmentState
  );

  useEffect(() => {
    if (state.success && state.childId) {
      if (state.needsPayment) {
        router.push(`/espace-parents/paiement/${state.childId}`);
      } else {
        router.push("/espace-parents?success=inscription");
      }
      router.refresh();
    }
  }, [state.success, state.childId, state.needsPayment, router]);

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
              <Input id="first_name" name="first_name" required />
              <FieldError message={state.fieldErrors.first_name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom *</Label>
              <Input id="last_name" name="last_name" required />
              <FieldError message={state.fieldErrors.last_name} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Date de naissance *</Label>
            <Input id="birth_date" name="birth_date" type="date" required />
            <FieldError message={state.fieldErrors.birth_date} />
          </div>
          <input type="hidden" name="status" value="ACTIF" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scolarité</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="school_name">École</Label>
            <Input id="school_name" name="school_name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school_class">Classe</Label>
            <Input id="school_class" name="school_class" placeholder="Ex. 3ème primaire" />
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
            <Textarea id="allergies" name="allergies" placeholder="Ex. arachides, latex…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contact d&apos;urgence</Label>
              <Input id="emergency_contact_name" name="emergency_contact_name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Téléphone urgence</Label>
              <Input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" />
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
            <input type="checkbox" name="image_rights" className="h-4 w-4" />
            <span className="text-sm">Droit à l&apos;image accordé</span>
          </label>
          <label className="flex items-center gap-3 rounded-lg border p-3">
            <input type="checkbox" name="outing_authorization" className="h-4 w-4" />
            <span className="text-sm">Autorisation de sortie accordée</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parent / tuteur principal</CardTitle>
          <CardDescription>Vos coordonnées pour cette inscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guardian_relation">Lien de parenté *</Label>
            <select
              id="guardian_relation"
              name="guardian_relation"
              defaultValue="MERE"
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
                defaultValue={guardianDefaults.first_name}
                required
              />
              <FieldError message={state.fieldErrors.guardian_first_name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardian_last_name">Nom *</Label>
              <Input
                id="guardian_last_name"
                name="guardian_last_name"
                defaultValue={guardianDefaults.last_name}
                required
              />
              <FieldError message={state.fieldErrors.guardian_last_name} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guardian_phone">Téléphone *</Label>
              <Input
                id="guardian_phone"
                name="guardian_phone"
                type="tel"
                defaultValue={guardianDefaults.phone}
                required
              />
              <FieldError message={state.fieldErrors.guardian_phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardian_email">E-mail</Label>
              <Input
                id="guardian_email"
                name="guardian_email"
                type="email"
                defaultValue={guardianDefaults.email}
              />
              <FieldError message={state.fieldErrors.guardian_email} />
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-lg border p-3">
            <input
              type="checkbox"
              name="guardian_can_pickup"
              defaultChecked
              className="h-4 w-4"
            />
            <span className="text-sm">Autorisé(e) à récupérer l&apos;enfant</span>
          </label>
        </CardContent>
      </Card>

      <SchoolSupportEnrollmentSection
        programs={openPrograms}
        schoolSupportFeeCents={schoolSupportFeeCents}
        schoolSupportFeeLabel={schoolSupportFeeLabel}
      />

      {state.error ? (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      <SubmitButton />

      <Button asChild variant="outline" className="w-full">
        <Link href="/espace-parents">Annuler</Link>
      </Button>
    </form>
  );
}
