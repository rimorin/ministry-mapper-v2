import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockUnsubscribe = vi.fn();
const mockSubscribe = vi.fn();

vi.mock("../utils/pocketbase", () => ({
  pb: {
    realtime: {
      subscribe: mockSubscribe
    }
  }
}));

const { default: useOnSSEReconnect } = await import("./useOnSSEReconnect");

describe("useOnSSEReconnect", () => {
  let subscribedCallback: (() => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    subscribedCallback = undefined;
    mockSubscribe.mockImplementation((_topic: string, cb: () => void) => {
      subscribedCallback = cb;
      return Promise.resolve(mockUnsubscribe);
    });
  });

  const firePBConnect = () => {
    act(() => {
      subscribedCallback?.();
    });
  };

  describe("subscription lifecycle", () => {
    it("subscribes to PB_CONNECT when enabled", async () => {
      renderHook(() => useOnSSEReconnect(vi.fn()));

      await vi.waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledWith(
          "PB_CONNECT",
          expect.any(Function)
        );
      });
    });

    it("does not subscribe when disabled", () => {
      renderHook(() => useOnSSEReconnect(vi.fn(), false));

      expect(mockSubscribe).not.toHaveBeenCalled();
    });

    it("unsubscribes on unmount", async () => {
      const { unmount } = renderHook(() => useOnSSEReconnect(vi.fn()));

      await vi.waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("resubscribes when enabled changes from false to true", async () => {
      const { rerender } = renderHook(
        ({ enabled }) => useOnSSEReconnect(vi.fn(), enabled),
        { initialProps: { enabled: false } }
      );

      expect(mockSubscribe).not.toHaveBeenCalled();

      rerender({ enabled: true });

      await vi.waitFor(() => expect(mockSubscribe).toHaveBeenCalledTimes(1));
    });

    it("unsubscribes when enabled changes from true to false", async () => {
      const { rerender } = renderHook(
        ({ enabled }) => useOnSSEReconnect(vi.fn(), enabled),
        { initialProps: { enabled: true } }
      );

      await vi.waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

      rerender({ enabled: false });

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("does not call unsubscribe if subscribe promise was never resolved before unmount", async () => {
      mockSubscribe.mockReturnValue(new Promise(() => {})); // never resolves

      const { unmount } = renderHook(() => useOnSSEReconnect(vi.fn()));

      unmount();

      expect(mockUnsubscribe).not.toHaveBeenCalled();
    });
  });

  describe("callback behaviour", () => {
    it("calls callback when PB_CONNECT fires", async () => {
      const callback = vi.fn();
      renderHook(() => useOnSSEReconnect(callback));

      await vi.waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

      firePBConnect();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("always uses the latest callback reference", async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(({ cb }) => useOnSSEReconnect(cb), {
        initialProps: { cb: callback1 }
      });

      await vi.waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

      rerender({ cb: callback2 });

      firePBConnect();

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });
});
