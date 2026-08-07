import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock useLocalStorage
const mockSetLastSeen = vi.fn();
let mockLastSeenValue: string | null = null;

vi.mock("./useLocalStorage", () => ({
  useLocalStorage: vi.fn(() => [mockLastSeenValue, mockSetLastSeen, vi.fn()])
}));

import { useReleaseNotes } from "./useReleaseNotes";

const sampleChangelog = {
  releases: [
    {
      id: "2026-02-19",
      notice: null,
      screenshot: null,
      items: [
        { type: "new", text: "add fields parameter" },
        { type: "fix", text: "fix territory check" }
      ]
    },
    {
      id: "2026-02-13",
      notice: null,
      screenshot: null,
      items: [{ type: "improved", text: "improved notifications" }]
    }
  ]
};

const localizedChangelog = {
  releases: [
    {
      id: "2026-02-19",
      notice: { en: "Important update", zh: "重要更新" },
      screenshot: null,
      items: [
        {
          type: "new",
          text: { en: "Add fields parameter", zh: "添加字段参数" },
          description: { en: "Details here.", zh: "详情在此。" }
        }
      ]
    }
  ]
};

const mockJsonResponse = (data: object) => ({
  ok: true,
  headers: {
    get: (key: string) => (key === "content-type" ? "application/json" : null)
  },
  json: async () => data
});

describe("useReleaseNotes", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockSetLastSeen.mockReset();
    mockLastSeenValue = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows only the latest release for first-time visitor", async () => {
    mockLastSeenValue = null;
    mockFetch.mockResolvedValueOnce(mockJsonResponse(sampleChangelog));
    expect(mockSetLastSeen).not.toHaveBeenCalled();
  });

  it("shows nothing when already on latest release", async () => {
    mockLastSeenValue = "2026-02-19";
    mockFetch.mockResolvedValueOnce(mockJsonResponse(sampleChangelog));

    const { result } = renderHook(() => useReleaseNotes("admin"));

    await act(async () => {});

    expect(result.current.hasNewReleases).toBe(false);
  });

  it("fetches changelog and returns new releases when behind", async () => {
    mockLastSeenValue = "2026-01-01";
    mockFetch.mockResolvedValueOnce(mockJsonResponse(sampleChangelog));

    const { result } = renderHook(() => useReleaseNotes("admin"));

    await act(async () => {});

    expect(result.current.hasNewReleases).toBe(true);
    expect(result.current.newReleases).toHaveLength(2);
    expect(result.current.newReleases[0].id).toBe("2026-02-19");
  });

  it("silently ignores fetch errors", async () => {
    mockLastSeenValue = "2026-02-13";
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useReleaseNotes("admin"));

    await act(async () => {});

    expect(result.current.hasNewReleases).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("silently ignores non-ok fetch response", async () => {
    mockLastSeenValue = "2026-02-13";
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useReleaseNotes("admin"));

    await act(async () => {});

    expect(result.current.hasNewReleases).toBe(false);
  });

  it("markAsSeen clears releases and updates localStorage", async () => {
    mockLastSeenValue = "2026-02-13";
    mockFetch.mockResolvedValueOnce(mockJsonResponse(sampleChangelog));

    const { result } = renderHook(() => useReleaseNotes("admin"));
    await act(async () => {});

    expect(result.current.hasNewReleases).toBe(true);

    act(() => {
      result.current.markAsSeen();
    });

    expect(mockSetLastSeen).toHaveBeenCalledWith("2026-02-19");
    expect(result.current.hasNewReleases).toBe(false);
  });

  it("only returns releases newer than lastSeenReleaseId", async () => {
    mockLastSeenValue = "2026-02-13";
    mockFetch.mockResolvedValueOnce(mockJsonResponse(sampleChangelog));

    const { result } = renderHook(() => useReleaseNotes("admin"));
    await act(async () => {});

    // Only 2026-02-19 is newer than 2026-02-13
    expect(result.current.newReleases).toHaveLength(1);
    expect(result.current.newReleases[0].id).toBe("2026-02-19");
  });

  it("isLoading starts true and becomes false after fetch", async () => {
    mockLastSeenValue = "2026-02-13";
    mockFetch.mockResolvedValueOnce(mockJsonResponse(sampleChangelog));

    const { result } = renderHook(() => useReleaseNotes("admin"));
    expect(result.current.isLoading).toBe(true);

    await act(async () => {});
    expect(result.current.isLoading).toBe(false);
  });

  it("passes LocalizedString entries through unchanged", async () => {
    mockLastSeenValue = null;
    mockFetch.mockResolvedValueOnce(mockJsonResponse(localizedChangelog));

    const { result } = renderHook(() => useReleaseNotes("admin"));
    await act(async () => {});

    expect(result.current.hasNewReleases).toBe(true);
    const entry = result.current.newReleases[0];
    expect(entry.notice).toEqual({ en: "Important update", zh: "重要更新" });
    expect(entry.items[0].text).toEqual({
      en: "Add fields parameter",
      zh: "添加字段参数"
    });
    expect(entry.items[0].description).toEqual({
      en: "Details here.",
      zh: "详情在此。"
    });
  });

  it("drops items meant for the other audience", async () => {
    mockLastSeenValue = null;
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({
        releases: [
          {
            id: "2026-03-01",
            notice: null,
            screenshot: null,
            items: [
              { type: "new", text: "admin only", audience: "admin" },
              { type: "new", text: "publisher only", audience: "publisher" },
              { type: "new", text: "everyone" }
            ]
          }
        ]
      })
    );

    const { result } = renderHook(() => useReleaseNotes("publisher"));
    await act(async () => {});

    expect(result.current.allReleases[0].items).toEqual([
      { type: "new", text: "publisher only", audience: "publisher" },
      { type: "new", text: "everyone" }
    ]);
  });

  it("shows all same-day entries to a first-time visitor", async () => {
    mockLastSeenValue = null;
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({
        releases: [
          {
            id: "2026-08-10-theme",
            notice: null,
            screenshot: null,
            items: [{ type: "new", text: "color themes" }]
          },
          {
            id: "2026-08-10",
            notice: null,
            screenshot: null,
            items: [{ type: "improved", text: "assignment flow" }]
          },
          {
            id: "2026-07-27",
            notice: null,
            screenshot: null,
            items: [{ type: "fix", text: "older release" }]
          }
        ]
      })
    );

    const { result } = renderHook(() => useReleaseNotes("admin"));
    await act(async () => {});

    expect(result.current.newReleases.map((r) => r.id)).toEqual([
      "2026-08-10-theme",
      "2026-08-10"
    ]);
  });

  it("shows only the suffixed entry when the plain same-day id was seen", async () => {
    mockLastSeenValue = "2026-08-10";
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({
        releases: [
          {
            id: "2026-08-10-theme",
            notice: null,
            screenshot: null,
            items: [{ type: "new", text: "color themes" }]
          },
          {
            id: "2026-08-10",
            notice: null,
            screenshot: null,
            items: [{ type: "improved", text: "assignment flow" }]
          }
        ]
      })
    );

    const { result } = renderHook(() => useReleaseNotes("admin"));
    await act(async () => {});

    expect(result.current.newReleases.map((r) => r.id)).toEqual([
      "2026-08-10-theme"
    ]);
  });

  it("skips a release left with no items for the current audience", async () => {
    mockLastSeenValue = null;
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({
        releases: [
          {
            id: "2026-03-01",
            notice: null,
            screenshot: null,
            items: [{ type: "new", text: "admin only", audience: "admin" }]
          },
          {
            id: "2026-02-19",
            notice: null,
            screenshot: null,
            items: [{ type: "new", text: "everyone" }]
          }
        ]
      })
    );

    const { result } = renderHook(() => useReleaseNotes("publisher"));
    await act(async () => {});

    expect(result.current.allReleases).toHaveLength(1);
    expect(result.current.allReleases[0].id).toBe("2026-02-19");
  });
});
