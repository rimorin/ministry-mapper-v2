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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleChangelog
    });

    const { result } = renderHook(() => useReleaseNotes());

    await act(async () => {});

    expect(result.current.hasNewReleases).toBe(true);
    expect(result.current.newReleases).toHaveLength(1);
    expect(result.current.newReleases[0].id).toBe("2026-02-19");
    expect(mockSetLastSeen).not.toHaveBeenCalled();
  });

  it("shows nothing when already on latest release", async () => {
    mockLastSeenValue = "2026-02-19";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleChangelog
    });

    const { result } = renderHook(() => useReleaseNotes());

    await act(async () => {});

    expect(result.current.hasNewReleases).toBe(false);
  });

  it("fetches changelog and returns new releases when behind", async () => {
    mockLastSeenValue = "2026-01-01";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleChangelog
    });

    const { result } = renderHook(() => useReleaseNotes());

    await act(async () => {});

    expect(result.current.hasNewReleases).toBe(true);
    expect(result.current.newReleases).toHaveLength(2);
    expect(result.current.newReleases[0].id).toBe("2026-02-19");
  });

  it("silently ignores fetch errors", async () => {
    mockLastSeenValue = "2026-02-13";
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useReleaseNotes());

    await act(async () => {});

    expect(result.current.hasNewReleases).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("silently ignores non-ok fetch response", async () => {
    mockLastSeenValue = "2026-02-13";
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useReleaseNotes());

    await act(async () => {});

    expect(result.current.hasNewReleases).toBe(false);
  });

  it("markAsSeen clears releases and updates localStorage", async () => {
    mockLastSeenValue = "2026-02-13";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleChangelog
    });

    const { result } = renderHook(() => useReleaseNotes());
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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleChangelog
    });

    const { result } = renderHook(() => useReleaseNotes());
    await act(async () => {});

    // Only 2026-02-19 is newer than 2026-02-13
    expect(result.current.newReleases).toHaveLength(1);
    expect(result.current.newReleases[0].id).toBe("2026-02-19");
  });

  it("isLoading starts true and becomes false after fetch", async () => {
    mockLastSeenValue = "2026-02-13";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleChangelog
    });

    const { result } = renderHook(() => useReleaseNotes());
    expect(result.current.isLoading).toBe(true);

    await act(async () => {});
    expect(result.current.isLoading).toBe(false);
  });
});
