"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";

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
  const ipHash = await getAuditIpHash();

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
      ipHash,
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
      ipHash,
    });
  }

  revalidatePath("/administration");
  revalidatePath("/espace-parents");
  redirect("/administration?success=fee-updated");
}

export async function updateBankTransferSettingsAction(formData: FormData) {
  const profile = await requireProfile();

  if (!canManageUsers(profile.role)) {
    redirect("/administration?error=permission");
  }

  const ibanRaw = formData.get("bank_iban");
  const holderRaw = formData.get("bank_account_holder");
  const instructionsRaw = formData.get("bank_transfer_instructions");

  const bank_iban =
    typeof ibanRaw === "string" ? ibanRaw.replace(/\s+/g, "").toUpperCase().trim() : "";
  const bank_account_holder =
    typeof holderRaw === "string" ? holderRaw.trim().slice(0, 120) : "";
  const bank_transfer_instructions =
    typeof instructionsRaw === "string" ? instructionsRaw.trim().slice(0, 500) : null;

  if (bank_iban.length > 0 && (bank_iban.length < 15 || !/^[A-Z]{2}[0-9A-Z]+$/.test(bank_iban))) {
    redirect("/administration?error=bank-iban");
  }

  if (bank_iban.length > 0 && bank_account_holder.length === 0) {
    redirect("/administration?error=bank-holder");
  }

  const schoolYear = getCurrentSchoolYear();
  const supabase = await createClient();
  const ipHash = await getAuditIpHash();

  const { data: existing } = await supabase
    .from("asbl_settings")
    .select("id")
    .eq("school_year", schoolYear)
    .maybeSingle<{ id: string }>();

  const payload = {
    bank_iban: bank_iban.length > 0 ? bank_iban : null,
    bank_account_holder: bank_account_holder.length > 0 ? bank_account_holder : null,
    bank_transfer_instructions:
      bank_transfer_instructions && bank_transfer_instructions.length > 0
        ? bank_transfer_instructions
        : null,
    updated_by: profile.id,
  };

  if (existing) {
    const { error } = await supabase.from("asbl_settings").update(payload).eq("id", existing.id);
    if (error) redirect("/administration?error=bank-save");

    await logAuditEvent({
      action: "ASBL_SETTINGS_UPDATED",
      entityType: "asbl_settings",
      entityId: existing.id,
      actorId: profile.id,
      actorRole: profile.role,
      metadata: { school_year: schoolYear, bank_transfer: true },
      ipHash,
    });
  } else {
    const { data: inserted, error } = await supabase
      .from("asbl_settings")
      .insert({
        school_year: schoolYear,
        enrollment_fee_cents: 0,
        school_support_fee_cents: 0,
        ...payload,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !inserted) redirect("/administration?error=bank-save");

    await logAuditEvent({
      action: "ASBL_SETTINGS_UPDATED",
      entityType: "asbl_settings",
      entityId: inserted.id,
      actorId: profile.id,
      actorRole: profile.role,
      metadata: { school_year: schoolYear, bank_transfer: true },
      ipHash,
    });
  }

  revalidatePath("/administration");
  revalidatePath("/espace-parents");
  redirect("/administration?success=bank-updated");
}

/** @deprecated Utiliser updateSchoolSupportFeeAction */
export async function updateEnrollmentFeeAction(formData: FormData) {
  const mapped = new FormData();
  const euros = formData.get("enrollment_fee_euros");
  if (typeof euros === "string") {
    mapped.set("school_support_fee_euros", euros);
  }
  return updateSchoolSupportFeeAction(mapped);
}
