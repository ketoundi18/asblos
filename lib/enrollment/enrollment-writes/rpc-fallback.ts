import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type EnrollmentDbClient = SupabaseClient<Database>;

export function isEnrollmentTransitionRpcMissing(
  message: string,
  rpcName: string
): boolean {
  return (
    message.includes("Could not find the function") ||
    message.includes(rpcName) ||
    (message.includes("does not exist") && message.includes(rpcName))
  );
}
