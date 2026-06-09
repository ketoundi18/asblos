import { getParentOpenSchoolSupportPrograms, getParentSchoolSupportEnrollments } from "@/lib/data/school-support";
import { getParentChildrenForSchoolSupport } from "@/lib/data/parent-school-support";
import { getMembershipsForParentDashboard } from "@/lib/data/memberships";
import { ParentSchoolSupportChildBlock } from "@/components/parent/parent-school-support-child-block";
import { formatSlotSchedule } from "@/types/school-support";
import {
  formatEnrollmentFeeLabel,
  getAsblSettingsForCurrentYear,
  getSchoolSupportFeeCents,
} from "@/lib/data/asbl-settings";
import { resolveLoadErrorToast } from "@/lib/messages/flash-messages";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ParentSoutienScolairePage() {
  const [{ programs, loadError }, enrollments, { children, loadError: childrenError }, membershipMap, { settings }] =
    await Promise.all([
      getParentOpenSchoolSupportPrograms(),
      getParentSchoolSupportEnrollments(),
      getParentChildrenForSchoolSupport(),
      getMembershipsForParentDashboard(),
      getAsblSettingsForCurrentYear(),
    ]);

  const feeLabel = formatEnrollmentFeeLabel(getSchoolSupportFeeCents(settings));
  const enrolledChildIds = new Set(enrollments.map((e) => e.child_id));
  const displayError = loadError ?? childrenError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Soutien scolaire</h1>
        <p className="text-muted-foreground">
          Cotisation annuelle{" "}
          {feeLabel !== "Gratuit" ? `(${feeLabel})` : "— gratuite cette année"}. Choisissez
          ensuite les jours qui conviennent à votre enfant.
        </p>
      </div>

      {displayError ? (
        <ServerNoticeToast flash={resolveLoadErrorToast(displayError, "parent")} />
      ) : null}

      {children.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Aucun enfant inscrit</p>
            <p>Commencez par inscrire un enfant depuis Mes enfants.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vos enfants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {children.map((child) => (
              <ParentSchoolSupportChildBlock
                key={child.id}
                childId={child.id}
                firstName={child.first_name}
                lastName={child.last_name}
                membership={membershipMap.get(child.id) ?? null}
                schoolSupportFeeLabel={feeLabel}
                hasProgramEnrollment={enrolledChildIds.has(child.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {programs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Programmes disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {programs.map((program) => (
              <div key={program.id} className="rounded-lg border p-4 space-y-2">
                <p className="font-medium">{program.title}</p>
                {program.description ? (
                  <p className="text-sm text-muted-foreground">{program.description}</p>
                ) : null}
                {program.slots.length > 0 ? (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {program.slots.map((slot) => (
                      <li key={slot.id}>{formatSlotSchedule(slot)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Horaires à préciser avec l&apos;ASBL.
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun programme publié pour le moment. L&apos;ASBL prépare la rentrée.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
