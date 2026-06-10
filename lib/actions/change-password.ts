"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/roles";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";
import { changePasswordSchema } from "@/lib/validations/change-password";
import { verifyCurrentPassword } from "@/lib/supabase/verify-password";
import type { ChangePasswordState } from "@/lib/actions/auth-state";

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

function mapUpdatePasswordError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("same") || m.includes("different")) {
    return "Le nouveau mot de passe doit être différent de l'actuel.";
  }
  if (m.includes("weak") || m.includes("password")) {
    return "Mot de passe refusé (minimum 8 caractères, pas trop simple).";
  }
  return "Impossible de modifier le mot de passe. Réessaie dans un instant.";
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const profile = await requireProfile();

  if (!isStaffRole(profile.role)) {
    return {
      error: "Cette action est réservée au personnel de l'ASBL.",
      success: false,
      fieldErrors: {},
    };
  }

  const parsed = changePasswordSchema.safeParse({
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
    new_password_confirm: formData.get("new_password_confirm"),
  });

  if (!parsed.success) {
    return {
      error: null,
      success: false,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      error: "Session expirée. Reconnecte-toi puis réessaie.",
      success: false,
      fieldErrors: {},
    };
  }

  const { current_password, new_password } = parsed.data;

  const passwordOk = await verifyCurrentPassword(user.email, current_password);

  if (!passwordOk) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      error: null,
      success: false,
      fieldErrors: {
        current_password: "Mot de passe actuel incorrect.",
      },
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: new_password,
  });

  if (updateError) {
    return {
      error: mapUpdatePasswordError(updateError.message),
      success: false,
      fieldErrors: {},
    };
  }

  const ipHash = await getAuditIpHash();
  await logAuditEvent({
    action: "PASSWORD_CHANGED",
    entityType: "profiles",
    entityId: profile.id,
    actorId: profile.id,
    actorRole: profile.role,
    ipHash,
  });

  revalidatePath("/mon-compte");
  redirect("/mon-compte?success=password-changed");
}
