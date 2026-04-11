import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "../../utils/test";
import type { ReleaseEntry } from "../../hooks/useReleaseNotes";

vi.mock("../middlewares/releasenotescontext", () => ({
  useReleaseNotesContext: vi.fn()
}));

vi.mock("@ebay/nice-modal-react", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@ebay/nice-modal-react")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      show: vi.fn()
    }
  };
});

vi.mock("../modal/releasenotes", () => ({ default: vi.fn() }));

import { useReleaseNotesContext } from "../middlewares/releasenotescontext";
import NiceModal from "@ebay/nice-modal-react";
import { ReleaseNotifier } from "./releasenotifier";

const sampleReleases: ReleaseEntry[] = [
  {
    id: "2026-02-19",
    notice: null,
    screenshot: null,
    items: [{ type: "new", text: "add fields parameter" }]
  }
];

describe("ReleaseNotifier", () => {
  const mockMarkAsSeen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing (headless component)", () => {
    vi.mocked(useReleaseNotesContext).mockReturnValue({
      hasNewReleases: false,
      newReleases: [],
      allReleases: [],
      isLoading: false,
      markAsSeen: mockMarkAsSeen
    });

    const { container } = render(<ReleaseNotifier />);
    expect(
      container.querySelector('[data-testid="release-notifier"]')
    ).toBeNull();
  });

  it("does not show modal while loading", () => {
    vi.mocked(useReleaseNotesContext).mockReturnValue({
      hasNewReleases: false,
      newReleases: [],
      allReleases: [],
      isLoading: true,
      markAsSeen: mockMarkAsSeen
    });

    render(<ReleaseNotifier />);
    expect(NiceModal.show).not.toHaveBeenCalled();
  });

  it("does not show modal when no new releases", () => {
    vi.mocked(useReleaseNotesContext).mockReturnValue({
      hasNewReleases: false,
      newReleases: [],
      allReleases: [],
      isLoading: false,
      markAsSeen: mockMarkAsSeen
    });

    render(<ReleaseNotifier />);
    expect(NiceModal.show).not.toHaveBeenCalled();
  });

  it("shows release notes modal when hasNewReleases is true", () => {
    vi.mocked(useReleaseNotesContext).mockReturnValue({
      hasNewReleases: true,
      newReleases: sampleReleases,
      allReleases: sampleReleases,
      isLoading: false,
      markAsSeen: mockMarkAsSeen
    });

    render(<ReleaseNotifier />);
    expect(NiceModal.show).toHaveBeenCalledOnce();
    expect(NiceModal.show).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        releases: sampleReleases,
        onSeen: mockMarkAsSeen
      })
    );
  });

  it("shows modal only once even when re-rendered", () => {
    vi.mocked(useReleaseNotesContext).mockReturnValue({
      hasNewReleases: true,
      newReleases: sampleReleases,
      allReleases: sampleReleases,
      isLoading: false,
      markAsSeen: mockMarkAsSeen
    });

    const { rerender } = render(<ReleaseNotifier />);
    rerender(<ReleaseNotifier />);

    expect(NiceModal.show).toHaveBeenCalledOnce();
  });
});
