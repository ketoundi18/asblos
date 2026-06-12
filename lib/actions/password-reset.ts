"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildPasswordResetRedirectUrl } from "@/lib/auth/password-reset-url";
import { isPasswordRecoverySession } from "@/lib/auth/recovery-session";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type PasswordResetChannel,
} from "@/lib/validations/password-reset";
import type {
  ForgotPasswordState,
  ResetPasswordState,
} from "@/lib/actions/password-reset-state";
import { mapFieldErrors } from "@/lib/utils/form-utils";

const RESET_SUCCESS_MESSAGE =
  "Si un compte existe avec cet e-mail, tu recevras un lien dans quelques minutes. Pense à vérifier les spams.";

function parseChannel(value: FormDataEntryValue | null): PasswordResetChannel {
  return value === "parent" ? "parent" : "staff";
}

export async function requestPasswordResetAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const channel = parseChannel(formData.get("channel"));
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error: null,
      success: false,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: buildPasswordResetRedirectUrl(channel),
  });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("rate limit") || m.includes("rate_limit")) {
      return {
        error: "Trop de demandes. Attends quelques minutes avant de réessayer.",
        success: false,
        fieldErrors: {},
      };
    }
  }

  const ipHash = await getAuditIpHash();
  await logAuditEvent({
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "profiles",
    entityId: "00000000-0000-0000-0000-000000000000",
    metadata: { channel },
    ipHash,
  });

  return {
    error: null,
    success: true,
    message: RESET_SUCCESS_MESSAGE,
    fieldErrors: {},
  };
}

function mapResetPasswordError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("weak") || m.includes("password")) {
    return "Mot de passe refusé (minimum 8 caractères, pas trop simple).";
  }
  if (m.includes("session") || m.includes("jwt") || m.includes("expired")) {
    return "Ce lien a expiré. Redemande un nouveau lien depuis la page mot de passe oublié.";
  }
  return "Impossible de définir le mot de passe. Réessaie ou redemande un lien.";
}

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const channel = parseChannel(formData.get("channel"));
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    password_confirm: formData.get("password_confirm"),
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

  if (!user) {
    return {
      error: mapResetPasswordError("session missing"),
      success: false,
      fieldErrors: {},
    };
  }

  const recoverySession = await isPasswordRecoverySession(supabase);
  if (!recoverySession) {
    return {
      error:
        "Ce formulaire est réservé au lien reçu par e-mail. Utilise Mon compte ou redemande un lien mot de passe oublié.",
      success: false,
      fieldErrors: {},
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (updateError) {
    return {
      error: mapResetPasswordError(updateError.message),
      success: false,
      fieldErrors: {},
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle<{ id: string; role: string }>();

  const ipHash = await getAuditIpHash();
  await logAuditEvent({
    action: "PASSWORD_CHANGED",
    entityType: "profiles",
    entityId: profile?.id ?? user.id,
    actorId: profile?.id ?? user.id,
    actorRole: profile?.role ?? null,
    metadata: { via: "email_reset", channel },
    ipHash,
  });

  if (profile?.role === "PARENT" || channel === "parent") {
    redirect("/espace-parents/connexion?success=password-reset");
  }

  redirect("/connexion?success=password-reset");
}
