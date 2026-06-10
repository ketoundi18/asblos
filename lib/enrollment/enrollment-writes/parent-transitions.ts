import "server-only";

import type { ChildEnrollmentStatus } from "@/lib/constants/status";
import type { EnrollmentQuote } from "@/lib/asbl/fee-utils";
import { mapEnrollmentStatusToMembershipStatus } from "@/lib/enrollment/child-enrollment-state";
import {
  type EnrollmentDbClient,
  isEnrollmentTransitionRpcMissing,
} from "@/lib/enrollment/enrollment-writes/rpc-fallback";

/** Couche A à la création parent — membership courante via RPC 045. */
export function enrollmentStatusFromQuote(
  quote: EnrollmentQuote
): ChildEnrollmentStatus {
  return quote.enrollmentStatus;
}

export async function writeParentEnrollmentLayerA(
  client: EnrollmentDbClient,
  childId: string,
  status: ChildEnrollmentStatus,
  schoolYear: string,
  parentId: string
): Promise<void> {
  const { error: rpcError } = await client.rpc("set_child_enrollment_layer_a_parent", {
    p_child_id: childId,
    p_status: status,
  });

  if (!rpcError) {
    return;
  }

  if (
    !isEnrollmentTransitionRpcMissing(
      rpcError.message,
      "set_child_enrollment_layer_a_parent"
    )
  ) {
    throw new Error(rpcError.message);
  }

  const membershipStatus = mapEnrollmentStatusToMembershipStatus(status);
  if (!membershipStatus) {
    throw new Error("invalid_status");
  }

  const { error } = await client
    .from("memberships")
    .update({
      status: membershipStatus,
      asbl_validated_at: null,
    })
    .eq("child_id", childId)
    .eq("school_year", schoolYear)
    .eq("parent_id", parentId);

  if (error) {
    throw new Error(error.message);
  }
}
