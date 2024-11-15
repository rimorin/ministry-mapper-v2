import { Provider } from "@rollbar/react";
import { FC, ReactNode } from "react";

interface RollbarProviderProps {
  children: ReactNode;
}

const { VITE_ROLLBAR_ACCESS_TOKEN, VITE_SYSTEM_ENVIRONMENT, VITE_VERSION } =
  import.meta.env;

const DEFEAULT_ROLLBAR_ENVIRONMENT = "staging";

const rollbarConfig = VITE_ROLLBAR_ACCESS_TOKEN
  ? {
      accessToken: VITE_ROLLBAR_ACCESS_TOKEN,
      autoInstrument: true,
      captureUncaught: true,
      captureUnhandledRejections: true,
      code_version: VITE_VERSION,
      environment: VITE_SYSTEM_ENVIRONMENT || DEFEAULT_ROLLBAR_ENVIRONMENT,
      client: {
        javascript: {
          source_map_enabled: true,
          code_version: VITE_VERSION
        }
      }
    }
  : {};

const RollbarMiddleware: FC<RollbarProviderProps> = ({ children }) => {
  return <Provider config={rollbarConfig}>{children}</Provider>;
};

export default RollbarMiddleware;
