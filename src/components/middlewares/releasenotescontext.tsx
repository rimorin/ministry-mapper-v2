import { createContext, useContext, type FC, type ReactNode } from "react";
import {
  useReleaseNotes,
  type ReleaseEntry
} from "../../hooks/useReleaseNotes";

interface ReleaseNotesContextValue {
  hasNewReleases: boolean;
  newReleases: ReleaseEntry[];
  isLoading: boolean;
  markAsSeen: () => void;
}

const ReleaseNotesContext = createContext<ReleaseNotesContextValue | null>(
  null
);

export const ReleaseNotesProvider: FC<{ children: ReactNode }> = ({
  children
}) => {
  const value = useReleaseNotes();
  return (
    <ReleaseNotesContext.Provider value={value}>
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
