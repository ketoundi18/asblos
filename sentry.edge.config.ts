import * as Sentry from "@sentry/nextjs";
import { getSentryEdgeOptions } from "./lib/monitoring/sentry-options";

Sentry.init(getSentryEdgeOptions());
