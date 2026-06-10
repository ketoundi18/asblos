import { getCurrentSchoolYear } from "@/lib/school-year";
import { createClient } from "@/lib/supabase/server";
import { parseChildEnrollmentState } from "@/lib/enrollment/child-enrollment-state";

export async function getChildEnrollmentState(
  childId: string,
  schoolYear: string = getCurrentSchoolYear()
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_child_enrollment_state", {
    p_child_id: childId,
    p_school_year: schoolYear,
  });

  if (error) {
    if (error.message.includes("get_child_enrollment_state")) {
      return {
        state: null,
        loadError: "Lance 040_get_child_enrollment_state.sql dans Supabase.",
      };
    }
    return { state: null, loadError: error.message };
  }

  return { state: parseChildEnrollmentState(data), loadError: null };
}
