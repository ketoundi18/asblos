import { getParentOpenSchoolSupportPrograms, getParentSchoolSupportEnrollments } from "@/lib/data/school-support";
import { getParentVerifiedChildrenForRegistration } from "@/lib/data/parent-activities";
import { getMembershipsForParentDashboard } from "@/lib/data/memberships";
import { enrollChildInSchoolSupportAction } from "@/lib/actions/parent-school-support";
import { ParentSchoolSupportChildBlock } from "@/components/parent/parent-school-support-child-block";
import { formatSlotSchedule } from "@/types/school-support";
import {
  formatEnrollmentFeeLabel,
  getAsblSettingsForCurrentYear,
  getSchoolSupportFeeCents,
} from "@/lib/data/asbl-settings";
import { friendlyLoadError } from "@/lib/messages/flash-messages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ParentSoutienScolairePage() {
  const [{ programs, loadError }, enrollments, children, membershipMap, { settings }] =
    await Promise.all([
      getParentOpenSchoolSupportPrograms(),
      getParentSchoolSupportEnrollments(),
      getParentVerifiedChildrenForRegistration(),
      getMembershipsForParentDashboard(),
      getAsblSettingsForCurrentYear(),
    ]);

  const feeLabel = formatEnrollmentFeeLabel(getSchoolSupportFeeCents(settings));
  const enrolledByProgram = new Map(enrollments.map((e) => [`${e.program_id}:${e.child_id}`, e]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Soutien scolaire</h1>
        <p className="text-muted-foreground">
          Accompagnement régulier — cotisation annuelle{" "}
          {feeLabel !== "Gratuit" ? `(${feeLabel})` : ""}
        </p>
      </div>

      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {friendlyLoadError(loadError, "parent")}
        </div>
      ) : null}

      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">
              Aucune offre ouverte pour le moment
            </p>
            <p>
              L&apos;ASBL doit publier un programme (statut « Ouvert » + visible aux
              parents).
            </p>
          </CardContent>
        </Card>
      ) : (
        programs.map((program) => {
          const enrollAction = enrollChildInSchoolSupportAction.bind(null, program.id);

          return (
            <Card key={program.id}>
              <CardHeader>
                <CardTitle>{program.title}</CardTitle>
                {program.description ? (
                  <p className="text-sm text-muted-foreground">{program.description}</p>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                {program.slots.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {program.slots.map((slot) => (
                      <li key={slot.id} className="text-muted-foreground">
                        {formatSlotSchedule(slot)}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {children.length === 0 ? (
                  <p className="text-sm text-amber-800">
                    Aucun enfant validé. L&apos;ASBL doit d&apos;abord valider votre dossier.
                  </p>
                ) : (
                  children.map((child) => {
                    const key = `${program.id}:${child.id}`;
                    const already = enrolledByProgram.has(key);
                    const membership = membershipMap.get(child.id) ?? null;

                    if (already) {
                      const enrollment = enrolledByProgram.get(key);
                      const isPending = enrollment?.status === "PENDING";
                      return (
                        <div
                          key={child.id}
                          className={`rounded-lg border p-3 text-sm ${
                            isPending
                              ? "border-amber-200 bg-amber-50/50"
                              : "border-green-200 bg-green-50/50"
                          }`}
                        >
                          <p
                            className={`font-medium ${
                              isPending ? "text-amber-800" : "text-green-800"
                            }`}
                          >
                            {child.first_name} {child.last_name} —{" "}
                            {isPending
                              ? "inscription en attente de validation ASBL"
                              : "inscrit(e) au soutien"}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <ParentSchoolSupportChildBlock
                        key={child.id}
                        childId={child.id}
                        firstName={child.first_name}
                        lastName={child.last_name}
                        membership={membership}
                        schoolSupportFeeLabel={feeLabel}
                        enrollForm={
                          <form
                            action={enrollAction}
                            className="flex items-center justify-between gap-3 rounded-lg border p-3"
                          >
                            <input type="hidden" name="child_id" value={child.id} />
                            <p className="font-medium">
                              {child.first_name} {child.last_name}
                            </p>
                            <Button type="submit" size="sm">
                              Inscrire
                            </Button>
                          </form>
                        }
                      />
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
