import "server-only";

import type { MembershipStatus } from "@/lib/constants/status";
import {
  type EnrollmentDbClient,
  isEnrollmentTransitionRpcMissing,
} from "@/lib/enrollment/enrollment-writes/rpc-fallback";

export async function writeEnrollmentPaidAwaitingAsbl(
  client: EnrollmentDbClient,
  childId: string,
  membershipId: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (!membershipId) {
    return { ok: false, error: "membership_required" };
  }

  const { error: membershipError } = await client
    .from("memberships")
    .update({ status: "AWAITING_ASBL" })
    .eq("id", membershipId)
    .eq("child_id", childId)
    .eq("status", "AWAITING_PAYMENT");

  if (membershipError) {
    return { ok: false, error: membershipError.message };
  }

  return { ok: true };
}

export async function writeChildValidatedByAdmin(
  client: EnrollmentDbClient,
  input: { childId: string; verifiedAt: string; schoolYear: string }
): Promise<void> {
  const { childId, verifiedAt, schoolYear } = input;

  const { error: rpcError } = await client.rpc("activate_child_enrollment_admin", {
    p_child_id: childId,
    p_verified_at: verifiedAt,
    p_school_year: schoolYear,
  });

  if (!rpcError) {
    return;
  }

  if (
    !isEnrollmentTransitionRpcMissing(
      rpcError.message,
      "activate_child_enrollment_admin"
    )
  ) {
    throw new Error(rpcError.message);
  }

  await client
    .from("children")
    .update({ asbl_validated_at: verifiedAt })
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
  client: EnrollmentDbClient,
  input: { childId: string; schoolYear: string }
): Promise<void> {
  const { childId, schoolYear } = input;

  const { error: rpcError } = await client.rpc("reject_child_enrollment_admin", {
    p_child_id: childId,
    p_school_year: schoolYear,
  });

  if (!rpcError) {
    return;
  }

  if (
    !isEnrollmentTransitionRpcMissing(
      rpcError.message,
      "reject_child_enrollment_admin"
    )
  ) {
    throw new Error(rpcError.message);
  }

  await client
    .from("memberships")
    .update({ status: "REJECTED" })
    .eq("child_id", childId)
    .eq("school_year", schoolYear);
}

export async function writeChildValidatedAfterSchoolSupportConfirm(
  client: EnrollmentDbClient,
  input: { childId: string; verifiedAt: string }
): Promise<void> {
  const { error: rpcError } = await client.rpc(
    "confirm_child_enrollment_validated",
    {
      p_child_id: input.childId,
      p_verified_at: input.verifiedAt,
    }
  );

  if (!rpcError) {
    return;
  }

  if (
    !isEnrollmentTransitionRpcMissing(
      rpcError.message,
      "confirm_child_enrollment_validated"
    )
  ) {
    throw new Error(rpcError.message);
  }

  await client
    .from("children")
    .update({ asbl_validated_at: input.verifiedAt })
    .eq("id", input.childId);
}

export async function writeSchoolSupportUpgradeAdmin(
  client: EnrollmentDbClient,
  input: {
    membershipId: string;
    parentId: string;
    feeCents: number;
    membershipStatus: MembershipStatus;
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

  return { ok: true };
}
