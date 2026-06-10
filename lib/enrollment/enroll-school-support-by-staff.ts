import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server-types";
import { reportError } from "@/lib/monitoring/report-error";

type Result = { ok: true; enrollmentId: string } | { ok: false; error: string };

export async function enrollSchoolSupportByStaff(
  supabase: ServerSupabase,
  params: {
    childId: string;
    parentId: string;
    membershipId: string;
    programId: string;
    slotIds: string[];
    enrolledByStaffId: string;
  }
): Promise<Result> {
  const { childId, parentId, membershipId, programId, slotIds, enrolledByStaffId } =
    params;

  const { data: program } = await supabase
    .from("school_support_programs")
    .select("id, max_participants, status")
    .eq("id", programId)
    .is("deleted_at", null)
    .maybeSingle<{
      id: string;
      max_participants: number | null;
      status: string;
    }>();

  if (!program || program.status !== "OPEN") {
    return { ok: false, error: "Ce programme n'est pas ouvert aux inscriptions." };
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
      return {
        ok: false,
        error: "Un ou plusieurs créneaux choisis ne sont plus valides.",
      };
    }
  }

  const { data: enrollment, error: enrollError } = await supabase
    .from("school_support_enrollments")
    .insert({
      program_id: programId,
      child_id: childId,
      parent_id: parentId,
      membership_id: membershipId,
      status: "ACTIVE",
      enrolled_by: enrolledByStaffId,
    })
    .select("id")
    .single<{ id: string }>();

  if (enrollError || !enrollment) {
    if (enrollError?.code === "23505" || enrollError?.message.includes("unique")) {
      return { ok: false, error: "already_enrolled" };
    }
    void reportError(
      enrollError ?? new Error("school_support_enrollments insert failed"),
      {
        surface: "enroll-school-support-by-staff",
        childId,
        programId,
      }
    );
    return { ok: false, error: "enroll_failed" };
  }

  if (validSlotIds.length > 0) {
    const rows = validSlotIds.map((slotId) => ({
      enrollment_id: enrollment.id,
      slot_id: slotId,
    }));

    const { error: slotsError } = await supabase
      .from("school_support_enrollment_slots")
      .insert(rows);

    if (slotsError) {
      await supabase
        .from("school_support_enrollments")
        .delete()
        .eq("id", enrollment.id);
      return { ok: false, error: "slots_failed" };
    }
  }

  return { ok: true, enrollmentId: enrollment.id };
}
