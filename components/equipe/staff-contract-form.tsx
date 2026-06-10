"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { upsertStaffContractAction } from "@/lib/actions/equipe/upsert-staff-contract";
import { initialUpsertStaffContractState } from "@/lib/actions/equipe-state";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { ClockableStaffMember } from "@/lib/data/equipe/get-clockable-staff";
import {
  DEFAULT_STAFF_WORK_DAYS,
  STAFF_WORK_DAY_OPTIONS,
} from "@/lib/data/staff-time/work-days";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export type StaffContractFormInitialValues = {
  memberId: string;
  memberName: string;
  hours: number;
  minutes: number;
  workDays: number[];
};

type Props = {
  members: ClockableStaffMember[];
  initialValues?: StaffContractFormInitialValues | null;
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? (
        <>
          <LoadingSpinner />
          Enregistrement…
        </>
      ) : isEdit ? (
        "Mettre à jour l'objectif"
      ) : (
        "Enregistrer l'objectif"
      )}
    </Button>
  );
}

export function StaffContractForm({ members, initialValues = null }: Props) {
  const [state, formAction] = useFormState(
    upsertStaffContractAction,
    initialUpsertStaffContractState
  );

  const isEdit = Boolean(initialValues);
  const hoursDefault = initialValues?.hours ?? 4;
  const minutesDefault = initialValues?.minutes ?? 45;
  const workDaysDefault = initialValues?.workDays ?? DEFAULT_STAFF_WORK_DAYS;

  return (
    <Card id="contract-form">
      <CardHeader>
        <CardTitle className="text-lg">
          {isEdit ? "Modifier un objectif" : "Définir un objectif"}
        </CardTitle>
        <CardDescription>
          {isEdit ? (
            <>
              Tu modifies l&apos;objectif de <strong>{initialValues?.memberName}</strong>. Les
              changements s&apos;appliquent à partir d&apos;aujourd&apos;hui.
            </>
          ) : (
            <>
              Choisis un membre, ses heures par jour travaillé et les jours concernés. Si la
              personne a déjà un objectif, il sera remplacé à partir d&apos;aujourd&apos;hui.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          key={initialValues?.memberId ?? "new"}
          action={formAction}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="member_id">Membre *</Label>
            <select
              id="member_id"
              name="member_id"
              required
              defaultValue={initialValues?.memberId ?? ""}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">— Choisir un membre —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({ROLE_LABELS[m.role]})
                </option>
              ))}
            </select>
            {state.fieldErrors.member_id ? (
              <p className="text-sm text-destructive">{state.fieldErrors.member_id}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Objectif par jour *</Label>
            <div className="flex max-w-xs items-end gap-2">
              <div className="space-y-1">
                <Input
                  id="hours"
                  name="hours"
                  type="number"
                  min={0}
                  max={23}
                  defaultValue={hoursDefault}
                  required
                  className="w-20"
                />
                <p className="text-center text-xs text-muted-foreground">heures</p>
              </div>
              <span className="pb-6 text-lg font-bold text-muted-foreground">h</span>
              <div className="space-y-1">
                <Input
                  id="minutes"
                  name="minutes"
                  type="number"
                  min={0}
                  max={59}
                  defaultValue={minutesDefault}
                  required
                  className="w-20"
                />
                <p className="text-center text-xs text-muted-foreground">minutes</p>
              </div>
            </div>
            {state.fieldErrors.hours ? (
              <p className="text-sm text-destructive">{state.fieldErrors.hours}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Jours travaillés *</Label>
            <div className="flex flex-wrap gap-2">
              {STAFF_WORK_DAY_OPTIONS.map((day) => (
                <label
                  key={day.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="checkbox"
                    name="work_days"
                    value={day.value}
                    defaultChecked={workDaysDefault.includes(day.value)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span>{day.fullLabel}</span>
                </label>
              ))}
            </div>
            {state.fieldErrors.work_days ? (
              <p className="text-sm text-destructive">{state.fieldErrors.work_days}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Par défaut : lundi au vendredi. Coche le samedi (ou d&apos;autres jours) si
                l&apos;ASBL travaille aussi ces jours-là.
              </p>
            )}
          </div>

          {state.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton isEdit={isEdit} />
            {isEdit ? (
              <Button variant="outline" asChild>
                <Link href="/equipe/horaires">Nouvel objectif</Link>
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
