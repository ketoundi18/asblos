import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getStaffMembers } from "@/lib/data/equipe/get-staff-members";
import { CreateStaffMemberForm } from "@/components/equipe/create-staff-member-form";
import { StaffMembersList } from "@/components/equipe/staff-members-list";
import { resolveFlashToast, resolveLoadErrorToast } from "@/lib/messages/flash-messages";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<{ success?: string; error?: string; detail?: string }>;
};

export default async function EquipeMembresPage({ searchParams }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");
  if (!canManageUsers(profile.role)) redirect("/?error=permission");

  const params = await searchParams;
  const flash =
    params.success || params.error
      ? resolveFlashToast({
          success: params.success,
          error: params.error,
          detail: params.detail,
          audience: "staff",
        })
      : null;

  const { members, loadError } = await getStaffMembers();
  const loadFlash = loadError ? resolveLoadErrorToast(loadError, "staff") : null;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/equipe">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Équipe
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Membres</h1>
          <p className="text-muted-foreground">
            Crée un compte travailleur, stagiaire ou bénévole — plus besoin d&apos;ouvrir
            Supabase.
          </p>
        </div>
      </div>

      {flash ? <ServerNoticeToast flash={flash} /> : null}
      {loadFlash ? <ServerNoticeToast flash={loadFlash} /> : null}

      <CreateStaffMemberForm />
      <StaffMembersList members={members} currentUserId={profile.id} />
    </div>
  );
}
