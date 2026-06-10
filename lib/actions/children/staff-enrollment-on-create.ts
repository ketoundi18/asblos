import { createClient } from "@/lib/supabase/server";
import { getAsblSettingsForCurrentYear } from "@/lib/data/asbl-settings";
import { getCurrentSchoolYear } from "@/lib/school-year";
import {
  buildStaffEnrollmentQuote,
  parseMembershipPlan,
  parseProgramId,
  parseSelectedSlotIds,
} from "@/lib/asbl/fee-utils";
import { resolveParentProfileByEmail } from "@/lib/enrollment/resolve-parent-by-email";
import { enrollSchoolSupportByStaff } from "@/lib/enrollment/enroll-school-support-by-staff";
import {
  rollbackStaffEnrollmentAttach,
  rollbackStaffMembershipOnly,
} from "@/lib/enrollment/rollback-staff-enrollment-attach";
import { emptyToNull } from "@/lib/actions/children/child-form-parsing";

export type StaffEnrollmentAttachResult = {
  fieldErrors?: Record<string, string>;
  enrollmentWarning?: string;
};

export function validateStaffEnrollmentInput(
  formData: FormData,
  guardianEmailInput?: string
): Record<string, string> | null {
  const plan = parseMembershipPlan(formData.get("membership_plan"));
  const guardianEmail = emptyToNull(guardianEmailInput);

  if (plan === "SCHOOL_SUPPORT" && !guardianEmail) {
    return {
      guardian_email:
        "Indiquez l'e-mail du parent pour inscrire au soutien scolaire.",
    };
  }

  return null;
}

export async function attachStaffEnrollmentOnCreate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  staffProfileId: string,
  formData: FormData,
  childId: string,
  guardianId: string,
  guardianEmailInput?: string
): Promise<StaffEnrollmentAttachResult> {
  const plan = parseMembershipPlan(formData.get("membership_plan"));
  const guardianEmail = emptyToNull(guardianEmailInput);

  if (!guardianEmail) {
    return {};
  }

  const parent = await resolveParentProfileByEmail(supabase, guardianEmail);
  if (!parent) {
    if (plan === "SCHOOL_SUPPORT") {
      return {
        fieldErrors: {
          guardian_email:
            "Aucun compte parent actif avec cet e-mail. Créez d'abord le compte parent.",
        },
      };
    }
    return {};
  }
  const paymentReceived = formData.get("membership_payment_received") === "on";
  const { settings } = await getAsblSettingsForCurrentYear();
  const quote = buildStaffEnrollmentQuote(plan, settings, paymentReceived);
  const programId = parseProgramId(formData.get("school_support_program_id"));
  const slotIds = parseSelectedSlotIds(formData);
  const verifiedAt =
    quote.membershipStatus === "ACTIVE" ? new Date().toISOString() : null;

  const { error: linkError } = await supabase.from("parent_child_links").insert({
    parent_id: parent.id,
    child_id: childId,
    guardian_id: guardianId,
    verified_at: verifiedAt,
  });

  if (linkError && !linkError.message.includes("unique")) {
    return {
      fieldErrors: {
        guardian_email: `Lien parent impossible (${linkError.message}).`,
      },
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .insert({
      child_id: childId,
      parent_id: parent.id,
      school_year: getCurrentSchoolYear(),
      plan: quote.membershipPlan,
      fee_cents: quote.totalCents,
      status: quote.membershipStatus,
      asbl_validated_at: verifiedAt,
    })
    .select("id")
    .single<{ id: string }>();

  if (membershipError || !membership) {
    await rollbackStaffEnrollmentAttach(supabase, childId, parent.id);
    return {
      fieldErrors: {
        guardian_email:
          "Adhésion non enregistrée. Vérifie la migration 022 dans Supabase ou réessaie.",
      },
    };
  }

  if (plan === "SCHOOL_SUPPORT" && programId) {
    const enrollResult = await enrollSchoolSupportByStaff(supabase, {
      childId,
      parentId: parent.id,
      membershipId: membership.id,
      programId,
      slotIds,
      enrolledByStaffId: staffProfileId,
    });

    if (!enrollResult.ok) {
      await rollbackStaffMembershipOnly(supabase, membership.id);
      await rollbackStaffEnrollmentAttach(supabase, childId, parent.id);
      const message =
        enrollResult.error === "already_enrolled"
          ? "Cet enfant est déjà inscrit à ce programme."
          : enrollResult.error === "slots_failed"
            ? "Les créneaux n'ont pas pu être enregistrés. Réessaie."
          : enrollResult.error === "enroll_failed"
            ? "Inscription au soutien impossible. Réessaie ou choisis un autre programme."
            : enrollResult.error;
      return {
        fieldErrors: {
          school_support_program_id: message,
        },
      };
    }
  }

  return {};
}
