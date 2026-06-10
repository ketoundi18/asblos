import "server-only";

import type { ChildEnrollmentStatus } from "@/lib/constants/status";
import {
  type EnrollmentDbClient,
  isEnrollmentTransitionRpcMissing,
} from "@/lib/enrollment/enrollment-writes/rpc-fallback";

export async function writeChildEnrollmentLayerAStaff(
  client: EnrollmentDbClient,
  input: {
    childId: string;
    status: ChildEnrollmentStatus;
    verifiedAt?: string | null;
  }
): Promise<void> {
  const { error: rpcError } = await client.rpc("set_child_enrollment_layer_a_staff", {
    p_child_id: input.childId,
    p_status: input.status,
    p_verified_at: input.verifiedAt ?? undefined,
  });

  if (!rpcError) {
    return;
  }

  if (
    !isEnrollmentTransitionRpcMissing(
      rpcError.message,
      "set_child_enrollment_layer_a_staff"
    )
  ) {
    throw new Error(rpcError.message);
  }

  await client
    .from("children")
    .update({
      enrollment_status: input.status,
      asbl_validated_at:
        input.status === "VALIDE" ? (input.verifiedAt ?? null) : null,
    })
    .eq("id", input.childId);
}

export async function writeStaffActivateChildEnrollment(
  client: EnrollmentDbClient,
  input: { childId: string; verifiedAt: string; schoolYear: string }
): Promise<void> {
  const { error: rpcError } = await client.rpc("activate_child_enrollment_staff", {
    p_child_id: input.childId,
    p_verified_at: input.verifiedAt,
    p_school_year: input.schoolYear,
  });

  if (!rpcError) {
    return;
  }

  if (
    !isEnrollmentTransitionRpcMissing(
      rpcError.message,
      "activate_child_enrollment_staff"
    )
  ) {
    throw new Error(rpcError.message);
  }

  await client
    .from("memberships")
    .update({
      status: "ACTIVE",
      asbl_validated_at: input.verifiedAt,
    })
    .eq("child_id", input.childId)
    .eq("school_year", input.schoolYear)
    .in("status", ["AWAITING_ASBL", "AWAITING_PAYMENT"]);

  await client
    .from("children")
    .update({
      enrollment_status: "VALIDE",
      asbl_validated_at: input.verifiedAt,
    })
    .eq("id", input.childId);
}

export async function writeStaffResetEnrollmentDraft(
  client: EnrollmentDbClient,
  childId: string
): Promise<void> {
  const { error: rpcError } = await client.rpc("reset_child_enrollment_draft_staff", {
    p_child_id: childId,
  });

  if (!rpcError) {
    return;
  }

  if (
    !isEnrollmentTransitionRpcMissing(
      rpcError.message,
      "reset_child_enrollment_draft_staff"
    )
  ) {
    throw new Error(rpcError.message);
  }

  await client
    .from("children")
    .update({
      enrollment_status: "BROUILLON",
      asbl_validated_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", childId);
}
