"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Clock, Users } from "lucide-react";
import type { ActivityFormState } from "@/lib/actions/activities-state";
import { ACTIVITY_STATUS_LABELS } from "@/lib/validations/activity";
import type { Activity } from "@/types/activity";
import { normalizeTimeValue } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ActivityFormProps = {
  action: (
    state: ActivityFormState,
    formData: FormData
  ) => Promise<ActivityFormState>;
  initialState: ActivityFormState;
  activity?: Activity;
  submitLabel: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
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

export function ActivityForm({
  action,
  initialState,
  activity,
  submitLabel,
}: ActivityFormProps) {
  const isNew = !activity;
  const [state, formAction] = useFormState(action, initialState);
  const defaultPaid = (activity?.price_cents ?? 0) > 0;
  const [isPaid, setIsPaid] = useState(defaultPaid);
  const [parentOpen, setParentOpen] = useState(
    activity?.parent_registration_open ?? true
  );
  const defaultPriceEuros =
    defaultPaid && activity?.price_cents
      ? (activity.price_cents / 100).toFixed(2).replace(".", ",")
      : "";

  const defaultStart = normalizeTimeValue(activity?.start_time ?? null) ?? "";
  const defaultEnd = normalizeTimeValue(activity?.end_time ?? null) ?? "";

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>Titre, date et lieu de l&apos;activité</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={activity?.title}
              required
              placeholder="Ex. Sortie au parc"
            />
            {state.fieldErrors.title ? (
              <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_date">Date *</Label>
            <Input
              id="activity_date"
              name="activity_date"
              type="date"
              defaultValue={activity?.activity_date}
              required
            />
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-primary" />
              Horaires (optionnel)
            </div>
            <p className="text-xs text-muted-foreground">
              Format 24 h — ex. 14:30 pour 14 h 30. Laisse vide si pas d&apos;horaire fixe.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_time">Début</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  step={300}
                  defaultValue={defaultStart}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Fin</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  step={300}
                  defaultValue={defaultEnd}
                />
                {state.fieldErrors.end_time ? (
                  <p className="text-sm text-destructive">{state.fieldErrors.end_time}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              name="location"
              defaultValue={activity?.location ?? ""}
              placeholder="Ex. Salle polyvalente"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={activity?.description ?? ""}
              rows={3}
              placeholder="Détails pour l'équipe et les parents…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_participants">Places max.</Label>
            <Input
              id="max_participants"
              name="max_participants"
              type="number"
              min={1}
              defaultValue={activity?.max_participants ?? ""}
              placeholder="Illimité si vide"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <select
              id="status"
              name="status"
              defaultValue={activity?.status ?? "PLANIFIEE"}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(ACTIVITY_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className={parentOpen ? "border-green-300 bg-green-50/40" : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tarif &amp; espace parents
          </CardTitle>
          <CardDescription>
            Coche « Visible pour les parents » pour que l&apos;activité apparaisse dans
            l&apos;espace parent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 rounded-lg border bg-background p-3">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">Activité payante</span>
          </label>
          <input type="hidden" name="is_paid" value={isPaid ? "on" : ""} />
          {isPaid ? (
            <div className="space-y-2">
              <Label htmlFor="price_euros">Prix (€) *</Label>
              <Input
                id="price_euros"
                name="price_euros"
                type="text"
                inputMode="decimal"
                placeholder="Ex. 15 ou 15,50"
                defaultValue={defaultPriceEuros}
                required
              />
              {state.fieldErrors.price_euros ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.price_euros}
                </p>
              ) : null}
            </div>
          ) : null}

          <label
            className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
              parentOpen
                ? "border-green-400 bg-green-50"
                : "border-amber-300 bg-amber-50"
            }`}
          >
            <input
              type="checkbox"
              name="parent_registration_open"
              checked={parentOpen}
              onChange={(e) => setParentOpen(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <div className="text-sm space-y-1">
              <span className="font-semibold">
                Visible dans l&apos;espace parents
              </span>
              <p className="text-muted-foreground">
                {parentOpen
                  ? "Les parents pourront voir cette activité et inscrire leurs enfants."
                  : "⚠️ Activité interne uniquement — les parents ne la verront pas."}
              </p>
              {isNew && parentOpen ? (
                <p className="text-xs text-green-800">
                  Recommandé : coché par défaut pour les nouvelles activités.
                </p>
              ) : null}
            </div>
          </label>
        </CardContent>
      </Card>

      <SubmitButton label={submitLabel} />
      <Button asChild variant="outline" className="w-full">
        <Link href="/activites">Annuler</Link>
      </Button>
    </form>
  );
}
