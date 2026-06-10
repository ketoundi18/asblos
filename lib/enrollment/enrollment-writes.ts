import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChildEnrollmentStatus,
  MembershipStatus,
} from "@/lib/constants/status";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

/** Double-write V1 : couche A + B — à remplacer par RPC unique (C1 phase 3). */

export async function writeEnrollmentPaidAwaitingAsbl(
  client: DbClient,
  childId: string,
  membershipId: string | null
): Promise<{ ok: boolean; error?: string }> {
  const { error: childError } = await client
    .from("children")
    .update({ enrollment_status: "PAYE_EN_ATTENTE_ASBL" })
    .eq("id", childId);

  if (childError) {
    return { ok: false, error: childError.message };
  }

  if (membershipId) {
    const { error: membershipError } = await client
      .from("memberships")
      .update({ status: "AWAITING_ASBL" })
      .eq("id", membershipId)
      .eq("status", "AWAITING_PAYMENT");

    if (membershipError) {
      return { ok: false, error: membershipError.message };
    }
  }

  return { ok: true };
}

export async function writeChildValidatedByAdmin(
  client: DbClient,
  input: { childId: string; verifiedAt: string; schoolYear: string }
): Promise<void> {
  const { childId, verifiedAt, schoolYear } = input;

  await client
    .from("children")
    .update({
      enrollment_status: "VALIDE",
      asbl_validated_at: verifiedAt,
    })
    .eq("id", childId)
    .eq("created_via", "PARENT");

  await client
    .from("memberships")
    .update({
      status: "ACTIVE",
      asbl_validated_at: verifiedAt,
    })
    .eq("child_id", childId)
    .eq("school_year", schoolYear)
    .in("status", ["AWAITING_ASBL", "AWAITING_PAYMENT"]);
}

export async function writeChildRejectedByAdmin(
  client: DbClient,
  input: { childId: string; schoolYear: string }
): Promise<void> {
  const { childId, schoolYear } = input;

  await client
    .from("children")
    .update({ enrollment_status: "REFUSE" })
    .eq("id", childId)
    .eq("created_via", "PARENT");

  await client
    .from("memberships")
    .update({ status: "REJECTED" })
    .eq("child_id", childId)
    .eq("school_year", schoolYear);
}

export async function writeChildValidatedAfterSchoolSupportConfirm(
  client: DbClient,
  input: { childId: string; verifiedAt: string }
): Promise<void> {
  await client
    .from("children")
    .update({
      enrollment_status: "VALIDE",
      asbl_validated_at: input.verifiedAt,
    })
    .eq("id", input.childId);
}

export async function writeSchoolSupportUpgradeAdmin(
  client: DbClient,
  input: {
    membershipId: string;
    parentId: string;
    childId: string;
    feeCents: number;
    membershipStatus: MembershipStatus;
    enrollmentStatus: ChildEnrollmentStatus;
  }
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await client
    .from("memberships")
    .update({
      plan: "SCHOOL_SUPPORT",
      fee_cents: input.feeCents,
      status: input.membershipStatus,
      asbl_validated_at: null,
    })
    .eq("id", input.membershipId)
    .eq("parent_id", input.parentId)
    .eq("plan", "BASE")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "membership_update_failed" };
  }

  const { error: childError } = await client
    .from("children")
    .update({ enrollment_status: input.enrollmentStatus })
    .eq("id", input.childId);

  if (childError) {
    return { ok: false, error: childError.message };
  }

  return { ok: true };
}
