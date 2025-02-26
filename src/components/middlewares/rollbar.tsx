import { Provider } from "@rollbar/react";
import { FC, ReactNode } from "react";
import { Configuration } from "rollbar";

interface RollbarProviderProps {
  children: ReactNode;
}

const { VITE_ROLLBAR_ACCESS_TOKEN, VITE_SYSTEM_ENVIRONMENT, VITE_VERSION } =
  import.meta.env;

const DEFEAULT_ROLLBAR_ENVIRONMENT = "staging";

const rollbarConfig = (
  VITE_ROLLBAR_ACCESS_TOKEN
    ? {
        accessToken: VITE_ROLLBAR_ACCESS_TOKEN,
        captureUncaught: true,
        captureUnhandledRejections: true,
        maxItems: 10,
        itemsPerMinute: 5,
        environment: VITE_SYSTEM_ENVIRONMENT || DEFEAULT_ROLLBAR_ENVIRONMENT,
        client: {
          javascript: {
            source_map_enabled: true,
            code_version: VITE_VERSION,
            guess_uncaught_frames: true
          }
        }
      }
    : {}
) as Configuration;

const RollbarMiddleware: FC<RollbarProviderProps> = ({ children }) => {
  return <Provider config={rollbarConfig}>{children}</Provider>;
};

export default RollbarMiddleware;
