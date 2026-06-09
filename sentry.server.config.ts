import * as Sentry from "@sentry/nextjs";
import { getSentryServerOptions } from "./lib/monitoring/sentry-options";

Sentry.init(getSentryServerOptions());
