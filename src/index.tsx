import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../instrument";
import Main from "./pages/index";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

// This automatically reloads when chunks fail to load after a fresh deployment
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
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
