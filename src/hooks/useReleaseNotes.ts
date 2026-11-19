import { useState, useEffect, useCallback } from "react";
import useLocalStorage from "./useLocalStorage";

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

const seenKey = (audience: ReleaseAudience) => `lastSeenReleaseId:${audience}`;

const readSeenId = (audience: ReleaseAudience): string | null => {
  try {
    const item = window.localStorage.getItem(seenKey(audience));
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

export function useReleaseNotes(
  audience: ReleaseAudience
): UseReleaseNotesReturn {
  const [, setLastSeenReleaseId] = useLocalStorage<string | null>(
    seenKey(audience),
    null
  );
  // A signed-in account moves between its links and a map without a reload,
  // so the audience changes under this hook. What is new is kept with the
  // audience it was worked out for, and never shown to the other one.
  const [fresh, setFresh] = useState<{
    audience: ReleaseAudience;
    releases: ReleaseEntry[];
  }>({ audience, releases: [] });
  const newReleases = fresh.audience === audience ? fresh.releases : [];
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
        // Read at fetch time: the marker belongs to this audience and may
        // have been written since the hook mounted.
        const seenId = readSeenId(audience);

        if (seenId === latestId) return;

        // Returning users: everything since their last visit. First-time
        // users: the latest day only — including date-suffixed siblings
        // (e.g. 2026-08-10-theme).
        const filtered = seenId
          ? releases.filter((r) => r.id > seenId)
          : releases.filter(
              (r) => r.id.substring(0, 10) === latestId.substring(0, 10)
            );
        if (filtered.length > 0 && !ignore) {
          setFresh({ audience, releases: filtered });
        }
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
    setFresh((prev) => {
      if (prev.releases.length > 0) setLastSeenReleaseId(prev.releases[0].id);
      return { ...prev, releases: [] };
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
