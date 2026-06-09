import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ChildGdprExport = {
  exported_at: string;
  child_id: string;
  child: Record<string, unknown> | null;
  guardians: Record<string, unknown>[];
  memberships: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  activity_registrations: Record<string, unknown>[];
  school_support_enrollments: Record<string, unknown>[];
  parent_child_links: Record<string, unknown>[];
  audit_events: Record<string, unknown>[];
};

/** Données liées à un enfant pour export RGPD (admin). */
export async function buildChildGdprExport(
  childId: string
): Promise<ChildGdprExport | null> {
  const supabase = await createClient();

  const { data: child, error: childError } = await supabase
    .from("children")
    .select("*")
    .eq("id", childId)
    .maybeSingle();

  if (childError || !child) {
    return null;
  }

  const [
    { data: guardians },
    { data: memberships },
    { data: payments },
    { data: activityRegistrations },
    { data: schoolSupportEnrollments },
    { data: parentLinks },
    { data: auditEvents },
  ] = await Promise.all([
    supabase.from("guardians").select("*").eq("child_id", childId),
    supabase.from("memberships").select("*").eq("child_id", childId),
    supabase.from("payments").select("*").eq("child_id", childId),
    supabase
      .from("activity_registrations")
      .select("*")
      .eq("child_id", childId),
    supabase
      .from("school_support_enrollments")
      .select("*")
      .eq("child_id", childId),
    supabase.from("parent_child_links").select("*").eq("child_id", childId),
    supabase
      .from("logs_audit")
      .select("*")
      .eq("entity_type", "children")
      .eq("entity_id", childId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    exported_at: new Date().toISOString(),
    child_id: childId,
    child: child as Record<string, unknown>,
    guardians: (guardians ?? []) as Record<string, unknown>[],
    memberships: (memberships ?? []) as Record<string, unknown>[],
    payments: (payments ?? []) as Record<string, unknown>[],
    activity_registrations: (activityRegistrations ?? []) as Record<
      string,
      unknown
    >[],
    school_support_enrollments: (schoolSupportEnrollments ?? []) as Record<
      string,
      unknown
    >[],
    parent_child_links: (parentLinks ?? []) as Record<string, unknown>[],
    audit_events: (auditEvents ?? []) as Record<string, unknown>[],
  };
}
