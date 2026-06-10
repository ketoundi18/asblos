import { getCurrentSchoolYear } from "@/lib/school-year";
import { createClient } from "@/lib/supabase/server";
import { parseChildEnrollmentState } from "@/lib/enrollment/child-enrollment-state";
import type { ChildEnrollmentState } from "@/lib/enrollment/child-enrollment-state";

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

export async function getChildEnrollmentStates(
  childIds: string[],
  schoolYear: string = getCurrentSchoolYear()
): Promise<{
  states: Map<string, ChildEnrollmentState>;
  loadError: string | null;
}> {
  const uniqueIds = [...new Set(childIds)];
  if (uniqueIds.length === 0) {
    return { states: new Map(), loadError: null };
  }

  const results = await Promise.all(
    uniqueIds.map(async (childId) => {
      const result = await getChildEnrollmentState(childId, schoolYear);
      return { childId, ...result };
    })
  );

  const migrationMissing = results.find((r) =>
    r.loadError?.includes("040_get_child_enrollment_state")
  );
  if (migrationMissing?.loadError) {
    return { states: new Map(), loadError: migrationMissing.loadError };
  }

  const otherError = results.find((r) => r.loadError);
  if (otherError?.loadError) {
    return { states: new Map(), loadError: otherError.loadError };
  }

  const states = new Map<string, ChildEnrollmentState>();
  for (const row of results) {
    if (row.state) states.set(row.childId, row.state);
  }
  return { states, loadError: null };
}
