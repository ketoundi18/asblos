import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolYear } from "@/lib/school-year";
import {
  type AsblSettingsSnapshot,
  formatEnrollmentFeeLabel,
  getSchoolSupportFeeCents,
} from "@/lib/asbl/fee-utils";

export type AsblSettings = AsblSettingsSnapshot;
export { formatEnrollmentFeeLabel, getSchoolSupportFeeCents };

export async function getAsblSettingsForCurrentYear(): Promise<{
  settings: AsblSettings | null;
  loadError: string | null;
}> {
  const supabase = await createClient();
  const schoolYear = getCurrentSchoolYear();

  const { data, error } = await supabase
    .from("asbl_settings")
    .select("id, school_year, enrollment_fee_cents, school_support_fee_cents, currency")
    .eq("school_year", schoolYear)
    .maybeSingle<AsblSettings>();

  if (error) {
    if (error.code === "42P01" || error.message.includes("does not exist")) {
      return {
        settings: null,
        loadError: "Lance 014_memberships_v2.sql dans Supabase.",
      };
    }
    return { settings: null, loadError: error.message };
  }

  if (data) {
    return { settings: data, loadError: null };
  }

  return {
    settings: {
      id: "",
      school_year: schoolYear,
      enrollment_fee_cents: 0,
      school_support_fee_cents: 0,
      currency: "EUR",
    },
    loadError: null,
  };
}
