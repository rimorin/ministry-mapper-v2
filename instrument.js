/**
 * Ministry Mapper Error Monitoring Configuration
 *
 * This file initializes Sentry for error tracking and monitoring in the application.
 * It configures Sentry based on environment variables to enable proper error reporting
 * and performance monitoring.
 *
 * Environment variables used:
 * - VITE_SENTRY_DSN: The Data Source Name for your Sentry project
 * - VITE_SYSTEM_ENVIRONMENT: The current environment (local, staging, production)
 * - VITE_VERSION: The application version for release tracking
 *
 * The tracesSampleRate is set to 0.2 (20%) in production to reduce the volume of
 * performance data sent to Sentry, while capturing all traces in development environments.
 */
import * as Sentry from "@sentry/react";
const isProduction = import.meta.env.VITE_SYSTEM_ENVIRONMENT === "production";
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || undefined,
  environment: import.meta.env.VITE_SYSTEM_ENVIRONMENT || "local",
  release: import.meta.env.VITE_VERSION || undefined,
  tracesSampleRate: isProduction ? 0.1 : 1.0,
  replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
  replaysOnErrorSampleRate: isProduction ? 0.1 : 1.0,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()]
});
