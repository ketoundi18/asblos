"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";
import { z } from "zod";
import type { LoginActionState, ParentSignupState } from "@/lib/actions/auth-state";

const parentSignupSchema = z
  .object({
    full_name: z.string().min(1, "Ton nom est obligatoire"),
    email: z.string().email("E-mail invalide"),
    phone: z.string().min(1, "Ton téléphone est obligatoire"),
    password: z.string().min(8, "Minimum 8 caractères"),
    password_confirm: z.string(),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["password_confirm"],
  });

function parentSignupErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("rate limit") || m.includes("rate_limit")) {
    return "Trop de tentatives d'inscription. Attends 30–60 minutes, ou crée le compte manuellement dans Supabase (Authentication → Users).";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Cet e-mail est déjà utilisé. Va sur Connexion ou choisis un autre e-mail.";
  }
  if (m.includes("signups not allowed") || m.includes("signup is disabled")) {
    return "Les inscriptions sont désactivées dans Supabase (Authentication → Providers → Email).";
  }
  if (m.includes("database error saving new user")) {
    return "Erreur SQL à l'inscription. Relance 007a puis 007 dans Supabase, ou contacte l'ASBL.";
  }
  if (m.includes("invalid email")) {
    return "Adresse e-mail invalide.";
  }
  if (m.includes("password")) {
    return "Mot de passe refusé (minimum 8 caractères, pas trop simple).";
  }
  return `Impossible de créer le compte : ${message}`;
}

async function checkProfileActive(userId: string) {
  const supabase = await createClient();
  return supabase
    .from("profiles")
    .select("is_active, role")
    .eq("id", userId)
    .single<{ is_active: boolean; role: string }>();
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

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
      error: "E-mail ou mot de passe incorrect.",
      fieldErrors: {},
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Connexion impossible.", fieldErrors: {} };
  }

  const { data: profile, error: profileError } = await checkProfileActive(
    user.id
  );

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return {
      error: "Compte non configuré. Contacte l'ASBL.",
      fieldErrors: {},
    };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { error: "Compte désactivé.", fieldErrors: {} };
  }

  if (profile.role === "PARENT") {
    redirect("/espace-parents");
  }

  redirect("/");
}

function parentLoginErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("email not confirmed") || m.includes("not confirmed")) {
    return "Ton e-mail n'est pas encore confirmé. Clique le lien reçu par mail, ou demande à l'ASBL de valider ton compte dans Supabase.";
  }
  if (m.includes("invalid login credentials")) {
    return "E-mail ou mot de passe incorrect. Si tu viens de t'inscrire, confirme d'abord ton e-mail.";
  }
  return "Connexion impossible. Réessaie dans un instant.";
}

export async function parentLoginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

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
    email: parsed.data.email.trim().toLowerCase(),
    password: parsed.data.password,
  });

  if (signInError) {
    return {
      error: parentLoginErrorMessage(signInError.message),
      fieldErrors: {},
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Connexion impossible.", fieldErrors: {} };
  }

  const { data: profile, error: profileError } = await checkProfileActive(
    user.id
  );

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { error: "Compte non configuré.", fieldErrors: {} };
  }

  if (profile.role !== "PARENT") {
    await supabase.auth.signOut();
    return {
      error: "Ce compte est réservé au personnel. Utilise /connexion.",
      fieldErrors: {},
    };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { error: "Compte désactivé.", fieldErrors: {} };
  }

  redirect("/espace-parents");
}

export async function parentSignupAction(
  _prevState: ParentSignupState,
  formData: FormData
): Promise<ParentSignupState> {
  const parsed = parentSignupSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    password_confirm: formData.get("password_confirm"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { error: null, success: false, fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email.trim().toLowerCase(),
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name.trim(),
        phone: parsed.data.phone.trim(),
        signup_source: "parent",
      },
    },
  });

  if (error) {
    return {
      error: parentSignupErrorMessage(error.message),
      success: false,
      fieldErrors: {},
    };
  }

  if (data.user && !data.session) {
    return {
      error: null,
      success: true,
      fieldErrors: {},
    };
  }

  return {
    error: null,
    success: true,
    fieldErrors: {},
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}

export async function parentLogoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/espace-parents/connexion");
}
