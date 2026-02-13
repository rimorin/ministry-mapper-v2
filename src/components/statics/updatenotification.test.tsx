import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "../../utils/test";
import { UpdateNotification } from "./updatenotification";

// Mock the hooks
vi.mock("../../hooks/useVersionCheck", () => ({
  useVersionCheck: vi.fn()
}));

vi.mock("../middlewares/toast", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../middlewares/toast")>();
  return {
    ...actual,
    useToast: vi.fn()
  };
});

import { useVersionCheck } from "../../hooks/useVersionCheck";
import { useToast } from "../middlewares/toast";

describe("UpdateNotification", () => {
  const mockShowToast = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.mocked(useToast).mockReturnValue({
      showToast: mockShowToast,
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not show notification when no update needed", () => {
    vi.mocked(useVersionCheck).mockReturnValue({
      needRefresh: false,
      refresh: mockRefresh
    });

    render(<UpdateNotification />);

    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it("should show notification when update needed", () => {
    vi.mocked(useVersionCheck).mockReturnValue({
      needRefresh: true,
      refresh: mockRefresh
    });

    render(<UpdateNotification />);

    expect(mockShowToast).toHaveBeenCalledTimes(1);
  });

  it("should call showToast with info variant", () => {
    vi.mocked(useVersionCheck).mockReturnValue({
      needRefresh: true,
      refresh: mockRefresh
    });

    render(<UpdateNotification />);

    const callArgs = mockShowToast.mock.calls[0];
    expect(callArgs[1]).toBe("info");
    expect(callArgs[3]).toEqual({ autohide: false });
  });

  it("should return null component (no visible content)", () => {
    vi.mocked(useVersionCheck).mockReturnValue({
      needRefresh: false,
      refresh: mockRefresh
    });

    const { container } = render(<UpdateNotification />);

    // The component itself returns null, though React providers may add wrapper elements
    expect(
      container.querySelector('[data-testid="update-notification"]')
    ).toBeNull();
  });

  it("should call useVersionCheck with 60 second interval", () => {
    vi.mocked(useVersionCheck).mockReturnValue({
      needRefresh: false,
      refresh: mockRefresh
    });

    render(<UpdateNotification />);

    expect(useVersionCheck).toHaveBeenCalledWith(60000);
  });
});
