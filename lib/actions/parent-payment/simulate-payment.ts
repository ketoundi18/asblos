"use server";

import { redirect } from "next/navigation";
import { guardChildId } from "@/lib/validations/uuid";

/** @deprecated Simulation Mollie retirée — redirige vers le virement bancaire. */
export async function simulateParentPaymentAction(
  childId: string,
  formData: FormData
) {
  guardChildId(childId, "/espace-parents");
  const wizardMode = formData.get("wizard_mode") === "1";
  const qs = wizardMode ? "?wizard=1" : "";
  redirect(`/espace-parents/paiement/${childId}${qs}`);
}
