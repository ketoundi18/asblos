"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { isParentRole } from "@/lib/auth/roles";
import { getMembershipForChildCurrentYear } from "@/lib/data/memberships";
import { syncMissingMembershipsForCurrentParent } from "@/lib/data/membership-sync";
import { applySchoolSupportUpgrade } from "@/lib/membership/apply-school-support-upgrade";
import { resolveSchoolSupportEnrollmentEligibility } from "@/lib/parent/school-support-eligibility";

export async function enrollChildInSchoolSupportAction(
  programId: string,
  formData: FormData
) {
  const profile = await requireProfile();
  if (!isParentRole(profile.role)) {
    redirect("/espace-parents/soutien-scolaire?error=permission");
  }

  const childId = formData.get("child_id");
  if (typeof childId !== "string" || !childId) {
    redirect("/espace-parents/soutien-scolaire?error=child");
  }

  const supabase = await createClient();

  const { data: verifiedLink } = await supabase
    .from("parent_child_links")
    .select("id")
    .eq("parent_id", profile.id)
    .eq("child_id", childId)
    .not("verified_at", "is", null)
    .maybeSingle<{ id: string }>();

  if (!verifiedLink) {
    redirect("/espace-parents/soutien-scolaire?error=link");
  }

  await syncMissingMembershipsForCurrentParent();

  const membership = await getMembershipForChildCurrentYear(childId);

  const { data: existingEnrollment } = await supabase
    .from("school_support_enrollments")
    .select("id")
    .eq("child_id", childId)
    .is("cancelled_at", null)
    .maybeSingle<{ id: string }>();

  const eligibility = resolveSchoolSupportEnrollmentEligibility(
    membership,
    !!existingEnrollment
  );

  if (!eligibility.allowed) {
    if (eligibility.reason === "choose_days" && eligibility.actionHref) {
      redirect(eligibility.actionHref);
    }
    redirect(`/espace-parents/soutien-scolaire?error=${eligibility.reason}`);
  }

  const { data: program } = await supabase
    .from("school_support_programs")
    .select("id, max_participants, status, parent_registration_open")
    .eq("id", programId)
    .is("deleted_at", null)
    .maybeSingle<{
      id: string;
      max_participants: number | null;
      status: string;
      parent_registration_open: boolean;
    }>();

  if (
    !program ||
    program.status !== "OPEN" ||
    !program.parent_registration_open
  ) {
    redirect("/espace-parents/soutien-scolaire?error=program-closed");
  }

  if (program.max_participants != null) {
    const { count } = await supabase
      .from("school_support_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("program_id", programId)
      .eq("status", "ACTIVE")
      .is("cancelled_at", null);

    if ((count ?? 0) >= program.max_participants) {
      redirect("/espace-parents/soutien-scolaire?error=full");
    }
  }

  const { error } = await supabase.from("school_support_enrollments").insert({
    program_id: programId,
    child_id: childId,
    parent_id: profile.id,
    membership_id: eligibility.membership.id,
    status: "ACTIVE",
    enrolled_by: profile.id,
  });

  if (error) {
    if (error.message.includes("unique") || error.code === "23505") {
      redirect("/espace-parents/soutien-scolaire?error=already");
    }
    redirect("/espace-parents/soutien-scolaire?error=enroll");
  }

  revalidatePath("/espace-parents/soutien-scolaire");
  revalidatePath("/espace-parents");
  redirect("/espace-parents/soutien-scolaire?success=enrolled");
}

export async function upgradeToSchoolSupportAction(childId: string) {
  const profile = await requireProfile();
  if (!isParentRole(profile.role)) {
    redirect("/espace-parents?error=permission");
  }

  const result = await applySchoolSupportUpgrade(childId, profile.id);

  if (!result.ok) {
    redirect(`/espace-parents/soutien-scolaire?error=${result.code}`);
  }

  revalidatePath("/espace-parents");
  revalidatePath("/espace-parents/soutien-scolaire");
  revalidatePath("/administration");
  revalidatePath("/");

  if (result.needsPayment) {
    redirect(`/espace-parents/paiement/${childId}?success=upgrade`);
  }

  redirect("/espace-parents/soutien-scolaire?success=upgrade-soutien");
}
