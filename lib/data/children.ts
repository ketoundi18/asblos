import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { isStaffFullAccess } from "@/lib/auth/permissions";
import type { Child, ChildWithGuardians, Guardian } from "@/types/child";

/** Colonnes sans données médicales / notes internes (bénévoles, stagiaires). */
const CHILD_COLUMNS_LIMITED =
  "id, first_name, last_name, birth_date, school_name, school_class, allergies, image_rights, image_rights_date, outing_authorization, outing_auth_date, emergency_contact_name, emergency_contact_phone, status, created_via, enrollment_status, created_at, updated_at, deleted_at, anonymized_at";

async function childSelectColumns(): Promise<string> {
  const profile = await getCurrentProfile();
  if (profile && !isStaffFullAccess(profile.role)) {
    return CHILD_COLUMNS_LIMITED;
  }
  return "*";
}

export async function getChildrenList(): Promise<{
  children: Child[];
  loadError: string | null;
}> {
  const supabase = await createClient();
  const columns = await childSelectColumns();
  const { data, error } = await supabase
    .from("children")
    .select(columns)
    .is("deleted_at", null)
    .order("last_name", { ascending: true });

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

  return { children: (data ?? []) as Child[], loadError: null };
}

export async function getChildById(
  id: string
): Promise<ChildWithGuardians | null> {
  const supabase = await createClient();
  const columns = await childSelectColumns();
  const { data: child, error: childError } = await supabase
    .from("children")
    .select(columns)
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
      ...(child as Child),
      guardians: [],
    };
  }

  return {
    ...(child as Child),
    guardians: (guardians ?? []) as Guardian[],
  };
}
