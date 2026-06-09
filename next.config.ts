import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Cache webpack désactivé en dev → moins de crashes .next corrompu
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  // Limite les compilations parallèles agressives
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

const hasSentrySourceMapUpload =
  Boolean(process.env.SENTRY_AUTH_TOKEN?.trim()) &&
  Boolean(process.env.SENTRY_ORG?.trim()) &&
  Boolean(process.env.SENTRY_PROJECT?.trim());

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  disableLogger: true,
  automaticVercelMonitors: false,
  sourcemaps: {
    disable: !hasSentrySourceMapUpload,
  },
  // Tunnel uniquement si DSN public configuré (évite les ad-blockers en prod)
  tunnelRoute: process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()
    ? "/monitoring/sentry-tunnel"
    : undefined,
});
