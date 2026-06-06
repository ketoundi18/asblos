import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolYear } from "@/lib/school-year";

export type MembershipStatus =
  | "AWAITING_PAYMENT"
  | "AWAITING_ASBL"
  | "ACTIVE"
  | "REJECTED"
  | "CANCELLED";

export type Membership = {
  id: string;
  child_id: string;
  parent_id: string;
  school_year: string;
  fee_cents: number;
  status: MembershipStatus;
  asbl_validated_at: string | null;
};

export async function getMembershipForChildCurrentYear(
  childId: string
): Promise<Membership | null> {
  const supabase = await createClient();
  const schoolYear = getCurrentSchoolYear();

  const { data } = await supabase
    .from("memberships")
    .select("id, child_id, parent_id, school_year, fee_cents, status, asbl_validated_at")
    .eq("child_id", childId)
    .eq("school_year", schoolYear)
    .maybeSingle<Membership>();

  return data ?? null;
}

export async function getMembershipsForParentDashboard(): Promise<
  Map<string, Membership>
> {
  const supabase = await createClient();
  const schoolYear = getCurrentSchoolYear();

  const { data } = await supabase
    .from("memberships")
    .select("id, child_id, parent_id, school_year, fee_cents, status, asbl_validated_at")
    .eq("school_year", schoolYear);

  const map = new Map<string, Membership>();
  for (const row of (data ?? []) as Membership[]) {
    map.set(row.child_id, row);
  }
  return map;
}

/** Mappe membership → statuts affichage parent (compat ancien enrollment_status) */
export function membershipToParentDisplay(membership: Membership | null): {
  needsPayment: boolean;
  label: string;
  variant: "warning" | "success" | "muted";
} {
  if (!membership) {
    return { needsPayment: false, label: "—", variant: "muted" };
  }

  switch (membership.status) {
    case "AWAITING_PAYMENT":
      return {
        needsPayment: membership.fee_cents > 0,
        label: membership.fee_cents > 0 ? "En attente de paiement" : "En attente ASBL",
        variant: "warning",
      };
    case "AWAITING_ASBL":
      return { needsPayment: false, label: "En attente ASBL", variant: "warning" };
    case "ACTIVE":
      return { needsPayment: false, label: "Inscrit", variant: "success" };
    case "REJECTED":
      return { needsPayment: false, label: "Refusé", variant: "muted" };
    case "CANCELLED":
      return { needsPayment: false, label: "Annulé", variant: "muted" };
    default:
      return { needsPayment: false, label: "—", variant: "muted" };
  }
}

export function membershipBlocksAdminValidation(
  membership: Membership | null
): boolean {
  return membership?.status === "AWAITING_PAYMENT" && membership.fee_cents > 0;
}
