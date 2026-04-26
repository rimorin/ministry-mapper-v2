import { createContext, FC, ReactNode, useContext } from "react";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";

interface NetworkStatusContextValue {
  isOnline: boolean;
  isSlow: boolean;
  /** Unix ms timestamp of the last confirmed fast health check. Changes every
   *  30s when connection is healthy, enabling useSmartSync to schedule flushes
   *  even when isOnline/isSlow haven't changed (e.g. wake from sleep). */
  lastHealthyAt: number;
}

const NetworkStatusContext = createContext<
  NetworkStatusContextValue | undefined
>(undefined);

export const NetworkStatusProvider: FC<{ children: ReactNode }> = ({
  children
}) => {
  const { isOnline, isSlow, lastHealthyAt } = useNetworkStatus();
  return (
    <NetworkStatusContext.Provider value={{ isOnline, isSlow, lastHealthyAt }}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

export function useNetworkStatusContext(): NetworkStatusContextValue {
  const ctx = useContext(NetworkStatusContext);
  if (ctx === undefined) {
    throw new Error(
      "useNetworkStatusContext must be used within a NetworkStatusProvider"
    );
  }
  return ctx;
}
