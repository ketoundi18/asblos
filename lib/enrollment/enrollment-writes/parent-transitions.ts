import "server-only";

import type { ChildEnrollmentStatus } from "@/lib/constants/status";
import type { EnrollmentQuote } from "@/lib/asbl/fee-utils";
import type { EnrollmentDbClient } from "@/lib/enrollment/enrollment-writes/rpc-fallback";

/** Couche A à la création parent — RPC dédiée prévue C1 phase 4. */
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
  const { error } = await client
    .from("children")
    .update({ enrollment_status: status })
    .eq("id", childId);

  if (error) {
    throw new Error(error.message);
  }
}
