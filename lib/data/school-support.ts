import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolYear } from "@/lib/school-year";
import type {
  SchoolSupportProgram,
  SchoolSupportSlot,
  SchoolSupportEnrollment,
} from "@/types/school-support";

type ProgramRow = {
  id: string;
  school_year: string;
  title: string;
  description: string | null;
  max_participants: number | null;
  status: SchoolSupportProgram["status"];
  parent_registration_open: boolean;
};

async function attachSlotsAndCounts(
  programs: ProgramRow[]
): Promise<SchoolSupportProgram[]> {
  if (programs.length === 0) return [];

  const supabase = await createClient();
  const ids = programs.map((p) => p.id);

  const [{ data: slotRows }, { data: enrollRows }] = await Promise.all([
    supabase
      .from("school_support_slots")
      .select("id, program_id, day_of_week, start_time, end_time, location, label, max_participants")
      .in("program_id", ids)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("school_support_enrollments")
      .select("program_id")
      .in("program_id", ids)
      .eq("status", "ACTIVE")
      .is("cancelled_at", null),
  ]);

  const slotsByProgram = new Map<string, SchoolSupportSlot[]>();
  for (const s of (slotRows ?? []) as SchoolSupportSlot[]) {
    const list = slotsByProgram.get(s.program_id) ?? [];
    list.push(s);
    slotsByProgram.set(s.program_id, list);
  }

  const countByProgram = new Map<string, number>();
  for (const e of (enrollRows ?? []) as { program_id: string }[]) {
    countByProgram.set(e.program_id, (countByProgram.get(e.program_id) ?? 0) + 1);
  }

  return programs.map((p) => ({
    ...p,
    slots: slotsByProgram.get(p.id) ?? [],
    enrollment_count: countByProgram.get(p.id) ?? 0,
  }));
}

export async function getStaffSchoolSupportPrograms(): Promise<{
  programs: SchoolSupportProgram[];
  loadError: string | null;
}> {
  const supabase = await createClient();
  const schoolYear = getCurrentSchoolYear();

  const { data, error } = await supabase
    .from("school_support_programs")
    .select("id, school_year, title, description, max_participants, status, parent_registration_open")
    .eq("school_year", schoolYear)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("school_support_programs")) {
      return {
        programs: [],
        loadError: "Lance 017_school_support_module.sql dans Supabase.",
      };
    }
    return { programs: [], loadError: error.message };
  }

  const programs = await attachSlotsAndCounts((data ?? []) as ProgramRow[]);
  return { programs, loadError: null };
}

/** Programmes OPEN pour inscription manuelle staff (tous les OPEN, pas seulement parent_registration_open). */
export async function getStaffOpenSchoolSupportPrograms(): Promise<{
  programs: SchoolSupportProgram[];
  loadError: string | null;
}> {
  const supabase = await createClient();
  const schoolYear = getCurrentSchoolYear();

  const { data, error } = await supabase
    .from("school_support_programs")
    .select("id, school_year, title, description, max_participants, status, parent_registration_open")
    .eq("school_year", schoolYear)
    .eq("status", "OPEN")
    .is("deleted_at", null)
    .order("title", { ascending: true });

  if (error) {
    if (error.message.includes("school_support_programs")) {
      return {
        programs: [],
        loadError: "Lance 017_school_support_module.sql dans Supabase.",
      };
    }
    return { programs: [], loadError: error.message };
  }

  const programs = await attachSlotsAndCounts((data ?? []) as ProgramRow[]);
  return { programs, loadError: null };
}

export async function getStaffSchoolSupportProgramById(
  id: string
): Promise<SchoolSupportProgram | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("school_support_programs")
    .select("id, school_year, title, description, max_participants, status, parent_registration_open")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;

  const [program] = await attachSlotsAndCounts([data as ProgramRow]);
  return program ?? null;
}

export async function getParentOpenSchoolSupportPrograms(): Promise<{
  programs: SchoolSupportProgram[];
  loadError: string | null;
}> {
  const supabase = await createClient();
  const schoolYear = getCurrentSchoolYear();

  const { data, error } = await supabase
    .from("school_support_programs")
    .select("id, school_year, title, description, max_participants, status, parent_registration_open")
    .eq("school_year", schoolYear)
    .eq("status", "OPEN")
    .eq("parent_registration_open", true)
    .is("deleted_at", null)
    .order("title", { ascending: true });

  if (error) {
    if (error.message.includes("school_support_programs")) {
      return {
        programs: [],
        loadError: "Lance 017_school_support_module.sql dans Supabase.",
      };
    }
    return { programs: [], loadError: error.message };
  }

  const programs = await attachSlotsAndCounts((data ?? []) as ProgramRow[]);
  return { programs, loadError: null };
}

export async function getParentSchoolSupportEnrollments(): Promise<
  SchoolSupportEnrollment[]
> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("school_support_enrollments")
    .select("id, program_id, child_id, parent_id, status, enrolled_at")
    .in("status", ["ACTIVE", "PENDING"])
    .is("cancelled_at", null);

  return (data ?? []) as SchoolSupportEnrollment[];
}

export async function getProgramEnrollments(programId: string): Promise<
  {
    id: string;
    child_first_name: string;
    child_last_name: string;
    parent_name: string;
    enrolled_at: string;
  }[]
> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("school_support_enrollments")
    .select("id, child_id, parent_id, enrolled_at")
    .eq("program_id", programId)
    .eq("status", "ACTIVE")
    .is("cancelled_at", null)
    .order("enrolled_at", { ascending: false });

  if (!rows?.length) return [];

  const enrollments = rows as {
    id: string;
    child_id: string;
    parent_id: string;
    enrolled_at: string;
  }[];

  const childIds = [...new Set(enrollments.map((e) => e.child_id))];
  const parentIds = [...new Set(enrollments.map((e) => e.parent_id))];

  const [{ data: children }, { data: profiles }] = await Promise.all([
    supabase.from("children").select("id, first_name, last_name").in("id", childIds),
    supabase.from("profiles").select("id, full_name").in("id", parentIds),
  ]);

  const childMap = new Map(
    ((children ?? []) as { id: string; first_name: string; last_name: string }[]).map(
      (c) => [c.id, c]
    )
  );
  const profileMap = new Map(
    ((profiles ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p])
  );

  return enrollments.map((e) => {
    const child = childMap.get(e.child_id);
    const parent = profileMap.get(e.parent_id);
    return {
      id: e.id,
      child_first_name: child?.first_name ?? "Enfant",
      child_last_name: child?.last_name ?? "",
      parent_name: parent?.full_name ?? "Parent",
      enrolled_at: e.enrolled_at,
    };
  });
}
