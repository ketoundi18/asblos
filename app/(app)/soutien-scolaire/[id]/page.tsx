import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageActivities } from "@/lib/auth/permissions";
import {
  getStaffSchoolSupportProgramById,
  getProgramEnrollments,
} from "@/lib/data/school-support";
import {
  addSchoolSupportSlotAction,
  publishSchoolSupportProgramAction,
  updateSchoolSupportProgramAction,
} from "@/lib/actions/school-support";
import {
  PROGRAM_STATUS_LABELS,
  formatSlotSchedule,
} from "@/types/school-support";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
];

export default async function ProgrammeSoutienDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || !canManageActivities(profile.role)) {
    redirect("/");
  }

  const program = await getStaffSchoolSupportProgramById(id);
  if (!program) notFound();

  const enrollments = await getProgramEnrollments(id);
  const addSlot = addSchoolSupportSlotAction.bind(null, id);
  const updateProgram = updateSchoolSupportProgramAction.bind(null, id);
  const publishProgram = publishSchoolSupportProgramAction.bind(null, id);

  const visibleToParents =
    program.status === "OPEN" && program.parent_registration_open;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/soutien-scolaire">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </Button>

      {!visibleToParents ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-4 space-y-3">
          <p className="text-sm font-medium text-amber-900">
            Ce programme n&apos;est pas encore visible chez les parents.
          </p>
          <ul className="text-sm text-amber-800 space-y-1 list-disc pl-5">
            <li>
              Statut actuel : <strong>{PROGRAM_STATUS_LABELS[program.status]}</strong>
              {program.status !== "OPEN" ? " — passez à « Ouvert »" : null}
            </li>
            <li>
              Visible aux parents :{" "}
              <strong>{program.parent_registration_open ? "Oui" : "Non"}</strong>
              {!program.parent_registration_open ? " — cochez la case ci-dessous" : null}
            </li>
          </ul>
          <form action={publishProgram}>
            <Button type="submit" size="sm">
              Publier aux parents maintenant
            </Button>
          </form>
        </div>
      ) : (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          Visible dans l&apos;espace parents → Soutien scolaire
        </div>
      )}

      <div className="flex flex-wrap items-start gap-2">
        <h1 className="text-2xl font-bold">{program.title}</h1>
        <Badge variant={program.status === "OPEN" ? "success" : "muted"}>
          {PROGRAM_STATUS_LABELS[program.status]}
        </Badge>
      </div>

      {program.description ? (
        <p className="text-muted-foreground">{program.description}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publication</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProgram} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <select
                id="status"
                name="status"
                defaultValue={program.status}
                className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="DRAFT">Brouillon</option>
                <option value="OPEN">Ouvert</option>
                <option value="CLOSED">Fermé</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="parent_registration_open"
                defaultChecked={program.parent_registration_open}
                className="rounded border-input"
              />
              Visible et inscriptible par les parents
            </label>
            <Button type="submit" size="sm">
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Créneaux récurrents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {program.slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun créneau — ajoutez le premier ci-dessous.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {program.slots.map((slot) => (
                <li key={slot.id} className="rounded-lg border px-3 py-2">
                  {formatSlotSchedule(slot)}
                </li>
              ))}
            </ul>
          )}

          <form action={addSlot} className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <p className="text-sm font-medium">Ajouter un créneau</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="day_of_week">Jour</Label>
                <select
                  id="day_of_week"
                  name="day_of_week"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Début</Label>
                <Input id="start_time" name="start_time" type="time" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Fin (optionnel)</Label>
                <Input id="end_time" name="end_time" type="time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lieu</Label>
                <Input id="location" name="location" placeholder="Local ASBL" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Groupe (optionnel)</Label>
              <Input id="label" name="label" placeholder="Primaire 8-10 ans" />
            </div>
            <Button type="submit" size="sm">
              Ajouter le créneau
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Inscrits ({enrollments.length}
            {program.max_participants != null ? ` / ${program.max_participants}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune inscription pour l&apos;instant.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {enrollments.map((e) => (
                <li key={e.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
                  <span className="font-medium">
                    {e.child_first_name} {e.child_last_name}
                  </span>
                  <span className="text-muted-foreground">{e.parent_name}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
