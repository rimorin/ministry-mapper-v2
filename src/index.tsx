import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../instrument";
import { initAnalytics } from "./utils/analytics";
import Main from "./pages/index";

initAnalytics();

// registerSW.js only does a bare registration with no reload logic. This
// reloads when a new SW takes control so stale JS bundles never run.
// hadController skips the reload on first install (no prior SW to replace).
if ("serviceWorker" in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });
}

// This automatically reloads when chunks fail to load after a fresh deployment
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

// Suppress unhandled-rejection noise from PocketBase auto-cancellations and
// Web Share / AbortController aborts. Genuine errors are already captured by
// Sentry's default unhandledrejection integration.
window.addEventListener("unhandledrejection", (event) => {
  const err = event.reason;
  if (
    err?.isAbort === true ||
    err?.name === "AbortError" ||
    err?.message === "Aborted"
  ) {
    event.preventDefault();
  }
});

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <Main />
    </StrictMode>
  );
}
