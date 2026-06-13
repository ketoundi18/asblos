import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageActivities } from "@/lib/auth/permissions";
import { createActivityAction } from "@/lib/actions/activities";
import { emptyActivityFormState } from "@/lib/actions/activities-state";
import { ActivityForm } from "@/components/activites/activity-form";
import { getAsblSettingsForCurrentYear } from "@/lib/data/asbl-settings";

export default async function NouvelleActivitePage() {
  const profile = await getCurrentProfile();

  if (!profile || !canManageActivities(profile.role)) {
    redirect("/activites");
  }

  const { settings } = await getAsblSettingsForCurrentYear();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle activité</h1>
        <p className="text-muted-foreground">
          Planifie une sortie, un atelier ou une journée spéciale.
        </p>
      </div>
      <ActivityForm
        action={createActivityAction}
        initialState={emptyActivityFormState}
        submitLabel="Créer l'activité"
        defaultPaymentIban={settings?.bank_iban}
        defaultPaymentAccountHolder={settings?.bank_account_holder}
      />
    </div>
  );
}
