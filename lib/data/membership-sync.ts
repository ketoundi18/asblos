import { createClient } from "@/lib/supabase/server";
import { getAsblSettingsForCurrentYear, getSchoolSupportFeeCents } from "@/lib/data/asbl-settings";
import { getCurrentSchoolYear } from "@/lib/school-year";
import type { Membership, MembershipPlan, MembershipStatus } from "@/lib/data/memberships";

async function inferMembership(
  child: {
    enrollment_status: string | null;
    created_via: string | null;
    asbl_validated_at: string | null;
  },
  schoolSupportFeeCents: number
): Promise<{ plan: MembershipPlan; status: MembershipStatus; fee_cents: number }> {
  const es = child.enrollment_status;

  if (es === "EN_ATTENTE_PAIEMENT") {
    return {
      plan: "SCHOOL_SUPPORT",
      status: "AWAITING_PAYMENT",
      fee_cents: schoolSupportFeeCents,
    };
  }

  if (es === "PAYE_EN_ATTENTE_ASBL") {
    return {
      plan: "SCHOOL_SUPPORT",
      status: "AWAITING_ASBL",
      fee_cents: schoolSupportFeeCents,
    };
  }

  if (es === "VALIDE" || child.asbl_validated_at) {
    return {
      plan: "BASE",
      status: "ACTIVE",
      fee_cents: 0,
    };
  }

  return {
    plan: "BASE",
    status: "AWAITING_ASBL",
    fee_cents: 0,
  };
}

/** Crée une adhésion manquante pour un enfant lié (ex. Lucas créé avant migration 014). */
export async function ensureMembershipForChild(
  childId: string,
  parentId: string
): Promise<Membership | null> {
  const supabase = await createClient();
  const schoolYear = getCurrentSchoolYear();

  const { data: existing } = await supabase
    .from("memberships")
    .select("id, child_id, parent_id, school_year, plan, fee_cents, status, asbl_validated_at")
    .eq("child_id", childId)
    .eq("school_year", schoolYear)
    .maybeSingle<Membership & { plan?: MembershipPlan }>();

  if (existing) {
    const plan =
      existing.plan ??
      (existing.fee_cents > 0 ? ("SCHOOL_SUPPORT" as const) : ("BASE" as const));
    return { ...existing, plan };
  }

  const { data: child } = await supabase
    .from("children")
    .select("enrollment_status, created_via, asbl_validated_at")
    .eq("id", childId)
    .is("deleted_at", null)
    .maybeSingle<{
      enrollment_status: string | null;
      created_via: string | null;
      asbl_validated_at: string | null;
    }>();

  if (!child) return null;

  const { settings } = await getAsblSettingsForCurrentYear();
  const schoolSupportFeeCents = getSchoolSupportFeeCents(settings);
  const inferred = await inferMembership(child, schoolSupportFeeCents);

  const { data: inserted, error } = await supabase
    .from("memberships")
    .insert({
      child_id: childId,
      parent_id: parentId,
      school_year: schoolYear,
      plan: inferred.plan,
      fee_cents: inferred.fee_cents,
      status: inferred.status,
      asbl_validated_at: inferred.status === "ACTIVE" ? child.asbl_validated_at : null,
    })
    .select("id, child_id, parent_id, school_year, plan, fee_cents, status, asbl_validated_at")
    .single<Membership & { plan?: MembershipPlan }>();

  if (error || !inserted) return null;

  const plan =
    inserted.plan ??
    (inserted.fee_cents > 0 ? ("SCHOOL_SUPPORT" as const) : ("BASE" as const));
  return { ...inserted, plan };
}

/** Synchronise les adhésions pour tous les enfants vérifiés du parent connecté. */
export async function syncMissingMembershipsForCurrentParent(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: links } = await supabase
    .from("parent_child_links")
    .select("child_id")
    .eq("parent_id", user.id)
    .not("verified_at", "is", null);

  for (const link of (links ?? []) as { child_id: string }[]) {
    await ensureMembershipForChild(link.child_id, user.id);
  }
}
