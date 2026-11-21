import "../instrument";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initAnalytics } from "./utils/analytics";
import { isAbortError } from "./utils/pocketbase";
import { initAppUpdates } from "./utils/appUpdate";
import { recoverFromStaleDeploy } from "./utils/reloadForNewDeploy";
import { initLaunchDarkly } from "./lib/launchdarkly";
import Loader from "./components/statics/loader";
import Main from "./pages/index";

initAnalytics();
initAppUpdates();

// A chunk failed to load: after a fresh deployment this page is from the old
// build. Recovery is bounded (see recoverFromStaleDeploy); once it has nothing
// left to try the error propagates, so ErrorBoundary shows the fallback UI and
// Sentry captures the exception.
window.addEventListener("vite:preloadError", (event) => {
  if (recoverFromStaleDeploy()) event.preventDefault();
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
