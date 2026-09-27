/**
 * Sentry Error Monitoring Configuration
 *
 * Environment variables:
 * - VITE_SENTRY_DSN: Data Source Name for Sentry project
 * - VITE_SYSTEM_ENVIRONMENT: Current environment (local, staging, production)
 * - VITE_APP_VERSION: Application version for release tracking
 */
import * as Sentry from "@sentry/react";
import { ClientResponseError } from "pocketbase";
import { isReloadingForNewDeploy } from "./src/utils/reloadForNewDeploy";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SYSTEM_ENVIRONMENT || "local",
  release: import.meta.env.VITE_APP_VERSION,

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
    /AbortError/i,
    /LaunchDarklyFlagFetchError: network error/,
    // Injected by UC Browser and extensions
    /UCShellJava/,
    /runtime\.sendMessage/
  ],

  beforeSend(event, hint) {
    // Status 0 is a network failure. ignoreErrors misses it because
    // "Load failed" is only on the linked cause.
    const error = hint.originalException;
    if (error instanceof ClientResponseError && error.status === 0) {
      return null;
    }
    if (isReloadingForNewDeploy()) {
      return null;
    }
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
