"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { SchoolSupportEnrollmentSection } from "@/components/enrollment/school-support-enrollment-section";
import { ChildAuthorizationsSection } from "@/components/enfants/child-form/child-authorizations-section";
import {
  ChildFormError,
  SubmitButton,
} from "@/components/enfants/child-form/child-form-ui";
import { ChildGuardianSection } from "@/components/enfants/child-form/child-guardian-section";
import { ChildHealthSection } from "@/components/enfants/child-form/child-health-section";
import { ChildIdentitySection } from "@/components/enfants/child-form/child-identity-section";
import { ChildInternalNotesSection } from "@/components/enfants/child-form/child-internal-notes-section";
import { ChildSchoolSection } from "@/components/enfants/child-form/child-school-section";
import { resolveGuardianFields } from "@/components/enfants/child-form/resolve-guardian-fields";
import type { ChildFormProps } from "@/components/enfants/child-form/types";
import { Button } from "@/components/ui/button";

export type { ChildFormProps } from "@/components/enfants/child-form/types";

export function ChildForm({
  action,
  initialState,
  child,
  submitLabel,
  showInternalFields,
  variant = "staff",
  cancelHref,
  guardianDefaults,
  enrollment,
}: ChildFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const isStaff =
    showInternalFields !== undefined ? showInternalFields : variant === "staff";
  const showGuardian = isStaff || variant === "parent";
  const guardian = resolveGuardianFields(child, guardianDefaults);
  const backHref = cancelHref ?? (child ? `/enfants/${child.id}` : "/enfants");

  return (
    <form action={formAction} className="space-y-6">
      <ChildIdentitySection
        child={child}
        isStaff={isStaff}
        fieldErrors={state.fieldErrors}
      />
      <ChildSchoolSection child={child} />
      <ChildHealthSection child={child} isStaff={isStaff} />
      <ChildAuthorizationsSection child={child} isStaff={isStaff} />

      {showGuardian ? (
        <ChildGuardianSection
          variant={variant}
          guardian={guardian}
          fieldErrors={state.fieldErrors}
        />
      ) : null}

      {!child && enrollment ? (
        <SchoolSupportEnrollmentSection
          programs={enrollment.programs}
          schoolSupportFeeCents={enrollment.schoolSupportFeeCents}
          schoolSupportFeeLabel={enrollment.schoolSupportFeeLabel}
          mode={enrollment.mode}
        />
      ) : null}

      {isStaff ? <ChildInternalNotesSection child={child} /> : null}

      <ChildFormError message={state.error} />

      <SubmitButton label={submitLabel} />

      <Button asChild variant="outline" className="w-full">
        <Link href={backHref}>Annuler</Link>
      </Button>
    </form>
  );
}
