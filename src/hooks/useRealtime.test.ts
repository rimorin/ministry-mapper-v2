import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock setupRealtimeListener before imports
vi.mock("../utils/pocketbase", () => ({
  setupRealtimeListener: vi.fn(),
  isAbortError: vi.fn().mockReturnValue(false)
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

    it("retries after a failed subscription attempt", async () => {
      vi.useFakeTimers();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (setupRealtimeListener as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error("Connection failed"))
        .mockResolvedValueOnce(mockUnsubscribe);

      const callback = vi.fn();
      renderHook(() =>
        useRealtimeSubscription("territories", callback, undefined, [], true)
      );

      // Advance 1000ms — flushes the rejection microtask and fires the retry timer
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(setupRealtimeListener).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
      vi.useRealTimers();
    });

    it("uses exponential backoff for successive retries", async () => {
      vi.useFakeTimers();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (setupRealtimeListener as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockRejectedValueOnce(new Error("Error 2"))
        .mockResolvedValueOnce(mockUnsubscribe);

      const callback = vi.fn();
      renderHook(() =>
        useRealtimeSubscription("territories", callback, undefined, [], true)
      );

      // First retry fires after 1000ms (2^0 * 1000)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(setupRealtimeListener).toHaveBeenCalledTimes(2);

      // Second retry fires after 2000ms (2^1 * 1000)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(setupRealtimeListener).toHaveBeenCalledTimes(3);

      consoleErrorSpy.mockRestore();
      vi.useRealTimers();
    });

    it("stops retrying when component unmounts during backoff", async () => {
      vi.useFakeTimers();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (setupRealtimeListener as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Connection failed")
      );

      const callback = vi.fn();
      const { unmount } = renderHook(() =>
        useRealtimeSubscription("territories", callback, undefined, [], true)
      );

      // Flush the rejection microtask without advancing past the retry timer
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      // Unmount before the 1000ms retry timer fires
      unmount();

      // Advance past what would have been the retry delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Only the initial call; no retry after unmount
      expect(setupRealtimeListener).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
      vi.useRealTimers();
    });

    it("cancels retry when enabled changes to false during backoff", async () => {
      vi.useFakeTimers();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (setupRealtimeListener as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Connection failed")
      );

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

      // Flush the rejection microtask without advancing into the retry window
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      // Disable — cleanup runs, setting isCleaned=true and clearing the timer
      rerender({ enabled: false });

      // Advance past what would have been the 1000ms retry delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Only the initial call; no retry after disabling
      expect(setupRealtimeListener).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
      vi.useRealTimers();
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

  describe("debounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should not subscribe before debounce fires", () => {
      const callback = vi.fn();

      renderHook(() =>
        useRealtimeSubscription(
          "territories",
          callback,
          undefined,
          [],
          true,
          50
        )
      );

      expect(setupRealtimeListener).not.toHaveBeenCalled();
    });

    it("should subscribe after debounce fires", async () => {
      const callback = vi.fn();

      renderHook(() =>
        useRealtimeSubscription(
          "territories",
          callback,
          undefined,
          [],
          true,
          50
        )
      );

      await vi.runAllTimersAsync();

      expect(setupRealtimeListener).toHaveBeenCalledWith(
        "territories",
        expect.any(Function),
        undefined
      );
    });

    it("should not subscribe if unmounted before debounce fires", async () => {
      const callback = vi.fn();

      const { unmount } = renderHook(() =>
        useRealtimeSubscription(
          "territories",
          callback,
          undefined,
          [],
          true,
          50
        )
      );

      unmount();
      await vi.runAllTimersAsync();

      expect(setupRealtimeListener).not.toHaveBeenCalled();
    });

    it("should not subscribe if dependency changes before debounce fires", async () => {
      const callback = vi.fn();

      const { rerender } = renderHook(
        ({ deps }) =>
          useRealtimeSubscription(
            "territories",
            callback,
            undefined,
            deps,
            true,
            50
          ),
        { initialProps: { deps: ["dep1"] } }
      );

      rerender({ deps: ["dep2"] });
      await vi.runAllTimersAsync();

      // Only one subscription should be set up (for dep2), not two
      expect(setupRealtimeListener).toHaveBeenCalledTimes(1);
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
