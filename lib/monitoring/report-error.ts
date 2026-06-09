import { isSentryEnabled } from "@/lib/monitoring/sentry-options";

/** Envoie une erreur à Sentry si le monitoring prod est activé. */
export async function reportError(
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  if (!isSentryEnabled()) return;

  const Sentry = await import("@sentry/nextjs");
  if (context) {
    Sentry.setContext("asblos", context);
  }
  Sentry.captureException(error);
}
