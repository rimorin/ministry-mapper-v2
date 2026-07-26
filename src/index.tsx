import "../instrument";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initAnalytics } from "./utils/analytics";
import { isAbortError } from "./utils/pocketbase";
import { checkForNewVersion } from "./utils/versionCheck";
import { initLaunchDarkly } from "./lib/launchdarkly";
import Loader from "./components/statics/loader";
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

// Backstop for the SW check above: a frozen/suspended standalone window may
// never fire reg.update() or controllerchange, so check version.json directly.
let lastVersionCheck = 0;
let versionStale = false;
const checkFreshness = (bypassThrottle = false) => {
  if (!navigator.onLine || versionStale) return;
  const now = Date.now();
  if (!bypassThrottle && now - lastVersionCheck < 5 * 60 * 1000) return;
  lastVersionCheck = now;
  checkForNewVersion().then((stale) => {
    if (stale && !versionStale) {
      versionStale = true;
      window.dispatchEvent(new CustomEvent("mm-sw-update"));
    }
  });
};
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") checkFreshness();
});
// persisted=true means this is a bfcache/app-switcher resume, not a fresh
// navigation — bypass the throttle since this is the moment staleness must be caught.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) checkFreshness(true);
});

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
  // Paint a loader immediately — LaunchDarkly init is a network round trip
  // (up to its timeout on a cold cache) and must not gate first paint.
  root.render(
    <StrictMode>
      <Loader />
    </StrictMode>
  );
  // Resolve LaunchDarkly flags before mounting Main so the maintenance gate
  // never flashes the real app. On timeout the SDK still resolves with a
  // working provider and hydrates flags via its `ready` event, so this await
  // is bounded. Falls back to a bare render when LD is disabled or errored
  // (the env var still governs maintenance mode).
  initLaunchDarkly().then((LDProvider) => {
    root.render(
      <StrictMode>
        {LDProvider ? (
          <LDProvider>
            <Main />
          </LDProvider>
        ) : (
          <Main />
        )}
      </StrictMode>
    );
  });
}
