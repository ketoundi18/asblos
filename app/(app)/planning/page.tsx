import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/roles";
import { canManageActivities } from "@/lib/auth/permissions";
import { getUnifiedPlanning } from "@/lib/data/unified-planning";
import { UnifiedPlanningView } from "@/components/staff/unified-planning-view";
import { friendlyLoadError } from "@/lib/messages/flash-messages";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function PlanningPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");
  if (!isStaffRole(profile.role)) redirect("/espace-parents");

  const { days, loadError } = await getUnifiedPlanning(7);
  const canManage = canManageActivities(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planning</h1>
          <p className="text-muted-foreground">
            Activités ponctuelles et accompagnement scolaire — les 7 prochains jours.
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/activites/nouveau">Nouvelle activité</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/soutien-scolaire">Soutien scolaire</Link>
            </Button>
          </div>
        ) : null}
      </div>

      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {friendlyLoadError(loadError, "staff")}
        </div>
      ) : null}

      <UnifiedPlanningView days={days} />
    </div>
  );
}
