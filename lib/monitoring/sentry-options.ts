import type { BrowserOptions, EdgeOptions, NodeOptions } from "@sentry/nextjs";
import type { ErrorEvent, EventHint } from "@sentry/core";

function parseSampleRate(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return fallback;
  return parsed;
}

export function getSentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
}

function isDevSentryEnabled(): boolean {
  return (
    process.env.SENTRY_ENABLE_DEV === "true" ||
    process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV === "true"
  );
}

/** Erreurs webpack / cache .next en dev — bruit, pas des bugs prod. */
const DEV_CACHE_NOISE = [
  "__webpack_modules__",
  "next-devtool",
  "next/dist/next-devtools",
  "could not find the module",
  "cannot find module",
  "module not found",
  "ENOENT",
  ".next/",
  "6141.js",
];

function isDevCacheNoise(event: ErrorEvent): boolean {
  const parts: string[] = [];
  if (event.message) parts.push(event.message);
  for (const ex of event.exception?.values ?? []) {
    if (ex.type) parts.push(ex.type);
    if (ex.value) parts.push(ex.value);
  }
  const blob = parts.join(" ").toLowerCase();
  return DEV_CACHE_NOISE.some((needle) => blob.includes(needle.toLowerCase()));
}

function beforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  void hint;
  if (isDevCacheNoise(event)) return null;
  if (process.env.NODE_ENV === "development" && !isDevSentryEnabled()) {
    return null;
  }
  return event;
}

/** Active uniquement si DSN défini ; désactivé en dev sauf flag explicite */
export function isSentryEnabled(): boolean {
  if (!getSentryDsn()) return false;
  if (process.env.NODE_ENV === "development" && !isDevSentryEnabled()) {
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
    beforeSend,
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
