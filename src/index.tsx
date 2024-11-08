import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Main from "./pages/index";
import { asyncWithLDProvider } from "launchdarkly-react-client-sdk";

const rootElement = document.getElementById("root");
const clientSideID = import.meta.env.VITE_LAUNCH_DARKLY_CLIENT_ID;
const clientContext = import.meta.env.VITE_LAUNCH_DARKLY_CLIENT_CONTEXT;

const renderApp = async () => {
  const LDProvider = await asyncWithLDProvider({
    clientSideID,
    context: {
      kind: "environment",
      key: clientContext
    }
  });

  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <LDProvider>
          <Main />
        </LDProvider>
      </StrictMode>
    );
  }
};

renderApp();
