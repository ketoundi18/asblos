import { createClient } from "@/lib/supabase/server";
import { membershipFromEnrollmentState } from "@/lib/enrollment/child-enrollment-state";
import { getChildEnrollmentState } from "@/lib/enrollment/get-child-enrollment-state";
import {
  getAsblSettingsForCurrentYear,
  getSchoolSupportFeeCents,
} from "@/lib/data/asbl-settings";
import type { Database } from "@/types/database";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

export type ChildPaymentContext = {
  child_id: string;
  first_name: string;
  last_name: string;
  membership_id: string | null;
  membership_status: string | null;
  membership_plan: string | null;
  fee_cents: number;
  needs_payment: boolean;
  pending_payment: PaymentRow | null;
  paid_payment: PaymentRow | null;
};

export async function getChildPaymentContext(
  childId: string
): Promise<ChildPaymentContext | null> {
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("parent_child_links")
    .select("child_id")
    .eq("child_id", childId)
    .maybeSingle<{ child_id: string }>();

  if (!link) return null;

  const { data: child } = await supabase
    .from("children")
    .select("id, first_name, last_name")
    .eq("id", childId)
    .is("deleted_at", null)
    .maybeSingle<{ id: string; first_name: string; last_name: string }>();

  if (!child) return null;

  const { state, loadError } = await getChildEnrollmentState(childId);
  if (loadError || !state) return null;

  const membership = membershipFromEnrollmentState(state);

  let feeCents = membership?.fee_cents ?? 0;
  if (!membership) {
    const { settings } = await getAsblSettingsForCurrentYear();
    feeCents =
      getSchoolSupportFeeCents(settings) ||
      settings?.enrollment_fee_cents ||
      0;
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });

  const rows = (payments ?? []) as PaymentRow[];
  const membershipPayments = membership
    ? rows.filter(
        (p) =>
          p.purpose === "MEMBERSHIP" && p.reference_id === membership.id
      )
    : [];

  const paid_payment = membershipPayments.find((p) => p.status === "PAID") ?? null;
  const pending_payment =
    membershipPayments.find((p) => p.status === "PENDING") ?? null;

  return {
    child_id: child.id,
    first_name: child.first_name,
    last_name: child.last_name,
    membership_id: membership?.id ?? null,
    membership_status: membership?.status ?? state.derived.effective_membership_status,
    membership_plan: membership?.plan ?? state.derived.effective_plan,
    fee_cents: feeCents,
    needs_payment: state.derived.needs_payment,
    pending_payment,
    paid_payment,
  };
}

export function childNeedsMembershipPayment(context: ChildPaymentContext): boolean {
  return context.needs_payment;
}
