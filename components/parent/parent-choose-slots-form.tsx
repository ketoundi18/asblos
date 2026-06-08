"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveParentSchoolSupportSlotsAction } from "@/lib/actions/parent-school-support-slots";
import { emptyParentSlotSelectionState } from "@/lib/actions/parent-school-support-slots-state";
import type { OpenSchoolSupportProgram } from "@/components/enrollment/school-support-enrollment-section";
import { formatSlotSchedule } from "@/types/school-support";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

type Props = {
  childId: string;
  childName: string;
  programs: OpenSchoolSupportProgram[];
  wizardMode?: boolean;
  onComplete?: () => void;
};

function SubmitButton({ hasSlots, wizardMode }: { hasSlots: boolean; wizardMode?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <LoadingSpinner />
          Enregistrement…
        </>
      ) : wizardMode ? (
        "Continuer"
      ) : hasSlots ? (
        "Enregistrer les jours"
      ) : (
        "Continuer sans choisir de jours"
      )}
    </Button>
  );
}

export function ParentChooseSlotsForm({
  childId,
  childName,
  programs,
  wizardMode,
  onComplete,
}: Props) {
  const action = saveParentSchoolSupportSlotsAction.bind(null, childId);
  const [state, formAction] = useFormState(action, emptyParentSlotSelectionState);

  const defaultProgramId = programs.length === 1 ? programs[0].id : "";
  const [programId, setProgramId] = useState(defaultProgramId);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  const selectedProgram = programs.find((p) => p.id === programId) ?? null;
  const hasSlots = (selectedProgram?.slots.length ?? 0) > 0;

  function toggleSlot(slotId: string) {
    setSelectedSlotIds((current) =>
      current.includes(slotId)
        ? current.filter((id) => id !== slotId)
        : [...current, slotId]
    );
  }

  useEffect(() => {
    if (wizardMode && state.success) {
      onComplete?.();
    }
  }, [wizardMode, state.success, onComplete]);

  const wizardHidden = wizardMode ? <input type="hidden" name="wizard_mode" value="1" /> : null;

  if (programs.length === 0) {
    return (
      <form action={formAction} className="space-y-4">
        {!wizardMode ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4">
            Aucun programme publié pour le moment. L&apos;ASBL vous contactera pour
            fixer les horaires avec vous. Vous pouvez continuer l&apos;inscription.
          </p>
        ) : null}
        <input type="hidden" name="skip_slots" value="on" />
        {wizardHidden}
        <SubmitButton hasSlots={false} wizardMode={wizardMode} />
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {!wizardMode ? (
        <p className="text-sm text-muted-foreground">
          Pour <strong>{childName}</strong>, cochez les jours qui conviennent le mieux.
          Ce n&apos;est <strong>pas obligatoire</strong> — vous pouvez aussi passer et
          revenir plus tard depuis Mes enfants.
        </p>
      ) : null}
      {wizardHidden}

      {programs.length > 1 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Programme *</p>
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
          {selectedProgram.description ? (
            <p className="text-sm text-muted-foreground">{selectedProgram.description}</p>
          ) : null}

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
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-3">
              Les horaires seront fixés avec l&apos;ASBL. Vous pouvez continuer.
            </p>
          )}
        </>
      ) : programs.length > 1 ? (
        <p className="text-sm text-muted-foreground">
          Sélectionnez un programme pour voir les jours disponibles.
        </p>
      ) : null}

      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <SubmitButton hasSlots={hasSlots} wizardMode={wizardMode} />
    </form>
  );
}
