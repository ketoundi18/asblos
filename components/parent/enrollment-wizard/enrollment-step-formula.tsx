"use client";

import type { ParentEnrollmentState } from "@/lib/actions/parent-enrollment-state";
import type { OpenSchoolSupportProgram } from "@/components/enrollment/school-support-enrollment-section";
import type { GuardianDefaults } from "@/components/parent/enrollment-wizard/types";
import {
  EnrollSubmitButton,
  EnrollmentConfirmBridge,
  EnrollmentFormError,
  FieldError,
} from "@/components/parent/enrollment-wizard/enrollment-wizard-ui";
import { SchoolSupportEnrollmentSection } from "@/components/enrollment/school-support-enrollment-section";
import { Button } from "@/components/ui/button";
import { FormNativeSelect } from "@/components/ui/form-native-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GUARDIAN_RELATION_LABELS } from "@/lib/validations/child";
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
  guardianDefaults: GuardianDefaults;
  openPrograms: OpenSchoolSupportProgram[];
  schoolSupportFeeCents: number;
  schoolSupportFeeLabel: string;
  confirmOpen: boolean;
  confirmSummary: string;
  onBack: () => void;
  onOpenConfirm: () => void;
  onConfirmOpenChange: (open: boolean) => void;
  onConfirmEnrollment: () => void;
};

export function EnrollmentStepFormula({
  fieldErrors,
  error,
  guardianDefaults,
  openPrograms,
  schoolSupportFeeCents,
  schoolSupportFeeLabel,
  confirmOpen,
  confirmSummary,
  onBack,
  onOpenConfirm,
  onConfirmOpenChange,
  onConfirmEnrollment,
}: Props) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Étape 2 — Parent &amp; formule</CardTitle>
          <CardDescription>Vos coordonnées et type d&apos;inscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guardian_relation">Lien de parenté *</Label>
            <FormNativeSelect
              id="guardian_relation"
              name="guardian_relation"
              defaultValue="MERE"
              options={Object.entries(GUARDIAN_RELATION_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guardian_first_name">Prénom *</Label>
              <Input
                id="guardian_first_name"
                name="guardian_first_name"
                defaultValue={guardianDefaults.first_name}
              />
              <FieldError message={fieldErrors.guardian_first_name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardian_last_name">Nom *</Label>
              <Input
                id="guardian_last_name"
                name="guardian_last_name"
                defaultValue={guardianDefaults.last_name}
              />
              <FieldError message={fieldErrors.guardian_last_name} />
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
              />
              <FieldError message={fieldErrors.guardian_phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardian_email">E-mail</Label>
              <Input
                id="guardian_email"
                name="guardian_email"
                type="email"
                defaultValue={guardianDefaults.email}
              />
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

      <div className="mt-6">
        <SchoolSupportEnrollmentSection
          programs={openPrograms}
          schoolSupportFeeCents={schoolSupportFeeCents}
          schoolSupportFeeLabel={schoolSupportFeeLabel}
        />
      </div>

      {error ? <EnrollmentFormError message={error} /> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="w-full sm:flex-1" onClick={onBack}>
          Retour
        </Button>
        <EnrollSubmitButton onOpenConfirm={onOpenConfirm} />
      </div>

      <EnrollmentConfirmBridge
        open={confirmOpen}
        onOpenChange={onConfirmOpenChange}
        onConfirm={onConfirmEnrollment}
        childSummary={confirmSummary}
      />
    </>
  );
}
