export type WizardStep = {
  key: string;
  label: string;
};

export function buildEnrollmentWizardSteps(input: {
  schoolSupport: boolean;
  needsPayment: boolean;
}): WizardStep[] {
  const steps: WizardStep[] = [
    { key: "enfant", label: "Enfant" },
    { key: "formule", label: "Formule" },
  ];
  if (input.schoolSupport) {
    steps.push({ key: "jours", label: "Jours" });
  }
  if (input.needsPayment) {
    steps.push({ key: "paiement", label: "Paiement" });
  }
  steps.push({ key: "termine", label: "Terminé" });
  return steps;
}
