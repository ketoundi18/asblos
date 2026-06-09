import { isSentryEnabled } from "@/lib/monitoring/sentry-options";

/** Envoie une erreur à Sentry si le monitoring prod est activé. */
export async function reportError(
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  if (!isSentryEnabled()) return;

  const Sentry = await import("@sentry/nextjs");
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext("asblos", context);
    }
    scope.captureException(error);
  });
}
