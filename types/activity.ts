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
  payment_bank_iban: string | null;
  payment_bank_account_holder: string | null;
  payment_transfer_reference: string | null;
};

export type ActivityRegistrationPaymentStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "DEFERRED"
  | "PAID"
  | "WAIVED";

export type ActivityRegistration = {
  id: string;
  activity_id: string;
  child_id: string;
  registered_by: string | null;
  registered_at: string;
  cancelled_at: string | null;
  payment_status: ActivityRegistrationPaymentStatus;
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
  payment_status: ActivityRegistrationPaymentStatus;
};

export type ActivityWithDetails = Activity & {
  registrations: RegisteredChild[];
  registration_count: number;
  present_count: number;
};

export function formatActivityDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d, 12, 0, 0).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatActivityTime(time: string | null): string {
  if (!time) return "";
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const hours = match[1].padStart(2, "0");
  const minutes = match[2];
  return `${hours}h${minutes}`;
}

export function formatActivitySchedule(
  date: string,
  startTime: string | null,
  endTime: string | null
): string {
  const datePart = formatActivityDate(date);
  const start = formatActivityTime(startTime);
  const end = formatActivityTime(endTime);
  if (start && end) return `${datePart} · ${start} – ${end}`;
  if (start) return `${datePart} · ${start}`;
  return datePart;
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
    payment_bank_iban: row.payment_bank_iban ?? null,
    payment_bank_account_holder: row.payment_bank_account_holder ?? null,
    payment_transfer_reference: row.payment_transfer_reference ?? null,
  };
}

export function isActivityPaymentBankConfigured(
  activity: Pick<Activity, "price_cents" | "payment_bank_iban">,
  settings?: { bank_iban?: string | null } | null
): boolean {
  if ((activity.price_cents ?? 0) <= 0) return true;
  return !!(activity.payment_bank_iban?.trim() || settings?.bank_iban?.trim());
}

export function normalizeRegistrationPaymentStatus(
  value: string | null | undefined
): ActivityRegistrationPaymentStatus {
  if (
    value === "PENDING" ||
    value === "DEFERRED" ||
    value === "PAID" ||
    value === "WAIVED"
  ) {
    return value;
  }
  return "NOT_REQUIRED";
}

/** Message discret côté parent — jamais stigmatisant. */
export function getParentParticipationHint(
  status: ActivityRegistrationPaymentStatus
): string | null {
  if (status === "PENDING") {
    return "Paiement par virement en attente — vous pouvez envoyer votre preuve quand vous voulez.";
  }
  if (status === "DEFERRED") {
    return "Participation à régler quand vous le pourrez.";
  }
  return null;
}

/** Libellés internes staff uniquement. */
export function getStaffPaymentStatusLabel(
  status: ActivityRegistrationPaymentStatus
): string {
  switch (status) {
    case "DEFERRED":
      return "Report";
    case "PENDING":
      return "Paiement en attente";
    case "PAID":
      return "Payé";
    case "WAIVED":
      return "Pris en charge ASBL";
    default:
      return "Gratuit";
  }
}

export function getStaffPaymentStatusVariant(
  status: ActivityRegistrationPaymentStatus
): "success" | "warning" | "muted" | "default" {
  switch (status) {
    case "PAID":
    case "WAIVED":
      return "success";
    case "DEFERRED":
    case "PENDING":
      return "warning";
    default:
      return "muted";
  }
}
