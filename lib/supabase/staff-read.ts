import { createAdminClient } from "@/lib/supabase/admin";

/** Lecture staff admin (service role obligatoire — pas de downgrade silencieux). */
export async function createStaffReadClient() {
  return createAdminClient();
}
