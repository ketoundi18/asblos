"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  staffActivateSchoolSupportAction,
  staffCancelSchoolSupportAction,
  staffEnrollChildSchoolSupportAction,
  staffUpdateSchoolSupportSlotsAction,
} from "@/lib/actions/child-school-support-staff";
import type { ChildSchoolSupportStaffContext } from "@/lib/data/child-school-support-staff";
import { formatSlotSchedule } from "@/types/school-support";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  childId: string;
  context: ChildSchoolSupportStaffContext;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? (
        <>
          <LoadingSpinner />
          Enregistrement…
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function SlotPicker({
  slots,
  defaultSelected,
  name = "school_support_slot_ids",
}: {
  slots: ChildSchoolSupportStaffContext["programs"][0]["slots"];
  defaultSelected?: string[];
  name?: string;
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected ?? []);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun créneau défini pour ce programme.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {slots.map((slot) => {
        const checked = selected.includes(slot.id);
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
              name={name}
              value={slot.id}
              checked={checked}
              onChange={() => toggle(slot.id)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm">{formatSlotSchedule(slot)}</span>
          </label>
        );
      })}
    </div>
  );
}

export function ChildSchoolSupportStaffForm({ childId, context }: Props) {
  const enrollAction = staffEnrollChildSchoolSupportAction.bind(null, childId);
  const activateAction = staffActivateSchoolSupportAction.bind(null, childId);

  const defaultProgramId = context.programs.length === 1 ? context.programs[0].id : "";
  const [programId, setProgramId] = useState(defaultProgramId);

  const selectedProgram = useMemo(
    () => context.programs.find((p) => p.id === programId) ?? null,
    [context.programs, programId]
  );

  if (context.parentMissing) {
    return (
      <p className="text-sm text-amber-800">
        Aucun compte parent lié. Renseigne l&apos;e-mail du tuteur (compte parent
        existant) ou crée le lien parent avant d&apos;inscrire au soutien scolaire.
      </p>
    );
  }

  if (context.enrollment) {
    const updateAction = staffUpdateSchoolSupportSlotsAction.bind(
      null,
      childId,
      context.enrollment.id
    );
    const cancelAction = staffCancelSchoolSupportAction.bind(
      null,
      childId,
      context.enrollment.id
    );

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{context.enrollment.programTitle}</p>
          <Badge variant={context.enrollment.status === "ACTIVE" ? "success" : "warning"}>
            {context.enrollment.status === "PENDING"
              ? "En attente de validation"
              : "Inscrit"}
          </Badge>
        </div>

        <form action={updateAction} className="space-y-3">
          <p className="text-sm font-medium">Jours / créneaux</p>
          <SlotPicker
            slots={context.enrollment.slots}
            defaultSelected={context.enrollment.selectedSlotIds}
          />
          <SubmitButton label="Mettre à jour les créneaux" />
        </form>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          {context.enrollment.status === "PENDING" ? (
            <form action={activateAction}>
              <SubmitButton label="Valider l'inscription soutien" />
            </form>
          ) : null}
          <form action={cancelAction}>
            <Button type="submit" size="sm" variant="outline">
              Retirer du programme
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (context.programs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun programme ouvert. Crée ou publie un programme dans{" "}
        <span className="font-medium">Soutien scolaire</span>.
      </p>
    );
  }

  return (
    <form action={enrollAction} className="space-y-4">
      {context.programs.length > 1 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Programme</p>
          <select
            name="school_support_program_id"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
            required
          >
            <option value="" disabled>
              Choisir un programme
            </option>
            {context.programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.title}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="school_support_program_id" value={context.programs[0].id} />
      )}

      {selectedProgram ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Jours souhaités{" "}
            <span className="font-normal text-muted-foreground">(optionnel)</span>
          </p>
          <SlotPicker slots={selectedProgram.slots} />
        </div>
      ) : null}

      {context.schoolSupportFeeCents > 0 ? (
        <label className="flex items-center gap-3 rounded-lg border border-dashed p-3">
          <input type="checkbox" name="membership_payment_received" className="h-4 w-4" />
          <span className="text-sm">
            Cotisation reçue ({context.schoolSupportFeeLabel})
          </span>
        </label>
      ) : null}

      <SubmitButton label="Inscrire au soutien scolaire" />
    </form>
  );
}
