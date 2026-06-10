import type { NextRequest } from "next/server";

export function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  // En local / tests uniquement — évite le secret dans les logs en production
  if (process.env.NODE_ENV !== "production") {
    const querySecret = request.nextUrl.searchParams.get("secret");
    return querySecret === secret;
  }

  return false;
}
