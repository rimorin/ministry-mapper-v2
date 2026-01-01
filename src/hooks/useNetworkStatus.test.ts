import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useNetworkStatus } from "./useNetworkStatus";

// Mock fetch
global.fetch = vi.fn();

describe("useNetworkStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: true
    });
  });

  describe("initialization", () => {
    it("should initialize with navigator.onLine status", () => {
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isSlowConnection).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("should cleanup event listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const removeDocEventListenerSpy = vi.spyOn(
        document,
        "removeEventListener"
      );

      const { unmount } = renderHook(() => useNetworkStatus());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "online",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "offline",
        expect.any(Function)
      );
      expect(removeDocEventListenerSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
      removeDocEventListenerSpy.mockRestore();
    });

    it("should not throw errors on cleanup", () => {
      const { unmount } = renderHook(() => useNetworkStatus());

      expect(() => unmount()).not.toThrow();
    });
  });
});
