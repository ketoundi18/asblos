import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server-types";

type Result = { ok: true; enrollmentId: string } | { ok: false; error: string };

export async function enrollSchoolSupportAtSignup(
  supabase: ServerSupabase,
  params: {
    childId: string;
    parentId: string;
    membershipId: string;
    programId: string;
    slotIds: string[];
  }
): Promise<Result> {
  const { childId, parentId, membershipId, programId, slotIds } = params;

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
    return { ok: false, error: "Ce programme n'est plus disponible." };
  }

  if (program.max_participants != null) {
    const { count } = await supabase
      .from("school_support_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("program_id", programId)
      .in("status", ["ACTIVE", "PENDING"])
      .is("cancelled_at", null);

    if ((count ?? 0) >= program.max_participants) {
      return { ok: false, error: "Ce programme est complet." };
    }
  }

  let validSlotIds: string[] = [];
  if (slotIds.length > 0) {
    const { data: slots } = await supabase
      .from("school_support_slots")
      .select("id")
      .eq("program_id", programId)
      .in("id", slotIds);

    validSlotIds = ((slots ?? []) as { id: string }[]).map((s) => s.id);
    if (validSlotIds.length !== slotIds.length) {
      return { ok: false, error: "Un ou plusieurs créneaux choisis ne sont plus valides." };
    }
  }

  const { data: enrollment, error: enrollError } = await supabase
    .from("school_support_enrollments")
    .insert({
      program_id: programId,
      child_id: childId,
      parent_id: parentId,
      membership_id: membershipId,
      status: "PENDING",
      enrolled_by: parentId,
    })
    .select("id")
    .single<{ id: string }>();

  let enrollmentId = enrollment?.id;

  if ((enrollError || !enrollment) && isPendingStatusUnsupported(enrollError)) {
    const retry = await supabase
      .from("school_support_enrollments")
      .insert({
        program_id: programId,
        child_id: childId,
        parent_id: parentId,
        membership_id: membershipId,
        status: "ACTIVE",
        enrolled_by: parentId,
      })
      .select("id")
      .single<{ id: string }>();

    if (retry.error || !retry.data) {
      return {
        ok: false,
        error: retry.error?.message ?? "Impossible d'enregistrer l'inscription au programme.",
      };
    }
    enrollmentId = retry.data.id;
  } else if (enrollError || !enrollment) {
    if (enrollError?.code === "23505" || enrollError?.message.includes("unique")) {
      return { ok: false, error: "Cet enfant est déjà inscrit à ce programme." };
    }
    return {
      ok: false,
      error: enrollError?.message ?? "Impossible d'enregistrer l'inscription au programme.",
    };
  }

  if (!enrollmentId) {
    return { ok: false, error: "Impossible d'enregistrer l'inscription au programme." };
  }

  if (validSlotIds.length > 0) {
    const rows = validSlotIds.map((slotId) => ({
      enrollment_id: enrollmentId,
      slot_id: slotId,
    }));

    const { error: slotsError } = await supabase
      .from("school_support_enrollment_slots")
      .insert(rows);

    if (slotsError) {
      // Créneaux optionnels — l'inscription au programme reste valide sans eux
    }
  }

  return { ok: true, enrollmentId };
}

function isPendingStatusUnsupported(error: { message?: string; code?: string } | null): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("pending") &&
    (msg.includes("enum") || msg.includes("invalid input value"))
  );
}
