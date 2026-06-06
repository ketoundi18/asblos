export type ActivityStatus =
  | "PLANIFIEE"
  | "EN_COURS"
  | "TERMINEE"
  | "ANNULEE";

export type Activity = {
  id: string;
  title: string;
  description: string | null;
  activity_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  max_participants: number | null;
  status: ActivityStatus;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  price_cents: number;
  parent_registration_open: boolean;
};

export type ActivityRegistration = {
  id: string;
  activity_id: string;
  child_id: string;
  registered_by: string | null;
  registered_at: string;
  cancelled_at: string | null;
};

export type ActivityAttendance = {
  id: string;
  activity_id: string;
  child_id: string;
  is_present: boolean;
  notes: string | null;
  marked_by: string | null;
  marked_at: string;
};

export type RegisteredChild = {
  registration_id: string;
  child_id: string;
  first_name: string;
  last_name: string;
  allergies: string | null;
  is_present: boolean | null;
  attendance_id: string | null;
};

export type ActivityWithDetails = Activity & {
  registrations: RegisteredChild[];
  registration_count: number;
  present_count: number;
};

export function formatActivityDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatActivityTime(time: string | null): string {
  if (!time) return "";
  return time.slice(0, 5);
}

export function isActivityPaid(priceCents: number | null | undefined): boolean {
  return (priceCents ?? 0) > 0;
}

export function formatActivityPrice(priceCents: number | null | undefined): string {
  const cents = priceCents ?? 0;
  if (cents <= 0) return "Gratuit";
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function normalizeActivity<T extends Partial<Activity>>(row: T): Activity {
  return {
    ...(row as Activity),
    price_cents: row.price_cents ?? 0,
    parent_registration_open: row.parent_registration_open ?? false,
  };
}
