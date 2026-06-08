import "server-only";
import type { createClient } from "@/lib/supabase/server";

export type ServerSupabase = Awaited<ReturnType<typeof createClient>>;
