"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { isParentRole } from "@/lib/auth/roles";
import { getMembershipForChildCurrentYear } from "@/lib/data/memberships";
import { enrollSchoolSupportAtSignup } from "@/lib/enrollment/enroll-school-support-at-signup";
import {
  parseProgramId,
  parseSelectedSlotIds,
} from "@/lib/enrollment/build-enrollment-quote";
import {
  childNeedsMembershipPayment,
  getChildPaymentContext,
} from "@/lib/data/parent-payments";
import type { ParentSlotSelectionState } from "@/lib/actions/parent-school-support-slots-state";
import { guardChildId } from "@/lib/validations/uuid";

export async function saveParentSchoolSupportSlotsAction(
  childId: string,
  _prevState: ParentSlotSelectionState,
  formData: FormData
): Promise<ParentSlotSelectionState> {
  guardChildId(childId, "/espace-parents");
  const profile = await requireProfile();

  if (!isParentRole(profile.role)) {
    return { error: "Accès réservé aux parents.", fieldErrors: {} };
  }

  const programId = parseProgramId(formData.get("school_support_program_id"));
  const slotIds = parseSelectedSlotIds(formData);
  const skip = formData.get("skip_slots") === "on";

  if (!programId && !skip) {
    return {
      error: "Choisissez un programme.",
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { data: link } = await supabase
    .from("parent_child_links")
    .select("child_id")
    .eq("parent_id", profile.id)
    .eq("child_id", childId)
    .maybeSingle<{ child_id: string }>();

  if (!link) {
    return { error: "Enfant introuvable pour ce compte.", fieldErrors: {} };
  }

  const membership = await getMembershipForChildCurrentYear(childId);
  if (!membership || membership.plan !== "SCHOOL_SUPPORT") {
    return {
      error: "Cet enfant n'est pas inscrit à la formule soutien scolaire.",
      fieldErrors: {},
    };
  }

  if (!skip && programId && slotIds.length > 0) {
    const { data: existing } = await supabase
      .from("school_support_enrollments")
      .select("id")
      .eq("child_id", childId)
      .eq("program_id", programId)
      .is("cancelled_at", null)
      .maybeSingle<{ id: string }>();

    if (!existing) {
      const enrollResult = await enrollSchoolSupportAtSignup(supabase, {
        childId,
        parentId: profile.id,
        membershipId: membership.id,
        programId,
        slotIds,
      });

      if (!enrollResult.ok) {
        return { error: enrollResult.error, fieldErrors: {} };
      }
    }
  }

  revalidatePath("/espace-parents");
  revalidatePath("/espace-parents/soutien-scolaire");
  revalidatePath(`/espace-parents/choisir-creneaux/${childId}`);

  const wizardMode = formData.get("wizard_mode") === "1";

  if (wizardMode) {
    return { error: null, fieldErrors: {}, success: true };
  }

  const context = await getChildPaymentContext(childId);
  if (context && childNeedsMembershipPayment(context)) {
    redirect(`/espace-parents/paiement/${childId}`);
  }
  redirect("/espace-parents?success=soutien-slots");
}
