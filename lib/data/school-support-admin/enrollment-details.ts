import { createClient } from "@/lib/supabase/server";
import { formatSlotSchedule, type SchoolSupportSlot } from "@/types/school-support";
import type { SchoolSupportEnrollmentDetails } from "@/lib/data/school-support-admin/types";

export async function loadSchoolSupportEnrollmentDetails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  childIds: string[]
): Promise<Map<string, SchoolSupportEnrollmentDetails>> {
  const map = new Map<string, SchoolSupportEnrollmentDetails>();

  if (childIds.length === 0) return map;

  const { data: enrollRows } = await supabase
    .from("school_support_enrollments")
    .select(
      `
      id,
      child_id,
      status,
      school_support_programs ( title )
    `
    )
    .in("child_id", childIds)
    .in("status", ["PENDING", "ACTIVE"])
    .is("cancelled_at", null);

  type EnrollRow = {
    id: string;
    child_id: string;
    status: string;
    school_support_programs: { title: string } | null;
  };

  const enrollments = (enrollRows ?? []) as EnrollRow[];
  if (enrollments.length === 0) return map;

  const enrollmentIds = enrollments.map((e) => e.id);

  const { data: slotLinkRows } = await supabase
    .from("school_support_enrollment_slots")
    .select("enrollment_id, slot_id")
    .in("enrollment_id", enrollmentIds);

  const slotIds = [
    ...new Set(((slotLinkRows ?? []) as { slot_id: string }[]).map((r) => r.slot_id)),
  ];

  let slotMap = new Map<string, SchoolSupportSlot>();
  if (slotIds.length > 0) {
    const { data: slotRows } = await supabase
      .from("school_support_slots")
      .select("id, program_id, day_of_week, start_time, end_time, location, label")
      .in("id", slotIds);

    slotMap = new Map(
      ((slotRows ?? []) as SchoolSupportSlot[]).map((s) => [s.id, s])
    );
  }

  const linksByEnrollment = new Map<string, string[]>();
  for (const link of (slotLinkRows ?? []) as { enrollment_id: string; slot_id: string }[]) {
    const current = linksByEnrollment.get(link.enrollment_id) ?? [];
    current.push(link.slot_id);
    linksByEnrollment.set(link.enrollment_id, current);
  }

  for (const enroll of enrollments) {
    const chosenIds = linksByEnrollment.get(enroll.id) ?? [];
    const slot_labels = chosenIds
      .map((id) => slotMap.get(id))
      .filter(Boolean)
      .map((slot) => formatSlotSchedule(slot!));

    map.set(enroll.child_id, {
      program_title: enroll.school_support_programs?.title ?? null,
      slot_labels,
      program_enrollment_status: enroll.status,
    });
  }

  return map;
}
