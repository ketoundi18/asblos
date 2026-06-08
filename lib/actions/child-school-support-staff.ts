"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canModifyChild } from "@/lib/auth/permissions";
import { getAsblSettingsForCurrentYear, getSchoolSupportFeeCents } from "@/lib/data/asbl-settings";
import { getCurrentSchoolYear } from "@/lib/school-year";
import {
  parseProgramId,
  parseSelectedSlotIds,
} from "@/lib/enrollment/build-enrollment-quote";
import { enrollSchoolSupportByStaff } from "@/lib/enrollment/enroll-school-support-by-staff";
import { resolveParentIdForChild } from "@/lib/enrollment/resolve-parent-for-child";
import { activatePendingSchoolSupportEnrollments } from "@/lib/enrollment/activate-pending-enrollments";

function childPath(childId: string, query?: string) {
  return `/enfants/${childId}${query ? `?${query}` : ""}`;
}

export async function staffEnrollChildSchoolSupportAction(
  childId: string,
  formData: FormData
) {
  const profile = await requireProfile();
  if (!canModifyChild(profile.role)) {
    redirect(childPath(childId, "error=permission"));
  }

  const programId = parseProgramId(formData.get("school_support_program_id"));
  if (!programId) {
    redirect(childPath(childId, "error=soutien-program"));
  }

  const slotIds = parseSelectedSlotIds(formData);
  const paymentReceived = formData.get("membership_payment_received") === "on";
  const supabase = await createClient();

  const parentId = await resolveParentIdForChild(supabase, childId);
  if (!parentId) {
    redirect(childPath(childId, "error=soutien-parent"));
  }

  const { settings } = await getAsblSettingsForCurrentYear();
  const feeCents = getSchoolSupportFeeCents(settings);
  const schoolYear = getCurrentSchoolYear();

  let membershipId: string | null = null;

  const { data: existingMembership } = await supabase
    .from("memberships")
    .select("id, plan, status")
    .eq("child_id", childId)
    .eq("school_year", schoolYear)
    .maybeSingle<{ id: string; plan: string; status: string }>();

  if (existingMembership) {
    if (existingMembership.plan === "SCHOOL_SUPPORT") {
      membershipId = existingMembership.id;
    } else {
      const newStatus =
        feeCents > 0 && !paymentReceived ? "AWAITING_PAYMENT" : "ACTIVE";
      const verifiedAt = newStatus === "ACTIVE" ? new Date().toISOString() : null;

      const { error: upgradeError } = await supabase
        .from("memberships")
        .update({
          plan: "SCHOOL_SUPPORT",
          fee_cents: feeCents,
          status: newStatus,
          asbl_validated_at: verifiedAt,
        })
        .eq("id", existingMembership.id);

      if (upgradeError) {
        redirect(childPath(childId, "error=soutien-membership"));
      }
      membershipId = existingMembership.id;
    }
  } else {
    const newStatus =
      feeCents > 0 && !paymentReceived ? "AWAITING_PAYMENT" : "ACTIVE";
    const verifiedAt = newStatus === "ACTIVE" ? new Date().toISOString() : null;

    const { data: created, error: createError } = await supabase
      .from("memberships")
      .insert({
        child_id: childId,
        parent_id: parentId,
        school_year: schoolYear,
        plan: "SCHOOL_SUPPORT",
        fee_cents: feeCents,
        status: newStatus,
        asbl_validated_at: verifiedAt,
      })
      .select("id")
      .single<{ id: string }>();

    if (createError || !created) {
      redirect(childPath(childId, "error=soutien-membership"));
    }
    membershipId = created.id;
  }

  const result = await enrollSchoolSupportByStaff(supabase, {
    childId,
    parentId,
    membershipId: membershipId!,
    programId,
    slotIds,
    enrolledByStaffId: profile.id,
  });

  if (!result.ok) {
    redirect(
      childPath(childId, `error=soutien-enroll&warning=${encodeURIComponent(result.error)}`)
    );
  }

  revalidatePath(childPath(childId));
  revalidatePath("/soutien-scolaire");
  revalidatePath("/");
  redirect(childPath(childId, "success=soutien-enroll"));
}

export async function staffUpdateSchoolSupportSlotsAction(
  childId: string,
  enrollmentId: string,
  formData: FormData
) {
  const profile = await requireProfile();
  if (!canModifyChild(profile.role)) {
    redirect(childPath(childId, "error=permission"));
  }

  const slotIds = parseSelectedSlotIds(formData);
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("school_support_enrollments")
    .select("id, program_id")
    .eq("id", enrollmentId)
    .eq("child_id", childId)
    .is("cancelled_at", null)
    .maybeSingle<{ id: string; program_id: string }>();

  if (!enrollment) {
    redirect(childPath(childId, "error=soutien-not-found"));
  }

  if (slotIds.length > 0) {
    const { data: slots } = await supabase
      .from("school_support_slots")
      .select("id")
      .eq("program_id", enrollment.program_id)
      .in("id", slotIds);

    if ((slots ?? []).length !== slotIds.length) {
      redirect(childPath(childId, "error=soutien-slots"));
    }
  }

  await supabase
    .from("school_support_enrollment_slots")
    .delete()
    .eq("enrollment_id", enrollmentId);

  if (slotIds.length > 0) {
    const rows = slotIds.map((slotId) => ({
      enrollment_id: enrollmentId,
      slot_id: slotId,
    }));
    const { error } = await supabase
      .from("school_support_enrollment_slots")
      .insert(rows);

    if (error) {
      redirect(childPath(childId, "error=soutien-slots"));
    }
  }

  revalidatePath(childPath(childId));
  redirect(childPath(childId, "success=soutien-slots"));
}

export async function staffActivateSchoolSupportAction(childId: string) {
  const profile = await requireProfile();
  if (!canModifyChild(profile.role)) {
    redirect(childPath(childId, "error=permission"));
  }

  const supabase = await createClient();
  const verifiedAt = new Date().toISOString();
  const schoolYear = getCurrentSchoolYear();

  const { data: membership } = await supabase
    .from("memberships")
    .select("id, status, fee_cents, plan")
    .eq("child_id", childId)
    .eq("school_year", schoolYear)
    .maybeSingle<{ id: string; status: string; fee_cents: number; plan: string }>();

  if (membership?.plan === "SCHOOL_SUPPORT") {
    if (membership.status === "AWAITING_PAYMENT" && membership.fee_cents > 0) {
      redirect(childPath(childId, "error=soutien-payment"));
    }

    if (membership.status !== "ACTIVE") {
      await supabase
        .from("memberships")
        .update({
          status: "ACTIVE",
          asbl_validated_at: verifiedAt,
        })
        .eq("id", membership.id);
    }
  }

  await supabase
    .from("children")
    .update({
      enrollment_status: "VALIDE",
      asbl_validated_at: verifiedAt,
    })
    .eq("id", childId);

  await activatePendingSchoolSupportEnrollments(supabase, childId);

  revalidatePath(childPath(childId));
  revalidatePath("/");
  revalidatePath("/soutien-scolaire");
  redirect(childPath(childId, "success=soutien-activated"));
}

export async function staffCancelSchoolSupportAction(
  childId: string,
  enrollmentId: string
) {
  const profile = await requireProfile();
  if (!canModifyChild(profile.role)) {
    redirect(childPath(childId, "error=permission"));
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("school_support_enrollments")
    .update({
      status: "CANCELLED",
      cancelled_at: now,
    })
    .eq("id", enrollmentId)
    .eq("child_id", childId);

  if (error) {
    redirect(childPath(childId, "error=soutien-cancel"));
  }

  revalidatePath(childPath(childId));
  revalidatePath("/soutien-scolaire");
  redirect(childPath(childId, "success=soutien-cancel"));
}
