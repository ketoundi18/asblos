import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { canCreateChild } from "@/lib/auth/permissions";
import { createChildAction } from "@/lib/actions/children";
import { emptyFormState } from "@/lib/actions/children-state";
import { ChildForm } from "@/components/enfants/child-form";
import {
  getAsblSettingsForCurrentYear,
  formatEnrollmentFeeLabel,
  getSchoolSupportFeeCents,
} from "@/lib/data/asbl-settings";
import { getStaffOpenSchoolSupportPrograms } from "@/lib/data/school-support";

export default async function NouvelEnfantPage() {
  const profile = await getCurrentProfile();

  if (!profile || !canCreateChild(profile.role)) {
    redirect("/enfants");
  }

  const [{ settings }, { programs, loadError }] = await Promise.all([
    getAsblSettingsForCurrentYear(),
    getStaffOpenSchoolSupportPrograms(),
  ]);

  const supportFee = getSchoolSupportFeeCents(settings);
  const supportFeeLabel = formatEnrollmentFeeLabel(supportFee);

  const openPrograms = programs.map((program) => ({
    id: program.id,
    title: program.title,
    description: program.description,
    slots: program.slots,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle fiche enfant</h1>
        <p className="text-muted-foreground">
          Remplis les informations essentielles et choisis le type d&apos;inscription.
          Tu pourras modifier la fiche plus tard.
        </p>
        {loadError ? (
          <p className="mt-2 text-sm text-warning-foreground">{loadError}</p>
        ) : null}
      </div>
      <ChildForm
        action={createChildAction}
        initialState={emptyFormState}
        submitLabel="Créer la fiche"
        enrollment={{
          programs: openPrograms,
          schoolSupportFeeCents: supportFee,
          schoolSupportFeeLabel: supportFeeLabel,
          mode: "staff",
        }}
      />
    </div>
  );
}
