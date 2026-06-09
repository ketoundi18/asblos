import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/roles";
import { isStaffLimitedAccess } from "@/lib/auth/permissions";
import { getCommandCenter } from "@/lib/data/command-center";
import { CommandCenterView } from "@/components/staff/command-center-view";
import { friendlyLoadError } from "@/lib/messages/flash-messages";

export default async function MaJourneePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");

  if (!isStaffRole(profile.role)) {
    redirect("/espace-parents");
  }

  const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? "";
  const limited = isStaffLimitedAccess(profile.role);
  const data = await getCommandCenter(profile.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {firstName ? `Bonjour, ${firstName}` : "Ma journée"}
        </h1>
        <p className="text-muted-foreground">
          {limited
            ? "Voici les activités du jour — marquez les présences en un clic."
            : "Voici ce qui demande votre attention aujourd'hui."}
        </p>
      </div>

      {data.loadError ? (
        <div className="rounded-md alert-banner-warning">
          {friendlyLoadError(data.loadError, "staff")}
        </div>
      ) : null}

      <CommandCenterView data={data} />
    </div>
  );
}
