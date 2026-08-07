import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type LocalizedString = string | Record<string, string>;

export type ReleaseAudience = "admin" | "publisher";

interface ReleaseItem {
  type: "new" | "fix" | "improved" | "announcement";
  text: LocalizedString;
  description?: LocalizedString;
  audience?: ReleaseAudience;
}

export interface ReleaseEntry {
  id: string;
  notice?: LocalizedString | null;
  screenshot?: string | null;
  items: ReleaseItem[];
}

interface UseReleaseNotesReturn {
  hasNewReleases: boolean;
  newReleases: ReleaseEntry[];
  allReleases: ReleaseEntry[];
  isLoading: boolean;
  markAsSeen: () => void;
}

export function useReleaseNotes(
  audience: ReleaseAudience
): UseReleaseNotesReturn {
  const [lastSeenReleaseId, setLastSeenReleaseId] = useLocalStorage<
    string | null
  >(`lastSeenReleaseId:${audience}`, null);
  const lastSeenRef = useRef(lastSeenReleaseId);
  const [newReleases, setNewReleases] = useState<ReleaseEntry[]>([]);
  const [allReleases, setAllReleases] = useState<ReleaseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const fetchChangelog = async () => {
      try {
        const response = await fetch(`/changelog.json?t=${Date.now()}`);
        if (!response.ok) return;
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) return;
        const data: { releases: ReleaseEntry[] } = await response.json();

        const releases = data.releases
          .map((release) => ({
            ...release,
            items: release.items.filter(
              (item) => !item.audience || item.audience === audience
            )
          }))
          .filter((release) => release.items.length > 0);
        if (!releases.length) return;

        if (!ignore) setAllReleases(releases);

        const latestId = releases[0].id;
        const seenId = lastSeenRef.current;

        if (seenId === latestId) return;

        // Returning users: everything since their last visit. First-time
        // users: the latest day only — including date-suffixed siblings
        // (e.g. 2026-08-10-theme).
        const filtered = seenId
          ? releases.filter((r) => r.id > seenId)
          : releases.filter(
              (r) => r.id.substring(0, 10) === latestId.substring(0, 10)
            );
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
  }, [audience]);

  const markAsSeen = useCallback(() => {
    setNewReleases((prev) => {
      if (prev.length > 0) setLastSeenReleaseId(prev[0].id);
      return [];
    });
  }, [setLastSeenReleaseId]);

  return {
    hasNewReleases: newReleases.length > 0,
    newReleases,
    allReleases,
    isLoading,
    markAsSeen
  };
}
