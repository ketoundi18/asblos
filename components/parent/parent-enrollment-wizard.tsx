"use client";

import Link from "next/link";
import { ParentEnrollmentStepper } from "@/components/parent/parent-enrollment-stepper";
import { EnrollmentStepChild } from "@/components/parent/enrollment-wizard/enrollment-step-child";
import { EnrollmentStepDays } from "@/components/parent/enrollment-wizard/enrollment-step-days";
import { EnrollmentStepDone } from "@/components/parent/enrollment-wizard/enrollment-step-done";
import { EnrollmentStepFormula } from "@/components/parent/enrollment-wizard/enrollment-step-formula";
import { EnrollmentStepPayment } from "@/components/parent/enrollment-wizard/enrollment-step-payment";
import { useEnrollmentWizard } from "@/components/parent/enrollment-wizard/use-enrollment-wizard";
import type { EnrollmentWizardProps } from "@/components/parent/enrollment-wizard/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ParentEnrollmentWizard(props: EnrollmentWizardProps) {
  const {
    schoolSupportFeeLabel,
    schoolSupportFeeCents,
    openPrograms,
    guardianDefaults,
    mollieReady,
    simulationEnabled,
    initialStep,
    initialChildId,
    initialChildName,
    initialSchoolSupport,
    initialNeedsPayment,
  } = props;

  const wizard = useEnrollmentWizard({
    initialStep,
    initialChildId,
    initialChildName,
    initialSchoolSupport,
    initialNeedsPayment,
  });

  return (
    <div className="space-y-6">
      <ParentEnrollmentStepper steps={wizard.steps} currentKey={wizard.stepKey} />

      {wizard.showEnrollmentForm ? (
        <form
          ref={wizard.formRef}
          action={wizard.enrollAction}
          onSubmit={wizard.stepKey === "formule" ? wizard.validateStep2 : undefined}
          className="space-y-6"
          noValidate
        >
          <div className={cn(wizard.stepKey !== "enfant" && "hidden")}>
            <EnrollmentStepChild
              fieldErrors={wizard.enrollState.fieldErrors}
              error={wizard.stepKey === "enfant" ? wizard.enrollState.error : null}
              onContinue={() => {
                if (wizard.validateStep1()) wizard.setStepKey("formule");
              }}
            />
          </div>

          <div className={cn(wizard.stepKey !== "formule" && "hidden")}>
            <EnrollmentStepFormula
              fieldErrors={wizard.enrollState.fieldErrors}
              error={wizard.enrollState.error}
              guardianDefaults={guardianDefaults}
              openPrograms={openPrograms}
              schoolSupportFeeCents={schoolSupportFeeCents}
              schoolSupportFeeLabel={schoolSupportFeeLabel}
              confirmOpen={wizard.confirmOpen}
              confirmSummary={wizard.confirmSummary}
              onBack={() => wizard.setStepKey("enfant")}
              onOpenConfirm={wizard.openEnrollmentConfirm}
              onConfirmOpenChange={wizard.setConfirmOpen}
              onConfirmEnrollment={wizard.confirmEnrollment}
            />
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link href="/espace-parents">Annuler</Link>
          </Button>
        </form>
      ) : null}

      {wizard.stepKey === "jours" && wizard.childId ? (
        <EnrollmentStepDays
          childId={wizard.childId}
          childName={wizard.childName}
          openPrograms={openPrograms}
          onComplete={wizard.goToPostSlotsStep}
          onSkip={wizard.goToPostSlotsStep}
        />
      ) : null}

      {wizard.stepKey === "paiement" && wizard.childId ? (
        <EnrollmentStepPayment
          childId={wizard.childId}
          childName={wizard.childName}
          schoolSupportFeeLabel={schoolSupportFeeLabel}
          mollieReady={mollieReady}
          simulationEnabled={simulationEnabled}
        />
      ) : null}

      {wizard.stepKey === "termine" ? (
        <EnrollmentStepDone childName={wizard.childName} />
      ) : null}
    </div>
  );
}
