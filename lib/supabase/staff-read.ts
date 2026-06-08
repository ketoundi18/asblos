import { createClient } from "@/lib/supabase/server";

/** Lecture staff fiable (service role si dispo, sinon session courante). */
export async function createStaffReadClient() {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    return createAdminClient() as unknown as Awaited<ReturnType<typeof createClient>>;
  } catch {
    return createClient();
  }
}
