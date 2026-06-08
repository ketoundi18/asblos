import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server-types";
import type { EnrollmentQuote } from "@/lib/asbl/fee-utils";
import type { Database } from "@/types/database";
import { rollbackPartialParentEnrollment } from "@/lib/enrollment/rollback-parent-enrollment";

type GuardianRelation = Database["public"]["Enums"]["guardian_relation"];
type ChildInsert = Database["public"]["Tables"]["children"]["Insert"];
type GuardianInsert = Database["public"]["Tables"]["guardians"]["Insert"];

export type ParentEnrollmentCoreInput = {
  profileId: string;
  profileEmail: string;
  schoolYear: string;
  quote: EnrollmentQuote;
  child: Omit<ChildInsert, "created_by" | "created_via" | "enrollment_status"> & {
    enrollment_status: ChildInsert["enrollment_status"];
  };
  guardian: Omit<GuardianInsert, "child_id">;
};

export type ParentEnrollmentCoreResult =
  | { ok: true; childId: string; membershipId: string }
  | { ok: false; error: string };

function mapRpcError(message: string): string {
  if (message.includes("permission_denied")) {
    return "Seuls les comptes parents peuvent inscrire un enfant ici.";
  }
  if (message.includes("duplicate") || message.includes("unique")) {
    return "Une inscription existe déjà pour cet enfant cette année.";
  }
  return message;
}

async function createViaRpc(
  supabase: ServerSupabase,
  input: ParentEnrollmentCoreInput
): Promise<ParentEnrollmentCoreResult | null> {
  const { child, guardian, quote, schoolYear } = input;

  const { data, error } = await supabase.rpc("create_parent_enrollment_core", {
    p_first_name: child.first_name,
    p_last_name: child.last_name,
    p_birth_date: child.birth_date,
    p_school_name: child.school_name ?? "",
    p_school_class: child.school_class ?? "",
    p_allergies: child.allergies ?? "",
    p_image_rights: child.image_rights ?? false,
    p_outing_authorization: child.outing_authorization ?? false,
    p_emergency_contact_name: child.emergency_contact_name ?? "",
    p_emergency_contact_phone: child.emergency_contact_phone ?? "",
    p_guardian_relation: guardian.relation as GuardianRelation,
    p_guardian_first_name: guardian.first_name,
    p_guardian_last_name: guardian.last_name,
    p_guardian_email: guardian.email ?? "",
    p_guardian_phone: guardian.phone,
    p_guardian_can_pickup: guardian.can_pickup ?? true,
    p_enrollment_status: quote.enrollmentStatus,
    p_membership_plan: quote.membershipPlan,
    p_fee_cents: quote.totalCents,
    p_membership_status: quote.membershipStatus,
    p_school_year: schoolYear,
  } as never);

  if (error) {
    if (
      error.message.includes("Could not find the function") ||
      error.message.includes("create_parent_enrollment_core")
    ) {
      return null;
    }
    return { ok: false, error: mapRpcError(error.message) };
  }

  const payload = data as {
    child_id?: string;
    membership_id?: string;
  } | null;

  if (!payload?.child_id || !payload?.membership_id) {
    return { ok: false, error: "Réponse incomplète du serveur." };
  }

  return {
    ok: true,
    childId: payload.child_id,
    membershipId: payload.membership_id,
  };
}

async function createViaSteps(
  supabase: ServerSupabase,
  input: ParentEnrollmentCoreInput
): Promise<ParentEnrollmentCoreResult> {
  const { profileId, quote, schoolYear, child, guardian } = input;

  const { data: createdChild, error: childError } = await supabase
    .from("children")
    .insert({
      ...child,
      created_by: profileId,
      created_via: "PARENT",
    } as never)
    .select("id")
    .single<{ id: string }>();

  if (childError || !createdChild) {
    const detail = childError?.message ?? "erreur inconnue";
    return {
      ok: false,
      error: `Impossible d'enregistrer la fiche enfant (${detail}). Vérifie que la migration 010 est lancée dans Supabase.`,
    };
  }

  const childId = createdChild.id;

  const { data: createdGuardian, error: guardianError } = await supabase
    .from("guardians")
    .insert({ ...guardian, child_id: childId } as never)
    .select("id")
    .single<{ id: string }>();

  if (guardianError || !createdGuardian) {
    await rollbackPartialParentEnrollment(childId);
    const detail = guardianError?.message ?? "erreur inconnue";
    return {
      ok: false,
      error: `Impossible d'enregistrer vos coordonnées (${detail}). Réessayez.`,
    };
  }

  const { error: linkError } = await supabase.from("parent_child_links").insert({
    parent_id: profileId,
    child_id: childId,
    guardian_id: createdGuardian.id,
  } as never);

  if (linkError) {
    await rollbackPartialParentEnrollment(childId);
    return {
      ok: false,
      error: `Lien parent non enregistré (${linkError.message}). Lance 010_parent_enrollment.sql dans Supabase.`,
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .insert({
      child_id: childId,
      parent_id: profileId,
      school_year: schoolYear,
      plan: quote.membershipPlan,
      fee_cents: quote.totalCents,
      status: quote.membershipStatus,
    } as never)
    .select("id")
    .single<{ id: string }>();

  if (membershipError || !membership) {
    await rollbackPartialParentEnrollment(childId);
    const detail = membershipError?.message ?? "erreur inconnue";
    return {
      ok: false,
      error: `Adhésion non enregistrée (${detail}). Lance 014_memberships_v2.sql (ou 026) dans Supabase.`,
    };
  }

  return { ok: true, childId, membershipId: membership.id };
}

export async function createParentEnrollmentCore(
  supabase: ServerSupabase,
  input: ParentEnrollmentCoreInput
): Promise<ParentEnrollmentCoreResult> {
  const viaRpc = await createViaRpc(supabase, input);
  if (viaRpc) return viaRpc;
  return createViaSteps(supabase, input);
}
