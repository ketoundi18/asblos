"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { upsertStaffContractSchema } from "@/lib/validations/staff-contract";
import type { UpsertStaffContractState } from "@/lib/actions/equipe-state";

function mapFieldErrors(
  issues: { path: (string | number)[]; message: string }[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0]);
    if (!fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

function mapRpcError(message: string): "contract-member" | "contract-save" {
  if (message.includes("member_not_found") || message.includes("P0002")) {
    return "contract-member";
  }
  return "contract-save";
}

const RETURN_PATH = "/equipe/horaires";

export async function upsertStaffContractAction(
  _prevState: UpsertStaffContractState,
  formData: FormData
): Promise<UpsertStaffContractState> {
  const profile = await requireProfile();

  if (!canManageUsers(profile.role)) {
    return { error: "Tu n'as pas la permission de gérer les objectifs horaires.", fieldErrors: {} };
  }

  const parsed = upsertStaffContractSchema.safeParse({
    member_id: formData.get("member_id"),
    hours: formData.get("hours"),
    minutes: formData.get("minutes"),
    work_days: formData.getAll("work_days"),
  });

  if (!parsed.success) {
    return { error: null, fieldErrors: mapFieldErrors(parsed.error.issues) };
  }

  const { member_id, hours, minutes, work_days } = parsed.data;
  const targetMinutes = hours * 60 + minutes;

  const supabase = await createClient();

  const { data: member, error: memberError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", member_id)
    .in("role", ["TRAVAILLEUR", "STAGIAIRE", "BENEVOLE"])
    .eq("is_active", true)
    .maybeSingle();

  if (memberError || !member) {
    redirect(`${RETURN_PATH}?error=contract-member`);
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "upsert_staff_contract",
    {
      p_user_id: member_id,
      p_target_minutes: targetMinutes,
      p_work_days: work_days,
    }
  );

  if (rpcError) {
    console.error("[contract] rpc failed:", rpcError.message);
    const code = mapRpcError(rpcError.message);
    if (code === "contract-save" && rpcError.message.includes("does not exist")) {
      redirect(`${RETURN_PATH}?error=contract-migration`);
    }
    redirect(`${RETURN_PATH}?error=${code}`);
  }

  const result = rpcResult as { id?: string; is_update?: boolean } | null;
  const newContractId = result?.id;
  const isUpdate = Boolean(result?.is_update);

  if (!newContractId) {
    console.error("[contract] rpc returned empty id");
    redirect(`${RETURN_PATH}?error=contract-save`);
  }

  await logAuditEvent({
    action: isUpdate ? "STAFF_CONTRACT_UPDATED" : "STAFF_CONTRACT_CREATED",
    entityType: "staff_time_contracts",
    entityId: newContractId,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: {
      member_id,
      full_name: member.full_name,
      target_minutes: targetMinutes,
      work_days,
    },
  });

  revalidatePath(RETURN_PATH);
  revalidatePath("/mon-service");
  redirect(
    `${RETURN_PATH}?success=${isUpdate ? "contract-updated" : "contract-created"}`
  );
}
