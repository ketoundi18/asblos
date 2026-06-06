"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { getMembershipForChildCurrentYear } from "@/lib/data/memberships";

export async function validateParentLinkAction(linkId: string) {
  const profile = await requireProfile();

  if (!canManageUsers(profile.role)) {
    redirect("/administration?error=permission");
  }

  const supabase = await createClient();

  const { data: link } = await supabase
    .from("parent_child_links")
    .select("child_id")
    .eq("id", linkId)
    .single<{ child_id: string }>();

  if (link?.child_id) {
    const membership = await getMembershipForChildCurrentYear(link.child_id);

    if (
      membership?.status === "AWAITING_PAYMENT" &&
      membership.fee_cents > 0
    ) {
      redirect("/administration?error=payment-required");
    }

    const { data: child } = await supabase
      .from("children")
      .select("created_via, enrollment_status")
      .eq("id", link.child_id)
      .single<{ created_via: string | null; enrollment_status: string | null }>();

    if (
      child?.created_via === "PARENT" &&
      child.enrollment_status === "EN_ATTENTE_PAIEMENT"
    ) {
      redirect("/administration?error=payment-required");
    }
  }

  const verifiedAt = new Date().toISOString();

  const { error } = await supabase
    .from("parent_child_links")
    .update({ verified_at: verifiedAt } as never)
    .eq("id", linkId)
    .is("verified_at", null);

  if (error) {
    redirect("/administration?error=validate");
  }

  if (link?.child_id) {
    await supabase
      .from("children")
      .update({
        enrollment_status: "VALIDE",
        asbl_validated_at: verifiedAt,
      } as never)
      .eq("id", link.child_id)
      .eq("created_via", "PARENT");

    await supabase
      .from("memberships")
      .update({
        status: "ACTIVE",
        asbl_validated_at: verifiedAt,
      } as never)
      .eq("child_id", link.child_id)
      .eq("school_year", getCurrentSchoolYear())
      .in("status", ["AWAITING_ASBL", "AWAITING_PAYMENT"]);
  }

  revalidatePath("/administration");
  revalidatePath("/espace-parents");
  revalidatePath("/enfants");
  redirect("/administration?success=validated");
}

export async function rejectParentLinkAction(linkId: string) {
  const profile = await requireProfile();

  if (!canManageUsers(profile.role)) {
    redirect("/administration?error=permission");
  }

  const supabase = await createClient();

  const { data: link } = await supabase
    .from("parent_child_links")
    .select("child_id")
    .eq("id", linkId)
    .single<{ child_id: string }>();

  const { error } = await supabase
    .from("parent_child_links")
    .delete()
    .eq("id", linkId);

  if (error) {
    redirect("/administration?error=reject");
  }

  if (link?.child_id) {
    await supabase
      .from("children")
      .update({ enrollment_status: "REFUSE" } as never)
      .eq("id", link.child_id)
      .eq("created_via", "PARENT");

    await supabase
      .from("memberships")
      .update({ status: "REJECTED" } as never)
      .eq("child_id", link.child_id)
      .eq("school_year", getCurrentSchoolYear());
  }

  revalidatePath("/administration");
  revalidatePath("/espace-parents");
  revalidatePath("/enfants");
  redirect("/administration?success=rejected");
}
