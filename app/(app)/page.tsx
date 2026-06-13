import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/roles";
import { isStaffLimitedAccess } from "@/lib/auth/permissions";
import { getCommandCenter } from "@/lib/data/command-center";
import { CommandCenterView } from "@/components/staff/command-center-view";
import { PageHeader } from "@/components/ui/page-header";
import { resolveFlashToast, resolveLoadErrorToast } from "@/lib/messages/flash-messages";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";

export default async function MaJourneePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; detail?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");

  if (!isStaffRole(profile.role)) {
    redirect("/espace-parents");
  }

  const params = await searchParams;
  const flash = resolveFlashToast({
    success: params.success,
    error: params.error,
    detail: params.detail,
    audience: "staff",
  });

  const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? "";
  const limited = isStaffLimitedAccess(profile.role);
  const data = await getCommandCenter(profile.role);

  const title = firstName ? `Bonjour, ${firstName}` : "Ma journée";
  const description = limited
    ? "Les activités du jour et les présences — en un coup d'œil."
    : "Ce qui demande votre attention aujourd'hui, classé par priorité.";

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Ma journée" title={title} description={description} />

      {flash ? <ServerNoticeToast flash={flash} /> : null}

      {data.loadError ? (
        <ServerNoticeToast flash={resolveLoadErrorToast(data.loadError, "staff")} />
      ) : null}

      <CommandCenterView data={data} />
    </div>
  );
}
