import { createClient } from "@/lib/supabase/server";
import type { Child, ChildWithGuardians, Guardian } from "@/types/child";

export async function getChildrenList(): Promise<{
  children: Child[];
  loadError: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .select("*")
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
  const { data: child, error: childError } = await supabase
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
      ...(child as Child),
      guardians: [],
    };
  }

  return {
    ...(child as Child),
    guardians: (guardians ?? []) as Guardian[],
  };
}
