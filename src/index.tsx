import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../instrument";
import { initAnalytics } from "./utils/analytics";
import Main from "./pages/index";

initAnalytics();

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
