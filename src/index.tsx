import "../instrument";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initAnalytics } from "./utils/analytics";
import { isAbortError } from "./utils/pocketbase";
import Main from "./pages/index";

initAnalytics();

// registerSW.js only does a bare registration with no reload logic. This
// prompts the user to reload when a new SW takes control so stale JS bundles
// never run silently. hadController skips the prompt on first install.
if ("serviceWorker" in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let prompted = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || prompted) return;
    prompted = true;
    window.dispatchEvent(new CustomEvent("mm-sw-update"));
  });
  // Trigger an update check when the user returns to the tab so the new SW
  // starts installing in the background before they notice stale content.
  // Throttled to 5 minutes to avoid a sw.js network request on every tab switch.
  // Guards: skip if a SW is already installing, or if the device is offline.
  let lastUpdateCheck = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const now = Date.now();
    if (now - lastUpdateCheck < 5 * 60 * 1000) return;
    lastUpdateCheck = now;
    navigator.serviceWorker.ready
      .then((reg) => {
        if (reg.installing || !navigator.onLine) return;
        return reg.update();
      })
      .catch(() => {});
  });
}

// Reload once when a chunk fails to load after a fresh deployment (stale hash).
// The sessionStorage flag prevents an infinite reload loop when the chunk is
// persistently unavailable (offline, CDN misconfiguration, etc.). On the second
// failure we let the error propagate so ErrorBoundary shows the fallback UI and
// Sentry captures the exception.
const PRELOAD_RELOAD_KEY = "mm:preload-reload";
sessionStorage.removeItem(PRELOAD_RELOAD_KEY);
window.addEventListener("vite:preloadError", (event) => {
  if (!sessionStorage.getItem(PRELOAD_RELOAD_KEY)) {
    event.preventDefault();
    sessionStorage.setItem(PRELOAD_RELOAD_KEY, "1");
    window.location.reload();
  }
});

// Suppress unhandled-rejection noise from PocketBase auto-cancellations and
// Web Share / AbortController aborts. Genuine errors are already captured by
// Sentry's default unhandledrejection integration.
window.addEventListener("unhandledrejection", (event) => {
  if (isAbortError(event.reason)) {
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
