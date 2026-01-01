import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock setupRealtimeListener before imports
vi.mock("../utils/pocketbase", () => ({
  setupRealtimeListener: vi.fn()
}));

// Import after mocks
const { default: useRealtimeSubscription } = await import("./useRealtime");
const { setupRealtimeListener } = await import("../utils/pocketbase");

describe("useRealtimeSubscription", () => {
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (setupRealtimeListener as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockUnsubscribe
    );
  });

  describe("subscription lifecycle", () => {
    it("should subscribe when enabled", async () => {
      const callback = vi.fn();
      const options = { expand: "user" };

      renderHook(() =>
        useRealtimeSubscription("territories", callback, options, [], true)
      );

      await vi.waitFor(() => {
        expect(setupRealtimeListener).toHaveBeenCalledWith(
          "territories",
          expect.any(Function),
          options
        );
      });
    });

    it("should not subscribe when disabled", () => {
      const callback = vi.fn();

      renderHook(() =>
        useRealtimeSubscription("territories", callback, undefined, [], false)
      );

      expect(setupRealtimeListener).not.toHaveBeenCalled();
    });

    it("should unsubscribe on unmount", async () => {
      const callback = vi.fn();

      const { unmount } = renderHook(() =>
        useRealtimeSubscription("territories", callback, undefined, [], true)
      );

      await vi.waitFor(() => {
        expect(setupRealtimeListener).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("should resubscribe when dependencies change", async () => {
      const callback = vi.fn();
      const { rerender } = renderHook(
        ({ deps }) =>
          useRealtimeSubscription(
            "territories",
            callback,
            undefined,
            deps,
            true
          ),
        { initialProps: { deps: ["dep1"] } }
      );

      await vi.waitFor(() => {
        expect(setupRealtimeListener).toHaveBeenCalledTimes(1);
      });

      rerender({ deps: ["dep2"] });

      await vi.waitFor(() => {
        expect(setupRealtimeListener).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("callback handling", () => {
    it("should call callback on data update", async () => {
      const callback = vi.fn();
      let subscriptionCallback: ((data: unknown) => void) | undefined;

      (setupRealtimeListener as ReturnType<typeof vi.fn>).mockImplementation(
        (_name: string, cb: (data: unknown) => void) => {
          subscriptionCallback = cb;
          return Promise.resolve(mockUnsubscribe);
        }
      );

      renderHook(() =>
        useRealtimeSubscription("territories", callback, undefined, [], true)
      );

      await vi.waitFor(() => {
        expect(setupRealtimeListener).toHaveBeenCalled();
      });

      const testData = { action: "create", record: { id: "123" } };
      act(() => {
        subscriptionCallback?.(testData);
      });

      expect(callback).toHaveBeenCalledWith(testData);
    });

    it("should use latest callback reference", async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      let subscriptionCallback: ((data: unknown) => void) | undefined;

      (setupRealtimeListener as ReturnType<typeof vi.fn>).mockImplementation(
        (_name: string, cb: (data: unknown) => void) => {
          subscriptionCallback = cb;
          return Promise.resolve(mockUnsubscribe);
        }
      );

      const { rerender } = renderHook(
        ({ cb }) =>
          useRealtimeSubscription("territories", cb, undefined, [], true),
        { initialProps: { cb: callback1 } }
      );

      await vi.waitFor(() => {
        expect(setupRealtimeListener).toHaveBeenCalled();
      });

      rerender({ cb: callback2 });

      const testData = { action: "update", record: { id: "456" } };
      act(() => {
        subscriptionCallback?.(testData);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith(testData);
    });
  });

  describe("error handling", () => {
    it("should handle subscription errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (setupRealtimeListener as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Connection failed")
      );
      const callback = vi.fn();

      renderHook(() =>
        useRealtimeSubscription("territories", callback, undefined, [], true)
      );

      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to setup realtime listener:",
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it("should not throw on cleanup if subscription failed", async () => {
      (setupRealtimeListener as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Failed")
      );
      const callback = vi.fn();

      const { unmount } = renderHook(() =>
        useRealtimeSubscription("territories", callback, undefined, [], true)
      );

      await vi.waitFor(() => {
        expect(setupRealtimeListener).toHaveBeenCalled();
      });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe("subscription options", () => {
    it("should apply filter options", async () => {
      const callback = vi.fn();
      const options = { filter: 'congregation="123"' };

      renderHook(() =>
        useRealtimeSubscription("territories", callback, options, [], true)
      );

      await vi.waitFor(() => {
        expect(setupRealtimeListener).toHaveBeenCalledWith(
          "territories",
          expect.any(Function),
          expect.objectContaining({ filter: 'congregation="123"' })
        );
      });
    });

    it("should apply expand options", async () => {
      const callback = vi.fn();
      const options = { expand: "user,maps" };

      renderHook(() =>
        useRealtimeSubscription("territories", callback, options, [], true)
      );

      await vi.waitFor(() => {
        expect(setupRealtimeListener).toHaveBeenCalledWith(
          "territories",
          expect.any(Function),
          expect.objectContaining({ expand: "user,maps" })
        );
      });
    });
  });

  describe("performance", () => {
    it("should not recreate subscription when callback changes but deps unchanged", async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(
        ({ cb }) =>
          useRealtimeSubscription("territories", cb, undefined, ["dep1"], true),
        { initialProps: { cb: callback1 } }
      );

      await vi.waitFor(() => {
        expect(setupRealtimeListener).toHaveBeenCalledTimes(1);
      });

      rerender({ cb: callback2 });

      // Should not resubscribe since dependencies haven't changed
      expect(setupRealtimeListener).toHaveBeenCalledTimes(1);
    });

    it("should handle rapid enable/disable toggles", async () => {
      const callback = vi.fn();
      const { rerender } = renderHook(
        ({ enabled }) =>
          useRealtimeSubscription(
            "territories",
            callback,
            undefined,
            [],
            enabled
          ),
        { initialProps: { enabled: true } }
      );

      await vi.waitFor(() => {
        expect(setupRealtimeListener).toHaveBeenCalledTimes(1);
      });

      rerender({ enabled: false });
      rerender({ enabled: true });

      await vi.waitFor(() => {
        expect(setupRealtimeListener).toHaveBeenCalledTimes(2);
      });
    });
  });
});
