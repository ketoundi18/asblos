import type { User } from "@supabase/supabase-js";
import { isSupabaseSecretApiKey } from "@/lib/supabase/admin-fetch";

export type CreateAuthUserInput = {
  email: string;
  password: string;
  emailConfirm?: boolean;
  userMetadata?: Record<string, unknown>;
  appMetadata?: Record<string, unknown>;
};

export type CreateAuthUserError = {
  message: string;
  code?: string;
  status?: number;
};

export type CreateAuthUserResult =
  | { user: User; error: null }
  | { user: null; error: CreateAuthUserError };

function parseAuthUserPayload(payload: Record<string, unknown>): User | null {
  const nested = payload.user;
  if (nested && typeof nested === "object" && "id" in nested) {
    return nested as User;
  }
  if (typeof payload.id === "string") {
    return payload as unknown as User;
  }
  return null;
}

function parseAuthErrorPayload(
  payload: Record<string, unknown>,
  fallback: string,
  status: number
): CreateAuthUserError {
  const errObj = (payload.error ?? payload) as Record<string, unknown>;
  const message = String(
    errObj.msg ??
      errObj.message ??
      errObj.error_description ??
      payload.msg ??
      payload.message ??
      fallback
  );
  const code = String(
    errObj.error_code ?? errObj.code ?? payload.error_code ?? payload.code ?? ""
  ).trim();

  return {
    message,
    code: code || undefined,
    status,
  };
}

/**
 * Crée un utilisateur Auth via l'API Admin (fetch direct).
 * Contourne le bug sb_secret_ + Authorization Bearer du SDK Supabase.
 */
export async function createAuthUserAdmin(
  input: CreateAuthUserInput
): Promise<CreateAuthUserResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return {
      user: null,
      error: {
        message: "Variables SUPABASE manquantes",
        code: "config",
      },
    };
  }

  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
  };

  if (!isSupabaseSecretApiKey(key)) {
    headers.Authorization = `Bearer ${key}`;
  }

  const body = {
    email: input.email,
    password: input.password,
    email_confirm: input.emailConfirm ?? true,
    user_metadata: input.userMetadata ?? {},
    app_metadata: input.appMetadata ?? {},
  };

  let response: Response;
  try {
    response = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    return { user: null, error: { message, code: "network", status: 0 } };
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    return {
      user: null,
      error: parseAuthErrorPayload(payload, response.statusText, response.status),
    };
  }

  const user = parseAuthUserPayload(payload);
  if (!user) {
    return {
      user: null,
      error: {
        message: "Réponse Auth sans utilisateur",
        code: "no_user",
        status: response.status,
      },
    };
  }

  return { user, error: null };
}
