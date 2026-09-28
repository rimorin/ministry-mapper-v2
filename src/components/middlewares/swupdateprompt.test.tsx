import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@/utils/test";

const { mockToastAdd } = vi.hoisted(() => ({ mockToastAdd: vi.fn() }));

vi.mock("@/components/ui/toast-manager", () => ({
  toast: { add: mockToastAdd }
}));

const { default: SwUpdatePrompt } = await import("./swupdateprompt");

describe("SwUpdatePrompt", () => {
  const reload = vi.fn();
  const realLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom cannot reload.
    Object.defineProperty(window, "location", {
      value: { reload },
      writable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: realLocation,
      writable: true
    });
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

    expect(reload).toHaveBeenCalled();
  });

  it("stops listening after unmount", () => {
    const { unmount } = render(<SwUpdatePrompt />);
    unmount();

    announceUpdate();

    expect(mockToastAdd).not.toHaveBeenCalled();
  });
});
