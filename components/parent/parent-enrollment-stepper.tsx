"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardStep } from "@/lib/parent/enrollment-wizard-steps";

export type { WizardStep };

type Props = {
  steps: WizardStep[];
  currentKey: string;
};

export function ParentEnrollmentStepper({ steps, currentKey }: Props) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === currentKey)
  );
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <nav aria-label="Étapes d'inscription" className="mb-8 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Étape {currentIndex + 1} sur {steps.length}
          </span>
          <span>{steps[currentIndex]?.label}</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progression de l'inscription"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const active = step.key === currentKey;

          return (
            <li key={step.key}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                  active && "bg-primary text-primary-foreground shadow-sm",
                  done && !active && "bg-primary/15 text-primary",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    active && "bg-primary-foreground/20",
                    done && !active && "bg-primary/20",
                    !done && !active && "bg-background"
                  )}
                  aria-hidden
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
