import { useState, useEffect, useCallback, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";

export interface ReleaseItem {
  type: "new" | "fix" | "improved";
  text: string;
}

export interface ReleaseEntry {
  id: string;
  notice?: string | null;
  screenshot?: string | null;
  items: ReleaseItem[];
}

interface UseReleaseNotesReturn {
  hasNewReleases: boolean;
  newReleases: ReleaseEntry[];
  isLoading: boolean;
  markAsSeen: () => void;
}

export function useReleaseNotes(): UseReleaseNotesReturn {
  const [lastSeenReleaseId, setLastSeenReleaseId] = useLocalStorage<
    string | null
  >("lastSeenReleaseId", null);
  const lastSeenRef = useRef(lastSeenReleaseId);
  const [newReleases, setNewReleases] = useState<ReleaseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const fetchChangelog = async () => {
      try {
        const response = await fetch(`/changelog.json?t=${Date.now()}`);
        if (!response.ok) return;
        const data: { releases: ReleaseEntry[] } = await response.json();
        if (!data.releases.length) return;

        const latestId = data.releases[0].id;
        const seenId = lastSeenRef.current;

        if (seenId === latestId) return;

        // Returning users see all releases since their last visit;
        // first-time users see only the latest entry.
        const filtered = seenId
          ? data.releases.filter((r) => r.id > seenId)
          : [data.releases[0]];
        if (filtered.length > 0 && !ignore) setNewReleases(filtered);
      } catch {
        // Silent fail — no noise for offline or missing file.
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchChangelog();
    return () => {
      ignore = true;
    };
  }, []);

  const markAsSeen = useCallback(() => {
    if (newReleases.length > 0) setLastSeenReleaseId(newReleases[0].id);
    setNewReleases([]);
  }, [newReleases, setLastSeenReleaseId]);

  return {
    hasNewReleases: newReleases.length > 0,
    newReleases,
    isLoading,
    markAsSeen
  };
}
