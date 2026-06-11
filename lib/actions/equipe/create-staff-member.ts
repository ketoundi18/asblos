"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createAuthUserAdmin } from "@/lib/supabase/auth-admin-create-user";
import { canManageUsers } from "@/lib/auth/permissions";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";
import { createStaffMemberSchema } from "@/lib/validations/staff-member";
import type { CreateStaffMemberState } from "@/lib/actions/equipe-state";
import { mapFieldErrors } from "@/lib/utils/form-utils";
import { reportError } from "@/lib/monitoring/report-error";

function mapCreateUserError(message: string, code?: string): string {
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
  if (
    m.includes("signup_not_allowed") ||
    m.includes("database error saving new user")
  ) {
    return "Création refusée par Supabase. Vérifie que la migration 029 est appliquée.";
  }
  if (
    code === "bad_jwt" ||
    m.includes("bad_jwt") ||
    m.includes("invalid jwt") ||
    m.includes("invalid number of segments") ||
    m.includes("expected 3 parts in jwt")
  ) {
    return "Clé Supabase admin invalide sur Vercel. Vérifie SUPABASE_SERVICE_ROLE_KEY (Secret key ou service_role legacy).";
  }
  if (code === "config" || code === "network") {
    return "Connexion Supabase impossible côté serveur. Vérifie les variables sur Vercel.";
  }
  if (code) {
    return `Erreur Supabase (${code}). Réessaie ou contacte l'admin technique.`;
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

  const { user, error } = await createAuthUserAdmin({
    email,
    password,
    emailConfirm: true,
    userMetadata: { full_name: full_name.trim() },
    appMetadata: {
      signup_source: "admin",
      role,
    },
  });

  if (error || !user) {
    void reportError(new Error(error?.message ?? "createStaffMember: unknown"), {
      surface: "create-staff-member",
      code: error?.code,
      status: error?.status,
    });
    return {
      error: mapCreateUserError(error?.message ?? "unknown", error?.code),
      fieldErrors: {},
    };
  }

  const ipHash = await getAuditIpHash();
  await logAuditEvent({
    action: "STAFF_ACCOUNT_CREATED",
    entityType: "profiles",
    entityId: user.id,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: {
      email,
      role,
      full_name: full_name.trim(),
    },
    ipHash,
  });

  revalidatePath("/equipe/membres");
  redirect("/equipe/membres?success=staff-created");
}
