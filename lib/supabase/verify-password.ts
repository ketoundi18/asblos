import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Vérifie le mot de passe actuel sans modifier la session cookie du navigateur.
 * (reauthenticate() Supabase envoie un OTP e-mail — inadapté au formulaire mot de passe.)
 */
export async function verifyCurrentPassword(
  email: string,
  password: string
): Promise<boolean> {
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}
