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
import { FormNativeSelect } from "@/components/ui/form-native-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export type StaffContractFormInitialValues = {
  memberId: string;
  memberName: string;
  memberRole: ClockableStaffMember["role"];
  hours: number;
  minutes: number;
  workDays: number[];
};

type Props = {
  members: ClockableStaffMember[];
  initialValues?: StaffContractFormInitialValues | null;
};

function SubmitButton({
  isEdit,
  disabled,
}: {
  isEdit: boolean;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full sm:w-auto"
      disabled={pending || disabled}
    >
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
  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${m.full_name} (${ROLE_LABELS[m.role]})`,
  }));

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
            {members.length === 0 ? (
              <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-3 text-sm text-muted-foreground">
                Aucun travailleur, stagiaire ou bénévole actif.{" "}
                <Link href="/equipe/membres" className="font-medium text-primary underline-offset-4 hover:underline">
                  Crée d&apos;abord un membre
                </Link>{" "}
                puis reviens ici.
              </div>
            ) : isEdit ? (
              <>
                <input type="hidden" name="member_id" value={initialValues!.memberId} />
                <Input
                  id="member_id"
                  readOnly
                  value={`${initialValues!.memberName} (${ROLE_LABELS[initialValues!.memberRole]})`}
                  className="bg-muted/40"
                />
              </>
            ) : (
              <FormNativeSelect
                id="member_id"
                name="member_id"
                options={memberOptions}
                placeholder="— Choisir un membre —"
                startEmpty
                required
              />
            )}
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
            <SubmitButton isEdit={isEdit} disabled={members.length === 0 && !isEdit} />
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
