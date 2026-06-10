import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getClockableStaff } from "@/lib/data/equipe/get-clockable-staff";
import { getActiveStaffContracts } from "@/lib/data/equipe/get-staff-contracts";
import type { StaffContractFormInitialValues } from "@/components/equipe/staff-contract-form";
import { StaffContractForm } from "@/components/equipe/staff-contract-form";
import { StaffContractsList } from "@/components/equipe/staff-contracts-list";
import { resolveFlashToast, resolveLoadErrorToast } from "@/lib/messages/flash-messages";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";

type PageProps = {
  searchParams: Promise<{ success?: string; error?: string; edit?: string }>;
};

export default async function EquipeHorairesPage({ searchParams }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");
  if (!canManageUsers(profile.role)) redirect("/?error=permission");

  const params = await searchParams;
  const flash =
    params.success || params.error
      ? resolveFlashToast({
          success: params.success,
          error: params.error,
          audience: "staff",
        })
      : null;

  const [{ members, loadError: membersError }, { contracts, loadError: contractsError }] =
    await Promise.all([getClockableStaff(), getActiveStaffContracts()]);

  const loadFlash =
    membersError || contractsError
      ? resolveLoadErrorToast(membersError ?? contractsError ?? "db", "staff")
      : null;

  const editingContract = params.edit
    ? contracts.find((contract) => contract.user_id === params.edit)
    : undefined;

  const initialValues: StaffContractFormInitialValues | null = editingContract
    ? {
        memberId: editingContract.user_id,
        memberName: editingContract.full_name,
        memberRole: editingContract.role,
        hours: Math.floor(editingContract.target_minutes / 60),
        minutes: editingContract.target_minutes % 60,
        workDays: editingContract.work_days,
      }
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/equipe"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Équipe
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Objectifs horaires</h1>
        <p className="text-muted-foreground">
          Définis combien d&apos;heures chaque membre doit prester par jour travaillé
          (lun–ven par défaut, samedi possible).
        </p>
      </div>

      {flash ? <ServerNoticeToast flash={flash} /> : null}
      {loadFlash ? <ServerNoticeToast flash={loadFlash} /> : null}

      <StaffContractForm members={members} initialValues={initialValues} />

      <StaffContractsList contracts={contracts} editingMemberId={params.edit ?? null} />
    </div>
  );
}
