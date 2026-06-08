"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { logAuditEvent } from "@/lib/audit/log-audit";

export async function updateSchoolSupportFeeAction(formData: FormData) {
  const profile = await requireProfile();

  if (!canManageUsers(profile.role)) {
    redirect("/administration?error=permission");
  }

  const eurosRaw = formData.get("school_support_fee_euros");
  const euros = typeof eurosRaw === "string" ? parseFloat(eurosRaw.replace(",", ".")) : NaN;

  if (!Number.isFinite(euros) || euros < 0 || euros > 9999) {
    redirect("/administration?error=fee");
  }

  const school_support_fee_cents = Math.round(euros * 100);
  const schoolYear = getCurrentSchoolYear();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("asbl_settings")
    .select("id, enrollment_fee_cents, school_support_fee_cents")
    .eq("school_year", schoolYear)
    .maybeSingle<{ id: string; enrollment_fee_cents: number; school_support_fee_cents: number }>();

  if (existing) {
    const { error } = await supabase
      .from("asbl_settings")
      .update({
        school_support_fee_cents,
        enrollment_fee_cents: school_support_fee_cents,
        updated_by: profile.id,
      })
      .eq("id", existing.id);

    if (error) {
      redirect("/administration?error=fee-save");
    }

    await logAuditEvent({
      action: "ASBL_SETTINGS_UPDATED",
      entityType: "asbl_settings",
      entityId: existing.id,
      actorId: profile.id,
      actorRole: profile.role,
      metadata: {
        school_year: schoolYear,
        previous_fee_cents: existing.school_support_fee_cents,
        new_fee_cents: school_support_fee_cents,
      },
    });
  } else {
    const { data: inserted, error } = await supabase.from("asbl_settings").insert({
      school_year: schoolYear,
      school_support_fee_cents,
      enrollment_fee_cents: school_support_fee_cents,
      updated_by: profile.id,
    })
    .select("id")
    .single<{ id: string }>();

    if (error || !inserted) {
      redirect("/administration?error=fee-save");
    }

    await logAuditEvent({
      action: "ASBL_SETTINGS_UPDATED",
      entityType: "asbl_settings",
      entityId: inserted.id,
      actorId: profile.id,
      actorRole: profile.role,
      metadata: {
        school_year: schoolYear,
        previous_fee_cents: 0,
        new_fee_cents: school_support_fee_cents,
      },
    });
  }

  revalidatePath("/administration");
  revalidatePath("/espace-parents");
  redirect("/administration?success=fee-updated");
}

/** @deprecated Utiliser updateSchoolSupportFeeAction */
export async function updateEnrollmentFeeAction(formData: FormData) {
  const profile = await requireProfile();

  if (!canManageUsers(profile.role)) {
    redirect("/administration?error=permission");
  }

  const eurosRaw = formData.get("enrollment_fee_euros");
  const euros = typeof eurosRaw === "string" ? parseFloat(eurosRaw.replace(",", ".")) : NaN;

  if (!Number.isFinite(euros) || euros < 0 || euros > 9999) {
    redirect("/administration?error=fee");
  }

  const school_support_fee_cents = Math.round(euros * 100);
  const schoolYear = getCurrentSchoolYear();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("asbl_settings")
    .select("id")
    .eq("school_year", schoolYear)
    .maybeSingle<{ id: string }>();

  if (existing) {
    const { error } = await supabase
      .from("asbl_settings")
      .update({
        enrollment_fee_cents: school_support_fee_cents,
        school_support_fee_cents,
        updated_by: profile.id,
      })
      .eq("id", existing.id);

    if (error) {
      redirect("/administration?error=fee-save");
    }
  } else {
    const { error } = await supabase.from("asbl_settings").insert({
      school_year: schoolYear,
      enrollment_fee_cents: school_support_fee_cents,
      school_support_fee_cents,
      updated_by: profile.id,
    });

    if (error) {
      redirect("/administration?error=fee-save");
    }
  }

  revalidatePath("/administration");
  revalidatePath("/espace-parents");
  redirect("/administration?success=fee-updated");
}
