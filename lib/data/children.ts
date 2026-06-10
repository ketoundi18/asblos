import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { isStaffFullAccess } from "@/lib/auth/permissions";
import { staffParentChildEnrollmentBadgeFromState } from "@/lib/enrollment/child-enrollment-state";
import { getChildEnrollmentStates } from "@/lib/enrollment/get-child-enrollment-state";
import type { Child, ChildWithGuardians, Guardian } from "@/types/child";

/** Colonnes sans données médicales / notes internes (bénévoles, stagiaires). */
const CHILD_COLUMNS_LIMITED =
  "id, first_name, last_name, birth_date, school_name, school_class, allergies, image_rights, image_rights_date, outing_authorization, outing_auth_date, emergency_contact_name, emergency_contact_phone, status, created_via, created_at, updated_at, deleted_at, anonymized_at" as const;

export type ChildListItem = Child & {
  parentEnrollmentBadge: ReturnType<typeof staffParentChildEnrollmentBadgeFromState>;
};

export async function getChildrenList(): Promise<{
  children: ChildListItem[];
  loadError: string | null;
}> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const limited = profile && !isStaffFullAccess(profile.role);

  let data;
  let error;
  if (limited) {
    ({ data, error } = await supabase
      .from("children")
      .select(CHILD_COLUMNS_LIMITED)
      .is("deleted_at", null)
      .order("last_name", { ascending: true }));
  } else {
    ({ data, error } = await supabase
      .from("children")
      .select("*")
      .is("deleted_at", null)
      .order("last_name", { ascending: true }));
  }

  if (error) {
    if (error.code === "42P01" || error.message.includes("does not exist")) {
      return {
        children: [],
        loadError:
          "La base de données n'est pas encore prête. Lance le script 004_children.sql dans Supabase (SQL Editor → Run).",
      };
    }

    return {
      children: [],
      loadError:
        "Impossible de charger la liste des enfants. Réessaie dans un instant.",
    };
  }

  const rows = (data ?? []) as unknown as Child[];
  const childIds = rows.map((child) => child.id);
  const { states, loadError: stateError } = await getChildEnrollmentStates(childIds);

  if (stateError) {
    return { children: [], loadError: stateError };
  }

  const children: ChildListItem[] = rows.map((child) => ({
    ...child,
    parentEnrollmentBadge: states.has(child.id)
      ? staffParentChildEnrollmentBadgeFromState(states.get(child.id)!)
      : null,
  }));

  return { children, loadError: null };
}

export async function getChildById(
  id: string
): Promise<ChildWithGuardians | null> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const limited = profile && !isStaffFullAccess(profile.role);

  const { data: child, error: childError } = limited
    ? await supabase
        .from("children")
        .select(CHILD_COLUMNS_LIMITED)
        .eq("id", id)
        .is("deleted_at", null)
        .single()
    : await supabase
        .from("children")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

  if (childError || !child) {
    return null;
  }

  const { data: guardians, error: guardiansError } = await supabase
    .from("guardians")
    .select("*")
    .eq("child_id", id)
    .order("is_primary", { ascending: false });

  if (guardiansError) {
    return {
      ...(child as unknown as Child),
      guardians: [],
    };
  }

  return {
    ...(child as unknown as Child),
    guardians: (guardians ?? []) as Guardian[],
  };
}
