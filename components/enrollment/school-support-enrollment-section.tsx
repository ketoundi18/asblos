"use client";

import { useMemo, useState } from "react";
import {
  buildEnrollmentQuote,
  type EnrollmentQuoteLine,
} from "@/lib/asbl/fee-utils";
import { formatCentsForDisplay } from "@/lib/config/payments";
import type { MembershipPlan } from "@/types/school-support";
import { formatSlotSchedule, type SchoolSupportSlot } from "@/types/school-support";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type OpenSchoolSupportProgram = {
  id: string;
  title: string;
  description: string | null;
  slots: SchoolSupportSlot[];
};

type Props = {
  programs: OpenSchoolSupportProgram[];
  schoolSupportFeeCents: number;
  schoolSupportFeeLabel: string;
  /** parent = espace parents ; staff = fiche enfant créée par l'équipe */
  mode?: "parent" | "staff";
};

function formatFeeLabel(cents: number): string {
  if (cents <= 0) return "Gratuit";
  return formatCentsForDisplay(cents);
}

function QuoteRecap({ lines, totalCents }: { lines: EnrollmentQuoteLine[]; totalCents: number }) {
  const totalLabel = formatFeeLabel(totalCents);

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <p className="text-sm font-medium">Récapitulatif</p>
      <ul className="space-y-2 text-sm">
        {lines.map((line) => (
          <li key={line.code} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{line.label}</span>
            <span className="font-medium tabular-nums">
              {formatFeeLabel(line.cents)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t pt-3">
        <span className="font-semibold">Total à payer</span>
        <span className="text-lg font-bold tabular-nums text-primary">{totalLabel}</span>
      </div>
    </div>
  );
}

export function SchoolSupportEnrollmentSection({
  programs,
  schoolSupportFeeCents,
  schoolSupportFeeLabel,
  mode = "parent",
}: Props) {
  const [plan, setPlan] = useState<MembershipPlan>("BASE");
  const defaultProgramId = programs.length === 1 ? programs[0].id : "";
  const [programId, setProgramId] = useState(defaultProgramId);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  const selectedProgram = programs.find((p) => p.id === programId) ?? null;

  const quote = useMemo(
    () =>
      buildEnrollmentQuote(plan, {
        id: "",
        school_year: "",
        enrollment_fee_cents: 0,
        school_support_fee_cents: schoolSupportFeeCents,
        currency: "EUR",
      }),
    [plan, schoolSupportFeeCents]
  );

  function toggleSlot(slotId: string) {
    setSelectedSlotIds((current) =>
      current.includes(slotId)
        ? current.filter((id) => id !== slotId)
        : [...current, slotId]
    );
  }

  function handlePlanChange(nextPlan: MembershipPlan) {
    setPlan(nextPlan);
    if (nextPlan === "BASE") {
      setSelectedSlotIds([]);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Type d&apos;inscription</CardTitle>
        <CardDescription>
          {mode === "staff"
            ? "Choisissez l'inscription simple ou le soutien scolaire pour cet enfant."
            : "Choisissez l'inscription simple ou le soutien scolaire avec cotisation annuelle."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <label
            className={cn(
              "flex cursor-pointer gap-3 rounded-lg border p-4",
              plan === "BASE" && "border-primary bg-primary/5"
            )}
          >
            <input
              type="radio"
              name="membership_plan"
              value="BASE"
              checked={plan === "BASE"}
              onChange={() => handlePlanChange("BASE")}
              className="mt-1"
            />
            <div>
              <p className="font-medium">Inscription simple à l&apos;ASBL</p>
              <p className="text-sm text-muted-foreground">
                Gratuite — vous pourrez ajouter le soutien scolaire plus tard.
              </p>
            </div>
          </label>

          <label
            className={cn(
              "flex cursor-pointer gap-3 rounded-lg border p-4",
              plan === "SCHOOL_SUPPORT" && "border-primary bg-primary/5"
            )}
          >
            <input
              type="radio"
              name="membership_plan"
              value="SCHOOL_SUPPORT"
              checked={plan === "SCHOOL_SUPPORT"}
              onChange={() => handlePlanChange("SCHOOL_SUPPORT")}
              className="mt-1"
            />
            <div>
              <p className="font-medium">Inscription + soutien scolaire</p>
              <p className="text-sm text-muted-foreground">
                Cotisation annuelle{" "}
                {schoolSupportFeeLabel !== "Gratuit"
                  ? `: ${schoolSupportFeeLabel}`
                  : "— gratuite cette année"}
                . Accès au soutien après validation par l&apos;ASBL.
              </p>
            </div>
          </label>
        </div>

        {plan === "SCHOOL_SUPPORT" && programs.length > 0 ? (
          <div className="space-y-4 rounded-lg border border-dashed p-4">
            {programs.length > 1 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Programme</p>
                <select
                  name="school_support_program_id"
                  value={programId}
                  onChange={(e) => {
                    setProgramId(e.target.value);
                    setSelectedSlotIds([]);
                  }}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                  required
                >
                  <option value="" disabled>
                    Choisissez un programme
                  </option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <input type="hidden" name="school_support_program_id" value={programs[0].id} />
            )}

            {selectedProgram ? (
              <>
                <div>
                  <p className="text-sm font-medium">{selectedProgram.title}</p>
                  {selectedProgram.description ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedProgram.description}
                    </p>
                  ) : null}
                </div>

                {selectedProgram.slots.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Jours souhaités{" "}
                      <span className="font-normal text-muted-foreground">(optionnel)</span>
                    </p>
                    <div className="space-y-2">
                      {selectedProgram.slots.map((slot) => {
                        const checked = selectedSlotIds.includes(slot.id);
                        return (
                          <label
                            key={slot.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                              checked && "border-primary bg-primary/5"
                            )}
                          >
                            <input
                              type="checkbox"
                              name="school_support_slot_ids"
                              value={slot.id}
                              checked={checked}
                              onChange={() => toggleSlot(slot.id)}
                              className="mt-1 h-4 w-4"
                            />
                            <span className="text-sm">{formatSlotSchedule(slot)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    L&apos;ASBL précisera les horaires avec vous.
                  </p>
                )}
              </>
            ) : programs.length > 1 ? (
              <p className="text-sm text-muted-foreground">
                Sélectionnez un programme pour voir les créneaux disponibles.
              </p>
            ) : null}
          </div>
        ) : plan === "SCHOOL_SUPPORT" && programs.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-3">
            Aucun programme ouvert pour le moment. Votre demande de soutien scolaire sera
            enregistrée — l&apos;ASBL vous contactera pour les horaires.
          </p>
        ) : null}

        {mode === "staff" &&
        plan === "SCHOOL_SUPPORT" &&
        schoolSupportFeeCents > 0 ? (
          <label className="flex items-center gap-3 rounded-lg border border-dashed p-3">
            <input
              type="checkbox"
              name="membership_payment_received"
              className="h-4 w-4"
            />
            <span className="text-sm">
              Cotisation reçue sur place ({schoolSupportFeeLabel})
            </span>
          </label>
        ) : null}

        {mode === "staff" ? (
          <p className="text-xs text-muted-foreground">
            L&apos;e-mail du parent/tuteur doit correspondre à un compte parent existant
            pour enregistrer l&apos;adhésion.
          </p>
        ) : null}

        <QuoteRecap lines={quote.lines} totalCents={quote.totalCents} />
      </CardContent>
    </Card>
  );
}
