import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolYear } from "@/lib/school-year";

export type AsblSettings = {
  id: string;
  school_year: string;
  enrollment_fee_cents: number;
  currency: string;
};

export async function getAsblSettingsForCurrentYear(): Promise<{
  settings: AsblSettings | null;
  loadError: string | null;
}> {
  const supabase = await createClient();
  const schoolYear = getCurrentSchoolYear();

  const { data, error } = await supabase
    .from("asbl_settings")
    .select("id, school_year, enrollment_fee_cents, currency")
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
      currency: "EUR",
    },
    loadError: null,
  };
}

export function formatEnrollmentFeeLabel(cents: number): string {
  if (cents <= 0) return "Gratuit";
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
