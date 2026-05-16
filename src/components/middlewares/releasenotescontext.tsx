import {
  createContext,
  useContext,
  useMemo,
  type FC,
  type ReactNode
} from "react";
import {
  useReleaseNotes,
  type ReleaseEntry
} from "../../hooks/useReleaseNotes";

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
  const { hasNewReleases, newReleases, allReleases, isLoading, markAsSeen } =
    useReleaseNotes();
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
