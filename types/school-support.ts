export type MembershipPlan = "BASE" | "SCHOOL_SUPPORT";

export type SchoolSupportProgramStatus = "DRAFT" | "OPEN" | "CLOSED";

export type SchoolSupportEnrollmentStatus = "ACTIVE" | "CANCELLED" | "PENDING";

export type SchoolSupportSlot = {
  id: string;
  program_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string | null;
  location: string | null;
  label: string | null;
  max_participants: number | null;
};

export type SchoolSupportProgram = {
  id: string;
  school_year: string;
  title: string;
  description: string | null;
  max_participants: number | null;
  status: SchoolSupportProgramStatus;
  parent_registration_open: boolean;
  slots: SchoolSupportSlot[];
  enrollment_count: number;
};

export type SchoolSupportEnrollment = {
  id: string;
  program_id: string;
  child_id: string;
  parent_id: string;
  status: SchoolSupportEnrollmentStatus;
  enrolled_at: string;
};

const DAY_LABELS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

export function formatDayOfWeek(day: number): string {
  return DAY_LABELS[day] ?? `Jour ${day}`;
}

export function formatSlotTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const min = m?.slice(0, 2) ?? "00";
  if (min === "00") return `${hour}h`;
  return `${hour}h${min}`;
}

export function formatSlotSchedule(slot: SchoolSupportSlot): string {
  const day = formatDayOfWeek(slot.day_of_week);
  const start = formatSlotTime(slot.start_time);
  const end = slot.end_time ? formatSlotTime(slot.end_time) : null;
  const time = end ? `${start} – ${end}` : start;
  const place = slot.location ? ` · ${slot.location}` : "";
  const label = slot.label ? ` (${slot.label})` : "";
  return `${day} ${time}${label}${place}`;
}

export const PROGRAM_STATUS_LABELS: Record<SchoolSupportProgramStatus, string> = {
  DRAFT: "Brouillon",
  OPEN: "Ouvert",
  CLOSED: "Fermé",
};
