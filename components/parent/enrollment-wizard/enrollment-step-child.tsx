"use client";

import type { ParentEnrollmentState } from "@/lib/actions/parent-enrollment-state";
import {
  EnrollmentFormError,
  FieldError,
} from "@/components/parent/enrollment-wizard/enrollment-wizard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  fieldErrors: ParentEnrollmentState["fieldErrors"];
  error: string | null;
  onContinue: () => void;
};

export function EnrollmentStepChild({ fieldErrors, error, onContinue }: Props) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Étape 1 — Votre enfant</CardTitle>
          <CardDescription>Identité et informations de base</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom *</Label>
              <Input id="first_name" name="first_name" />
              <FieldError message={fieldErrors.first_name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom *</Label>
              <Input id="last_name" name="last_name" />
              <FieldError message={fieldErrors.last_name} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Date de naissance *</Label>
            <Input id="birth_date" name="birth_date" type="date" />
            <FieldError message={fieldErrors.birth_date} />
          </div>
          <input type="hidden" name="status" value="ACTIF" />
        </CardContent>
      </Card>

      <Card className="mt-6">
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Santé &amp; sécurité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea id="allergies" name="allergies" placeholder="Ex. arachides…" />
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Autorisations</CardTitle>
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

      {error ? (
        <div className="mt-4">
          <EnrollmentFormError message={error} />
        </div>
      ) : null}

      <Button type="button" size="lg" className="mt-6 w-full" onClick={onContinue}>
        Continuer — Formule
      </Button>
    </>
  );
}
