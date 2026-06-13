"use server";

import { redirect } from "next/navigation";
import { guardChildId } from "@/lib/validations/uuid";

/** @deprecated Mollie retiré — redirige vers le virement bancaire. */
export async function startParentPaymentAction(
  childId: string,
  _method?: "BANCONTACT" | "CARD"
) {
  guardChildId(childId, "/espace-parents");
  redirect(`/espace-parents/paiement/${childId}`);
}
