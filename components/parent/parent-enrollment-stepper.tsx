"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStep = {
  key: string;
  label: string;
};

type Props = {
  steps: WizardStep[];
  currentKey: string;
};

export function ParentEnrollmentStepper({ steps, currentKey }: Props) {
  const currentIndex = steps.findIndex((s) => s.key === currentKey);

  return (
    <nav aria-label="Étapes d'inscription" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const active = step.key === currentKey;

          return (
            <li key={step.key} className="flex items-center gap-1 sm:gap-2">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors sm:px-3",
                  active && "bg-primary text-primary-foreground",
                  done && !active && "bg-primary/15 text-primary",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    active && "bg-primary-foreground/20",
                    done && !active && "bg-primary/20",
                    !done && !active && "bg-background"
                  )}
                  aria-hidden
                >
                  {done ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span>{step.label}</span>
              </div>
              {index < steps.length - 1 ? (
                <span className="hidden text-muted-foreground/40 sm:inline" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

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
