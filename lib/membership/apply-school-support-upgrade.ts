import { createClient } from "@/lib/supabase/server";
import { getAsblSettingsForCurrentYear, getSchoolSupportFeeCents } from "@/lib/data/asbl-settings";
import { getMembershipForChildCurrentYear } from "@/lib/data/memberships";
import type { MembershipPlan, MembershipStatus } from "@/lib/data/memberships";
import type { Database } from "@/types/database";

type ChildEnrollmentStatus =
  Database["public"]["Enums"]["child_enrollment_status"];

export type SchoolSupportUpgradeResult =
  | { ok: true; needsPayment: boolean; alreadyUpgraded: boolean }
  | { ok: false; code: string; detail: string };

type MembershipRow = {
  id: string;
  plan: MembershipPlan;
  status: MembershipStatus;
  fee_cents: number;
};

async function verifyParentLink(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parentId: string,
  childId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("parent_child_links")
    .select("id")
    .eq("parent_id", parentId)
    .eq("child_id", childId)
    .not("verified_at", "is", null)
    .maybeSingle<{ id: string }>();

  return !!data;
}

async function readMembershipAfterUpgrade(
  childId: string
): Promise<MembershipRow | null> {
  const membership = await getMembershipForChildCurrentYear(childId);
  if (!membership) return null;
  return {
    id: membership.id,
    plan: membership.plan,
    status: membership.status,
    fee_cents: membership.fee_cents,
  };
}

function isSchoolSupportPending(row: MembershipRow): boolean {
  return (
    row.plan === "SCHOOL_SUPPORT" &&
    (row.status === "AWAITING_ASBL" || row.status === "AWAITING_PAYMENT")
  );
}

async function upgradeViaRpc(
  supabase: Awaited<ReturnType<typeof createClient>>,
  childId: string
): Promise<{ ok: boolean; detail: string }> {
  const client = supabase as unknown as {
    rpc(
      fn: string,
      args: { p_child_id: string }
    ): Promise<{ error: { message: string; code?: string } | null }>;
  };

  const { error } = await client.rpc("request_school_support_upgrade", {
    p_child_id: childId,
  });

  if (!error) {
    return { ok: true, detail: "" };
  }

  if (error.message.includes("already_school_support")) {
    return { ok: true, detail: "already_school_support" };
  }

  if (
    error.code === "PGRST202" ||
    error.message.includes("Could not find the function") ||
    (error.message.includes("does not exist") &&
      error.message.includes("request_school_support_upgrade"))
  ) {
    return { ok: false, detail: "rpc_missing" };
  }

  return { ok: false, detail: error.message };
}

async function upgradeViaAdminClient(
  membershipId: string,
  parentId: string,
  childId: string,
  feeCents: number,
  newStatus: MembershipStatus,
  newEnrollmentStatus: ChildEnrollmentStatus
): Promise<{ ok: boolean; detail: string }> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("memberships")
      .update({
        plan: "SCHOOL_SUPPORT",
        fee_cents: feeCents,
        status: newStatus,
        asbl_validated_at: null,
      })
      .eq("id", membershipId)
      .eq("parent_id", parentId)
      .eq("plan", "BASE")
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error || !data) {
      return { ok: false, detail: error?.message ?? "membership_update_failed" };
    }

    await admin
      .from("children")
      .update({ enrollment_status: newEnrollmentStatus })
      .eq("id", childId);

    return { ok: true, detail: "" };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : "service_role_missing",
    };
  }
}

export async function applySchoolSupportUpgrade(
  childId: string,
  parentId: string
): Promise<SchoolSupportUpgradeResult> {
  const supabase = await createClient();

  if (!(await verifyParentLink(supabase, parentId, childId))) {
    return { ok: false, code: "link", detail: "Lien parent non validé." };
  }

  const membership = await getMembershipForChildCurrentYear(childId);
  if (!membership) {
    return { ok: false, code: "membership", detail: "Aucune adhésion pour cette année." };
  }

  if (membership.plan === "SCHOOL_SUPPORT") {
    const needsPayment =
      membership.status === "AWAITING_PAYMENT" && membership.fee_cents > 0;
    return { ok: true, needsPayment, alreadyUpgraded: true };
  }

  const { settings } = await getAsblSettingsForCurrentYear();
  const feeCents = getSchoolSupportFeeCents(settings);
  const needsPayment = feeCents > 0;
  const newStatus: MembershipStatus = needsPayment ? "AWAITING_PAYMENT" : "AWAITING_ASBL";
  const newEnrollmentStatus = needsPayment ? "EN_ATTENTE_PAIEMENT" : "PAYE_EN_ATTENTE_ASBL";

  const rpcResult = await upgradeViaRpc(supabase, childId);
  if (!rpcResult.ok && rpcResult.detail !== "rpc_missing") {
    return { ok: false, code: "upgrade", detail: rpcResult.detail };
  }

  if (!rpcResult.ok) {
    const adminResult = await upgradeViaAdminClient(
      membership.id,
      parentId,
      childId,
      feeCents,
      newStatus,
      newEnrollmentStatus
    );

    if (!adminResult.ok) {
      return {
        ok: false,
        code: "upgrade",
        detail: adminResult.detail.includes("service_role")
          ? "configuration"
          : "unknown",
      };
    }
  }

  const after = await readMembershipAfterUpgrade(childId);
  if (!after || !isSchoolSupportPending(after)) {
    return {
      ok: false,
      code: "upgrade",
      detail: "not_updated",
    };
  }

  return { ok: true, needsPayment, alreadyUpgraded: false };
}
