/**
 * Sentry Error Monitoring Configuration
 *
 * Environment variables:
 * - VITE_SENTRY_DSN: Data Source Name for Sentry project
 * - VITE_SYSTEM_ENVIRONMENT: Current environment (local, staging, production)
 * - VITE_VERSION: Application version for release tracking
 */
import * as Sentry from "@sentry/react";

const isProduction = import.meta.env.VITE_SYSTEM_ENVIRONMENT === "production";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || undefined,
  environment: import.meta.env.VITE_SYSTEM_ENVIRONMENT || "local",
  release: import.meta.env.VITE_VERSION || undefined,

  tracesSampleRate: isProduction ? 0.1 : 1.0,
  replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],

  ignoreErrors: [
    /ResizeObserver loop/i,
    /NetworkError/i,
    /Failed to fetch/i,
    /Load failed/i,
    /cancelled/i,
    /AbortError/i
  ],

  beforeSend(event) {
    if (
      event.exception?.values?.[0]?.stacktrace?.frames?.some(
        (frame) =>
          frame.filename?.includes("chrome-extension://") ||
          frame.filename?.includes("moz-extension://")
      )
    ) {
      return null;
    }
    return event;
  }
});
