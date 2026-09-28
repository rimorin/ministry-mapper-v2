import "../instrument";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initAnalytics } from "./utils/analytics";
import { isAbortError } from "./utils/pocketbase";
import { initAppUpdates } from "./utils/appUpdate";
import { reloadForNewDeploy } from "./utils/reloadForNewDeploy";
import { initLaunchDarkly } from "./lib/launchdarkly";
import Loader from "./components/statics/loader";
import Main from "./pages/index";

initAnalytics();
initAppUpdates();

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
    reloadForNewDeploy();
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
