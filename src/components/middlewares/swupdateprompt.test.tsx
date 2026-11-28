import { describe, it, expect, vi, beforeEach } from "vitest";
import { navigate } from "wouter/use-browser-location";
import { render, act } from "@/utils/test";

const {
  mockToastAdd,
  mockReloadForNewDeploy,
  mockIsUpdateReady,
  mockApplyWaitingUpdate
} = vi.hoisted(() => ({
  mockToastAdd: vi.fn(),
  mockReloadForNewDeploy: vi.fn(),
  mockIsUpdateReady: vi.fn(),
  mockApplyWaitingUpdate: vi.fn()
}));

vi.mock("@/components/ui/toast-manager", () => ({
  toast: { add: mockToastAdd }
}));
vi.mock("@/utils/reloadForNewDeploy", () => ({
  reloadForNewDeploy: mockReloadForNewDeploy
}));
vi.mock("@/utils/appUpdate", () => ({
  isUpdateReady: mockIsUpdateReady,
  applyWaitingUpdate: mockApplyWaitingUpdate
}));

const { default: SwUpdatePrompt } = await import("./swupdateprompt");

describe("SwUpdatePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsUpdateReady.mockReturnValue(false);
    act(() => navigate("/"));
  });

  const announceUpdate = () =>
    act(() => {
      window.dispatchEvent(new CustomEvent("mm-sw-update"));
    });

  it("shows a persistent reload toast when an update is announced", () => {
    render(<SwUpdatePrompt />);

    announceUpdate();

    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ id: "sw-update", timeout: 0 })
    );
  });

  it("reloads the page from the toast action", () => {
    render(<SwUpdatePrompt />);
    announceUpdate();

    mockToastAdd.mock.calls[0][0].actionProps.onClick();

    expect(mockReloadForNewDeploy).toHaveBeenCalled();
  });

  it("shows the toast for an update found before it mounted", () => {
    mockIsUpdateReady.mockReturnValue(true);

    render(<SwUpdatePrompt />);

    expect(mockToastAdd).toHaveBeenCalledTimes(1);
  });

  it("offers a waiting update on each move to another address", async () => {
    render(<SwUpdatePrompt />);

    act(() => navigate("/map/abc"));

    await vi.waitFor(() =>
      expect(mockApplyWaitingUpdate).toHaveBeenCalledTimes(1)
    );
  });

  it("stops listening after unmount", () => {
    const { unmount } = render(<SwUpdatePrompt />);
    unmount();

    announceUpdate();

    expect(mockToastAdd).not.toHaveBeenCalled();
  });
});
