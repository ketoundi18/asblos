"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { createStaffMemberSchema } from "@/lib/validations/staff-member";
import type { CreateStaffMemberState } from "@/lib/actions/equipe-state";

function mapFieldErrors(
  issues: { path: (string | number)[]; message: string }[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0]);
    if (!fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

function mapCreateUserError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Cet e-mail est déjà utilisé. Choisis un autre e-mail ou désactive l'ancien compte.";
  }
  if (m.includes("password")) {
    return "Mot de passe refusé (minimum 8 caractères, pas trop simple).";
  }
  if (m.includes("invalid email")) {
    return "Adresse e-mail invalide.";
  }
  if (m.includes("signup_not_allowed")) {
    return "Création refusée par Supabase. Vérifie la migration 029.";
  }
  return "Impossible de créer le compte. Réessaie ou vérifie Supabase.";
}

export async function createStaffMemberAction(
  _prevState: CreateStaffMemberState,
  formData: FormData
): Promise<CreateStaffMemberState> {
  const profile = await requireProfile();

  if (!canManageUsers(profile.role)) {
    return {
      error: "Tu n'as pas la permission de créer un compte équipe.",
      fieldErrors: {},
    };
  }

  const parsed = createStaffMemberSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
    password_confirm: formData.get("password_confirm"),
  });

  if (!parsed.success) {
    return {
      error: null,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  const { full_name, email, role, password } = parsed.data;
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim() },
    app_metadata: {
      signup_source: "admin",
      role,
    },
  });

  if (error || !data.user) {
    return {
      error: mapCreateUserError(error?.message ?? "unknown"),
      fieldErrors: {},
    };
  }

  await logAuditEvent({
    action: "STAFF_ACCOUNT_CREATED",
    entityType: "profiles",
    entityId: data.user.id,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: {
      email: email.trim().toLowerCase(),
      role,
      full_name: full_name.trim(),
    },
  });

  revalidatePath("/equipe/membres");
  redirect("/equipe/membres?success=staff-created");
}
