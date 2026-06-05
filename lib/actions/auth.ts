"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";
import type { LoginActionState } from "@/lib/actions/auth-state";

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(rawData);

  if (!parsed.success) {
    const fieldErrors: LoginActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "email" || field === "password") {
        fieldErrors[field] = issue.message;
      }
    }
    return { error: null, fieldErrors };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signInError) {
    return {
      error: "E-mail ou mot de passe incorrect. Vérifie et réessaie.",
      fieldErrors: {},
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Connexion impossible. Réessaie dans quelques instants.",
      fieldErrors: {},
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .single<{ is_active: boolean }>();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return {
      error:
        "Ton compte n'est pas encore configuré. Contacte un administrateur.",
      fieldErrors: {},
    };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return {
      error: "Ton compte est désactivé. Contacte un administrateur.",
      fieldErrors: {},
    };
  }

  redirect("/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
