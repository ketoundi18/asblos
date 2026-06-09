import type { BrowserOptions, EdgeOptions, NodeOptions } from "@sentry/nextjs";

function parseSampleRate(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return fallback;
  return parsed;
}

export function getSentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
}

/** Active uniquement si DSN défini ; désactivé en dev sauf SENTRY_ENABLE_DEV=true */
export function isSentryEnabled(): boolean {
  if (!getSentryDsn()) return false;
  if (process.env.NODE_ENV === "development" && process.env.SENTRY_ENABLE_DEV !== "true") {
    return false;
  }
  return true;
}

function baseOptions() {
  return {
    dsn: getSentryDsn(),
    enabled: isSentryEnabled(),
    environment:
      process.env.SENTRY_ENVIRONMENT?.trim() ||
      process.env.VERCEL_ENV ||
      process.env.NODE_ENV ||
      "production",
    sendDefaultPii: false,
    ignoreTransactions: ["/api/health", "/monitoring/sentry-tunnel"],
  };
}

export function getSentryServerOptions(): NodeOptions {
  return {
    ...baseOptions(),
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
  };
}

export function getSentryEdgeOptions(): EdgeOptions {
  return {
    ...baseOptions(),
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.05),
  };
}

export function getSentryClientOptions(): BrowserOptions {
  return {
    ...baseOptions(),
    tracesSampleRate: parseSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
        process.env.SENTRY_TRACES_SAMPLE_RATE,
      0.1
    ),
  };
}
