import "server-only";
import { headers } from "next/headers";
import { hashAuditIp } from "@/lib/audit/log-audit";

/** Première IP client (Vercel / proxy). */
export function extractClientIp(headerStore: Headers): string | null {
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headerStore.get("x-real-ip")?.trim();
  return realIp || null;
}

/** Empreinte IP pour l'audit (null si AUDIT_IP_SALT absent ou IP inconnue). */
export async function getAuditIpHash(): Promise<string | null> {
  const headerStore = await headers();
  return hashAuditIp(extractClientIp(headerStore));
}

export function getAuditIpHashFromHeaders(headerStore: Headers): string | null {
  return hashAuditIp(extractClientIp(headerStore));
}
