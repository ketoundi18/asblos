import "server-only";

import type { ChildEnrollmentStatus } from "@/lib/constants/status";
import type { EnrollmentQuote } from "@/lib/asbl/fee-utils";
import {
  type EnrollmentDbClient,
  isEnrollmentTransitionRpcMissing,
} from "@/lib/enrollment/enrollment-writes/rpc-fallback";

/** Couche A à la création parent — préfère RPC 043 quand disponible. */
export function enrollmentStatusFromQuote(
  quote: EnrollmentQuote
): ChildEnrollmentStatus {
  return quote.enrollmentStatus;
}

export async function writeParentEnrollmentLayerA(
  client: EnrollmentDbClient,
  childId: string,
  status: ChildEnrollmentStatus
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

  const { error } = await client
    .from("children")
    .update({ enrollment_status: status })
    .eq("id", childId);

  if (error) {
    throw new Error(error.message);
  }
}
