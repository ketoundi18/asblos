import { createClient } from "@/lib/supabase/server";

export type ParentChildLink = {
  link_id: string;
  child_id: string;
  first_name: string;
  last_name: string;
  verified: boolean;
  created_via: "STAFF" | "PARENT" | null;
  enrollment_status:
    | "BROUILLON"
    | "EN_ATTENTE_PAIEMENT"
    | "PAYE_EN_ATTENTE_ASBL"
    | "VALIDE"
    | "REFUSE"
    | null;
};

type ChildMeta = {
  id: string;
  first_name: string;
  last_name: string;
  created_via: "STAFF" | "PARENT" | null;
  enrollment_status: ParentChildLink["enrollment_status"];
};

async function fetchChildrenMeta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  childIds: string[]
): Promise<{ children: ChildMeta[]; error: string | null }> {
  if (childIds.length === 0) {
    return { children: [], error: null };
  }

  const extended = await supabase
    .from("children")
    .select("id, first_name, last_name, created_via, enrollment_status")
    .in("id", childIds);

  if (!extended.error && extended.data) {
    return { children: extended.data as ChildMeta[], error: null };
  }

  const basic = await supabase
    .from("children")
    .select("id, first_name, last_name")
    .in("id", childIds);

  if (basic.error || !basic.data) {
    return {
      children: [],
      error:
        extended.error?.message ??
        basic.error?.message ??
        "Impossible de lire les fiches enfants.",
    };
  }

  return {
    children: (basic.data as { id: string; first_name: string; last_name: string }[]).map(
      (c) => ({
        ...c,
        created_via: null,
        enrollment_status: null,
      })
    ),
    error: null,
  };
}

export async function getParentDashboard(): Promise<{
  links: ParentChildLink[];
  loadError: string | null;
}> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("parent_child_links")
    .select("id, child_id, verified_at")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01" || error.message.includes("does not exist")) {
      return {
        links: [],
        loadError:
          "Espace parent pas encore prêt. Lance 007a puis 007 dans Supabase.",
      };
    }
    return { links: [], loadError: `Impossible de charger tes enfants (${error.message}).` };
  }

  const linkRows = (rows ?? []) as {
    id: string;
    child_id: string;
    verified_at: string | null;
  }[];

  const childIds = [...new Set(linkRows.map((r) => r.child_id))];
  const { children, error: childrenError } = await fetchChildrenMeta(
    supabase,
    childIds
  );

  const childMap = new Map(children.map((c) => [c.id, c]));

  const links: ParentChildLink[] = linkRows.map((r) => {
    const child = childMap.get(r.child_id);
    return {
      link_id: r.id,
      child_id: r.child_id,
      first_name: child?.first_name ?? "Enfant",
      last_name: child?.last_name ?? "lié",
      verified: r.verified_at !== null,
      created_via: child?.created_via ?? null,
      enrollment_status: child?.enrollment_status ?? null,
    };
  });

  if (links.length > 0 && children.length === 0 && childrenError) {
    return {
      links,
      loadError: `${childrenError} Lance 008_parent_see_linked_children.sql et 010_parent_enrollment.sql dans Supabase.`,
    };
  }

  return { links, loadError: null };
}
