import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getAsblSettingsForCurrentYear, formatEnrollmentFeeLabel, getSchoolSupportFeeCents } from "@/lib/data/asbl-settings";
import { getMembershipForChildCurrentYear } from "@/lib/data/memberships";
import { getStaffOpenSchoolSupportPrograms } from "@/lib/data/school-support";
import { formatSlotSchedule, type SchoolSupportSlot } from "@/types/school-support";
import { resolveParentIdForChild } from "@/lib/enrollment/resolve-parent-for-child";

export type ChildSchoolSupportStaffContext = {
  loadError: string | null;
  parentId: string | null;
  parentMissing: boolean;
  membership: {
    id: string;
    plan: string;
    status: string;
    feeCents: number;
  } | null;
  enrollment: {
    id: string;
    programId: string;
    programTitle: string;
    status: string;
    selectedSlotIds: string[];
    slots: SchoolSupportSlot[];
  } | null;
  programs: {
    id: string;
    title: string;
    description: string | null;
    slots: SchoolSupportSlot[];
  }[];
  schoolSupportFeeCents: number;
  schoolSupportFeeLabel: string;
};

export async function getChildSchoolSupportStaffContext(
  childId: string
): Promise<ChildSchoolSupportStaffContext> {
  const supabase = await createClient();
  const [{ settings }, { programs, loadError: programsError }, membership, parentId] =
    await Promise.all([
      getAsblSettingsForCurrentYear(),
      getStaffOpenSchoolSupportPrograms(),
      getMembershipForChildCurrentYear(childId),
      resolveParentIdForChild(supabase, childId),
    ]);

  const feeCents = getSchoolSupportFeeCents(settings);
  const base = {
    loadError: programsError,
    parentId,
    parentMissing: !parentId,
    membership: membership
      ? {
          id: membership.id,
          plan: membership.plan,
          status: membership.status,
          feeCents: membership.fee_cents,
        }
      : null,
    enrollment: null as ChildSchoolSupportStaffContext["enrollment"],
    programs: programs.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      slots: p.slots,
    })),
    schoolSupportFeeCents: feeCents,
    schoolSupportFeeLabel: formatEnrollmentFeeLabel(feeCents),
  };

  const { data: enrollRow, error: enrollError } = await supabase
    .from("school_support_enrollments")
    .select(
      `
      id,
      status,
      program_id,
      school_support_programs ( title, id )
    `
    )
    .eq("child_id", childId)
    .in("status", ["ACTIVE", "PENDING"])
    .is("cancelled_at", null)
    .maybeSingle();

  if (enrollError || !enrollRow) {
    return base;
  }

  type Row = {
    id: string;
    status: string;
    program_id: string;
    school_support_programs: { title: string; id: string } | null;
  };
  const row = enrollRow as Row;
  const program = row.school_support_programs;
  if (!program) return base;

  const { data: chosenRows } = await supabase
    .from("school_support_enrollment_slots")
    .select("slot_id")
    .eq("enrollment_id", row.id);

  const selectedSlotIds = ((chosenRows ?? []) as { slot_id: string }[]).map(
    (r) => r.slot_id
  );

  const { data: slotRows } = await supabase
    .from("school_support_slots")
    .select("id, program_id, day_of_week, start_time, end_time, location, label")
    .eq("program_id", row.program_id)
    .order("day_of_week", { ascending: true });

  return {
    ...base,
    enrollment: {
      id: row.id,
      programId: row.program_id,
      programTitle: program.title,
      status: row.status,
      selectedSlotIds,
      slots: (slotRows ?? []) as SchoolSupportSlot[],
    },
  };
}

export { formatSlotSchedule };
