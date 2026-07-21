import {
  createContext,
  useContext,
  useMemo,
  type FC,
  type ReactNode
} from "react";
import { useLocation } from "wouter";
import {
  useReleaseNotes,
  type ReleaseEntry
} from "../../hooks/useReleaseNotes";

// Publisher map links are the only route outside the admin app shell.
export const isPublisherRoute = (path: string) => path.startsWith("/map/");

interface ReleaseNotesContextValue {
  hasNewReleases: boolean;
  newReleases: ReleaseEntry[];
  allReleases: ReleaseEntry[];
  isLoading: boolean;
  markAsSeen: () => void;
}

const ReleaseNotesContext = createContext<ReleaseNotesContextValue | null>(
  null
);

export const ReleaseNotesProvider: FC<{ children: ReactNode }> = ({
  children
}) => {
  const [location] = useLocation();
  const audience = isPublisherRoute(location) ? "publisher" : "admin";
  const { hasNewReleases, newReleases, allReleases, isLoading, markAsSeen } =
    useReleaseNotes(audience);
  const contextValue = useMemo(
    () => ({ hasNewReleases, newReleases, allReleases, isLoading, markAsSeen }),
    [hasNewReleases, newReleases, allReleases, isLoading, markAsSeen]
  );
  return (
    <ReleaseNotesContext.Provider value={contextValue}>
      {children}
    </ReleaseNotesContext.Provider>
  );
};

export function useReleaseNotesContext(): ReleaseNotesContextValue {
  const ctx = useContext(ReleaseNotesContext);
  if (!ctx) {
    throw new Error(
      "useReleaseNotesContext must be used within ReleaseNotesProvider"
    );
  }
  return ctx;
}
