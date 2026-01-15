import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "../../utils/test";
import { NetworkStatusBanner } from "./networkstatus";

// Mock the hooks
vi.mock("../../hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn()
}));

vi.mock("../../hooks/useLocalStorage", () => ({
  useLocalStorage: vi.fn()
}));

import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useLocalStorage } from "../../hooks/useLocalStorage";

describe("NetworkStatusBanner", () => {
  let mockSetIsDismissed: ReturnType<typeof vi.fn>;
  let mockRemoveValue: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetIsDismissed = vi.fn();
    mockRemoveValue = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when online and connection is good", () => {
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: false
    });
    vi.mocked(useLocalStorage).mockReturnValue([
      false,
      mockSetIsDismissed as (value: unknown) => void,
      mockRemoveValue as () => void
    ]);

    const { container } = render(<NetworkStatusBanner />);

    expect(
      container.querySelector(".network-status-banner")
    ).not.toBeInTheDocument();
  });

  it("should not render when dismissed", () => {
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: false,
      isSlowConnection: false
    });
    vi.mocked(useLocalStorage).mockReturnValue([
      true,
      mockSetIsDismissed as (value: unknown) => void,
      mockRemoveValue as () => void
    ]);

    const { container } = render(<NetworkStatusBanner />);

    expect(
      container.querySelector(".network-status-banner")
    ).not.toBeInTheDocument();
  });

  it("should render component structure when offline", () => {
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: false,
      isSlowConnection: false
    });
    vi.mocked(useLocalStorage).mockReturnValue([
      false,
      mockSetIsDismissed as (value: unknown) => void,
      mockRemoveValue as () => void
    ]);

    const { container } = render(<NetworkStatusBanner />);

    const banner = container.querySelector(".network-status-banner");
    expect(banner).toBeInTheDocument();
  });

  it("should render component structure when slow", () => {
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: true
    });
    vi.mocked(useLocalStorage).mockReturnValue([
      false,
      mockSetIsDismissed as (value: unknown) => void,
      mockRemoveValue as () => void
    ]);

    const { container } = render(<NetworkStatusBanner />);

    const banner = container.querySelector(".network-status-banner");
    expect(banner).toBeInTheDocument();
  });
});
