import { createClient } from "@/lib/supabase/server";
import { getChildEnrollmentStates } from "@/lib/enrollment/get-child-enrollment-state";

export type AdminParentLink = {
  link_id: string;
  parent_id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string | null;
  child_id: string;
  child_first_name: string;
  child_last_name: string;
  child_created_via: "STAFF" | "PARENT" | null;
  child_enrollment_status: string | null;
  membership_status: string | null;
  membership_fee_cents: number | null;
  created_at: string;
  verified: boolean;
};

export async function getParentLinksForAdmin(): Promise<{
  links: AdminParentLink[];
  loadError: string | null;
}> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("parent_child_links")
    .select("id, parent_id, child_id, verified_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01" || error.message.includes("does not exist")) {
      return {
        links: [],
        loadError: "Lance 007a puis 007 dans Supabase.",
      };
    }
    return {
      links: [],
      loadError: `Impossible de charger les liens : ${error.message}`,
    };
  }

  const linkRows = (rows ?? []) as {
    id: string;
    parent_id: string;
    child_id: string;
    verified_at: string | null;
    created_at: string;
  }[];

  if (linkRows.length === 0) {
    return { links: [], loadError: null };
  }

  const parentIds = [...new Set(linkRows.map((r) => r.parent_id))];
  const childIds = [...new Set(linkRows.map((r) => r.child_id))];

  type ProfileRow = {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
  type ChildRow = {
    id: string;
    first_name: string;
    last_name: string;
    created_via?: "STAFF" | "PARENT" | null;
  };

  const [{ data: profiles, error: profilesError }, { data: fullChildren, error: fullChildrenError }, { states, loadError: stateError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", parentIds),
      supabase
        .from("children")
        .select("id, first_name, last_name, created_via")
        .in("id", childIds),
      getChildEnrollmentStates(childIds),
    ]);

  if (stateError) {
    return { links: [], loadError: stateError };
  }

  let childrenData: ChildRow[] = [];

  if (fullChildrenError) {
    const { data: fallbackChildren } = await supabase
      .from("children")
      .select("id, first_name, last_name")
      .in("id", childIds);
    childrenData = (fallbackChildren ?? []) as ChildRow[];
  } else {
    childrenData = (fullChildren ?? []) as ChildRow[];
  }

  const profileMap = new Map(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );
  const childMap = new Map(childrenData.map((c) => [c.id, c]));

  const links: AdminParentLink[] = linkRows.map((r) => {
    const parent = profileMap.get(r.parent_id);
    const child = childMap.get(r.child_id);
    const state = states.get(r.child_id);
    return {
      link_id: r.id,
      parent_id: r.parent_id,
      parent_name: parent?.full_name ?? "Parent",
      parent_email: parent?.email ?? "—",
      parent_phone: parent?.phone ?? null,
      child_id: r.child_id,
      child_first_name: child?.first_name ?? "Enfant",
      child_last_name: child?.last_name ?? "lié",
      child_created_via: child?.created_via ?? null,
      child_enrollment_status: state?.layer_a.enrollment_status ?? null,
      membership_status: state?.layer_b?.status ?? null,
      membership_fee_cents: state?.layer_b?.fee_cents ?? null,
      created_at: r.created_at,
      verified: r.verified_at !== null,
    };
  });

  const partialData =
    linkRows.length > 0 &&
    (profileMap.size === 0 || childMap.size === 0) &&
    (profilesError || fullChildrenError);

  if (partialData) {
    return {
      links,
      loadError:
        "Certaines infos sont incomplètes. Lance 011_repair_parent_see_children.sql dans Supabase si la liste semble vide.",
    };
  }

  return { links, loadError: null };
}
