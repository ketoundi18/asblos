import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getAsblSettingsForCurrentYear } from "@/lib/data/asbl-settings";
import { getParentLinksForAdmin } from "@/lib/data/parent-admin";
import { getSchoolSupportAdminQueue } from "@/lib/data/school-support-admin";
import { AsblSettingsPanel } from "@/components/admin/asbl-settings-panel";
import { ParentLinksPanel } from "@/components/admin/parent-links-panel";
import { SchoolSupportAdminPanel } from "@/components/admin/school-support-admin-panel";
import { friendlyLoadError } from "@/lib/messages/flash-messages";

export default async function AdministrationPage() {
  const profile = await getCurrentProfile();

  if (!profile || !canManageUsers(profile.role)) {
    redirect("/");
  }

  const [{ links, loadError }, { requests: schoolSupportRequests, loadError: soutienError }, { settings, loadError: settingsError }] =
    await Promise.all([
      getParentLinksForAdmin(),
      getSchoolSupportAdminQueue(),
      getAsblSettingsForCurrentYear(),
    ]);

  const pendingCount =
    links.filter((l) => !l.verified).length +
    schoolSupportRequests.filter((r) => r.can_confirm).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Familles & réglages</h1>
        <p className="text-muted-foreground">
          {pendingCount > 0
            ? `${pendingCount} dossier${pendingCount > 1 ? "s" : ""} à traiter — ou consulte l'historique ci-dessous.`
            : "Tout est à jour. Les réglages rares sont en bas de page."}
        </p>
      </div>

      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {friendlyLoadError(loadError, "staff")}
        </div>
      ) : null}
      {soutienError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {friendlyLoadError(soutienError, "staff")}
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">À traiter aujourd&apos;hui</h2>
        <SchoolSupportAdminPanel
          requests={schoolSupportRequests}
          embedded
          returnTo="/administration"
        />
        <ParentLinksPanel links={links.filter((l) => !l.verified)} pendingOnly />
      </section>

      {links.some((l) => l.verified) ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Historique — familles validées</h2>
          <ParentLinksPanel links={links.filter((l) => l.verified)} validatedOnly />
        </section>
      ) : null}

      {settingsError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {friendlyLoadError(settingsError, "staff")}
        </div>
      ) : null}

      <section className="space-y-4 border-t pt-8">
        <h2 className="text-lg font-semibold text-muted-foreground">Réglages (rarement modifié)</h2>
        {settings ? <AsblSettingsPanel settings={settings} /> : null}
      </section>
    </div>
  );
}
