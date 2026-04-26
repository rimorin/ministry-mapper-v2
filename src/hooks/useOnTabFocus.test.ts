import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { default: useOnTabFocus, TAB_FOCUS_THROTTLE_MS } =
  await import("./useOnTabFocus");

const simulateHide = () => {
  Object.defineProperty(document, "hidden", {
    writable: true,
    configurable: true,
    value: true
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

const simulateShow = () => {
  Object.defineProperty(document, "hidden", {
    writable: true,
    configurable: true,
    value: false
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("useOnTabFocus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: false
    });
  });

  describe("basic behaviour", () => {
    it("calls callback when tab becomes visible", () => {
      const callback = vi.fn();
      renderHook(() => useOnTabFocus(callback));

      act(() => simulateHide());
      act(() => simulateShow());

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("does not call callback when tab becomes hidden", () => {
      const callback = vi.fn();
      renderHook(() => useOnTabFocus(callback));

      act(() => simulateHide());

      expect(callback).not.toHaveBeenCalled();
    });

    it("does not call callback on mount", () => {
      const callback = vi.fn();
      renderHook(() => useOnTabFocus(callback));

      expect(callback).not.toHaveBeenCalled();
    });

    it("does not call callback after unmount", () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() => useOnTabFocus(callback));

      unmount();
      act(() => simulateHide());
      act(() => simulateShow());

      expect(callback).not.toHaveBeenCalled();
    });

    it("always calls the latest callback reference", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(({ cb }) => useOnTabFocus(cb), {
        initialProps: { cb: callback1 }
      });

      rerender({ cb: callback2 });

      act(() => simulateHide());
      act(() => simulateShow());

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe("throttle", () => {
    it("suppresses callback when tab refocuses within the throttle window", () => {
      const callback = vi.fn();
      renderHook(() => useOnTabFocus(callback));

      // First focus — always goes through (lastCalledAt starts at -Infinity)
      act(() => simulateHide());
      act(() => simulateShow());
      expect(callback).toHaveBeenCalledTimes(1);

      // Refocus before throttle window expires
      act(() => simulateHide());
      act(() => {
        vi.advanceTimersByTime(TAB_FOCUS_THROTTLE_MS - 1);
        simulateShow();
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("calls callback again once the throttle window expires", () => {
      const callback = vi.fn();
      renderHook(() => useOnTabFocus(callback));

      act(() => simulateHide());
      act(() => simulateShow());

      act(() => simulateHide());
      act(() => {
        vi.advanceTimersByTime(TAB_FOCUS_THROTTLE_MS);
        simulateShow();
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("calls callback on first focus regardless of throttle", () => {
      const callback = vi.fn();
      renderHook(() => useOnTabFocus(callback));

      // No time has advanced — lastCalledAt is -Infinity so it always passes
      act(() => simulateHide());
      act(() => simulateShow());

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("respects a custom throttleMs", () => {
      const callback = vi.fn();
      const customThrottle = 5_000;
      renderHook(() => useOnTabFocus(callback, customThrottle));

      act(() => simulateHide());
      act(() => simulateShow());

      // Within custom window — suppressed
      act(() => simulateHide());
      act(() => {
        vi.advanceTimersByTime(customThrottle - 1);
        simulateShow();
      });
      expect(callback).toHaveBeenCalledTimes(1);

      // After custom window — fires
      act(() => simulateHide());
      act(() => {
        vi.advanceTimersByTime(customThrottle);
        simulateShow();
      });
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("default throttle is TAB_FOCUS_THROTTLE_MS", () => {
      expect(TAB_FOCUS_THROTTLE_MS).toBe(15_000);
    });
  });
});
