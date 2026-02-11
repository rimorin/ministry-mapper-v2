/**
 * Sentry Error Monitoring Configuration
 *
 * Environment variables:
 * - VITE_SENTRY_DSN: Data Source Name for Sentry project
 * - VITE_SYSTEM_ENVIRONMENT: Current environment (local, staging, production)
 * - VITE_VERSION: Application version for release tracking
 */
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SYSTEM_ENVIRONMENT || "local",
  release: import.meta.env.VITE_VERSION,

  // Disable performance monitoring (tree-shaken via vite plugin)
  tracesSampleRate: 0,

  // Using default integrations for automatic error capture
  // (breadcrumbs, uncaught exceptions, unhandled rejections, etc.)

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
