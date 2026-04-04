import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useVisibilityChange from "./useVisibilityManagement";

describe("useVisibilityManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useVisibilityChange", () => {
    it("should call callback when page becomes visible", () => {
      const callback = vi.fn();
      renderHook(() => useVisibilityChange(callback));

      act(() => {
        Object.defineProperty(document, "visibilityState", {
          writable: true,
          value: "visible"
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(callback).toHaveBeenCalled();
    });

    it("should not call callback when page becomes hidden", () => {
      const callback = vi.fn();
      renderHook(() => useVisibilityChange(callback));

      act(() => {
        Object.defineProperty(document, "visibilityState", {
          writable: true,
          value: "hidden"
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should use latest callback", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const { rerender } = renderHook(({ cb }) => useVisibilityChange(cb), {
        initialProps: { cb: callback1 }
      });

      rerender({ cb: callback2 });

      act(() => {
        Object.defineProperty(document, "visibilityState", {
          writable: true,
          value: "visible"
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it("should cleanup event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
      const { unmount } = renderHook(() => useVisibilityChange(() => {}));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
