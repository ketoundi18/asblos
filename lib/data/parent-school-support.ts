import { getParentDashboard } from "@/lib/data/parent";

export type ParentChildForSchoolSupport = {
  id: string;
  first_name: string;
  last_name: string;
};

/** Tous les enfants liés au parent (validés ou en attente) — pour le soutien scolaire. */
export async function getParentChildrenForSchoolSupport(): Promise<{
  children: ParentChildForSchoolSupport[];
  loadError: string | null;
}> {
  const { links, loadError } = await getParentDashboard();

  return {
    children: links.map((link) => ({
      id: link.child_id,
      first_name: link.first_name,
      last_name: link.last_name,
    })),
    loadError,
  };
}
