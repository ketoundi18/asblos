"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getCurrentSchoolYear } from "@/lib/school-year";

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

  const enrollment_fee_cents = Math.round(euros * 100);
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
        enrollment_fee_cents,
        updated_by: profile.id,
      } as never)
      .eq("id", existing.id);

    if (error) {
      redirect("/administration?error=fee-save");
    }
  } else {
    const { error } = await supabase.from("asbl_settings").insert({
      school_year: schoolYear,
      enrollment_fee_cents,
      updated_by: profile.id,
    } as never);

    if (error) {
      redirect("/administration?error=fee-save");
    }
  }

  revalidatePath("/administration");
  revalidatePath("/espace-parents");
  redirect("/administration?success=fee-updated");
}
