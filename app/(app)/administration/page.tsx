import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getAsblSettingsForCurrentYear } from "@/lib/data/asbl-settings";
import { getParentLinksForAdmin } from "@/lib/data/parent-admin";
import { getSchoolSupportAdminQueue } from "@/lib/data/school-support-admin";
import { AsblSettingsPanel } from "@/components/admin/asbl-settings-panel";
import { ParentLinksPanel } from "@/components/admin/parent-links-panel";
import { SchoolSupportAdminPanel } from "@/components/admin/school-support-admin-panel";
import { resolveCombinedLoadErrorToast, resolveFlashToast } from "@/lib/messages/flash-messages";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";
import { isBankTransferConfigured } from "@/lib/asbl/fee-utils";

export default async function AdministrationPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; detail?: string }>;
}) {
  const profile = await getCurrentProfile();

  if (!profile || !canManageUsers(profile.role)) {
    redirect("/");
  }

  const params = await searchParams;
  const flash = resolveFlashToast({
    success: params.success,
    error: params.error,
    detail: params.detail,
    audience: "staff",
  });

  const [{ links, loadError }, { requests: schoolSupportRequests, loadError: soutienError }, { settings, loadError: settingsError }] =
    await Promise.all([
      getParentLinksForAdmin(),
      getSchoolSupportAdminQueue(),
      getAsblSettingsForCurrentYear(),
    ]);

  const pendingCount =
    links.filter((l) => !l.verified).length +
    schoolSupportRequests.filter((r) => r.can_confirm).length;

  const loadErrors = [loadError, soutienError, settingsError];
  const combinedLoadError = resolveCombinedLoadErrorToast(loadErrors, "staff");
  const bankReady = isBankTransferConfigured(settings);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Familles & réglages</h1>
        <p className="text-muted-foreground">
          Compte bancaire, cotisations et dossiers familles.
        </p>
      </div>

      {combinedLoadError ? <ServerNoticeToast flash={combinedLoadError} /> : null}
      {flash ? <ServerNoticeToast flash={flash} /> : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Compte bancaire ASBL {!bankReady ? "— à configurer" : ""}
        </h2>
        {!bankReady ? (
          <p className="text-sm text-warning-foreground">
            Obligatoire pour les cotisations (inscription enfant). Les activités
            payantes peuvent aussi utiliser ce compte par défaut.
          </p>
        ) : null}
        {settings ? <AsblSettingsPanel settings={settings} /> : null}
      </section>

      <section className="space-y-4 border-t pt-8">
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
    </div>
  );
}
