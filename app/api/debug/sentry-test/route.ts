import { NextResponse } from "next/server";
import { reportError } from "@/lib/monitoring/report-error";

function isDevSentryTestAllowed(): boolean {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) return false;
  if (process.env.NODE_ENV !== "development") return false;
  return (
    process.env.SENTRY_ENABLE_DEV === "true" ||
    process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV === "true"
  );
}

export async function GET() {
  if (!isDevSentryTestAllowed()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const error = new Error("AsblOS — test Sentry serveur (/api/debug/sentry-test)");
  await reportError(error, { surface: "sentry-test-route" });
  return NextResponse.json({
    ok: true,
    message: "Erreur envoyée à Sentry. Vérifie Issues dans 1–2 minutes.",
  });
}