import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "../../utils/test";
import { NetworkStatusBanner } from "./networkstatus";

vi.mock("../middlewares/networkstatuscontext", () => ({
  useNetworkStatusContext: vi.fn()
}));

import { useNetworkStatusContext } from "../middlewares/networkstatuscontext";

describe("NetworkStatusBanner", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not render any pill when online and fast", () => {
    vi.mocked(useNetworkStatusContext).mockReturnValue({
      isOnline: true,
      isSlow: false,
      lastHealthyAt: 0
    });

    const { container } = render(<NetworkStatusBanner />);

    expect(
      container.querySelector("[data-network-status]")
    ).not.toBeInTheDocument();
  });

  it("should render offline pill when offline", () => {
    vi.mocked(useNetworkStatusContext).mockReturnValue({
      isOnline: false,
      isSlow: false,
      lastHealthyAt: 0
    });

    const { container, getByText } = render(<NetworkStatusBanner />);

    expect(
      container.querySelector("[data-network-status]")
    ).toBeInTheDocument();
    expect(getByText(/No internet connection/i)).toBeInTheDocument();
  });

  it("should render slow connection pill when online but slow", () => {
    vi.mocked(useNetworkStatusContext).mockReturnValue({
      isOnline: true,
      isSlow: true,
      lastHealthyAt: 0
    });

    const { container, getByText } = render(<NetworkStatusBanner />);
    const indicator = container.querySelector("[data-network-status]");

    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("data-slow", "true");
    expect(getByText(/Weak connection/i)).toBeInTheDocument();
  });

  it("should always render the ARIA live region regardless of network state", () => {
    vi.mocked(useNetworkStatusContext).mockReturnValue({
      isOnline: true,
      isSlow: false,
      lastHealthyAt: 0
    });
    const { container: onlineContainer } = render(<NetworkStatusBanner />);
    expect(
      onlineContainer.querySelector("[role='status']")
    ).toBeInTheDocument();

    vi.mocked(useNetworkStatusContext).mockReturnValue({
      isOnline: false,
      isSlow: false,
      lastHealthyAt: 0
    });
    const { container: offlineContainer } = render(<NetworkStatusBanner />);
    expect(
      offlineContainer.querySelector("[role='status']")
    ).toBeInTheDocument();
  });
});
