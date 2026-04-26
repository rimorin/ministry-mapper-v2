import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNetworkStatus } from "./useNetworkStatus";

const OK_RESPONSE = {
  ok: true,
  headers: {
    get: (h: string) => (h === "content-type" ? "application/json" : null)
  }
};

describe("useNetworkStatus", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      configurable: true,
      value: true
    });
    // Default: Network Information API present and fast (Chrome/Android).
    // Tests that need no-API mode (iOS/Firefox) set this to undefined explicitly.
    Object.defineProperty(navigator, "connection", {
      writable: true,
      configurable: true,
      value: {
        effectiveType: "4g",
        downlink: 10,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("initialization", () => {
    it("should initialize with navigator.onLine status and isSlow false", () => {
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isSlow).toBe(false);
    });
  });

  describe("isSlow detection", () => {
    it("should set isSlow only after SLOW_CONFIRM_COUNT consecutive slow responses", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));

      const nowSpy = vi.spyOn(performance, "now");
      // Three consecutive slow responses (>1500ms threshold)
      nowSpy
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // 1st check: slow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // 2nd check: slow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // 3rd check: slow
        .mockReturnValue(0);

      const { result } = renderHook(() => useNetworkStatus());

      // 1st slow check — not yet confirmed (1 of 3)
      await act(async () => {});
      expect(result.current.isSlow).toBe(false);

      // 2nd slow check (advance 30s — still INTERVAL_FAST, not confirmed yet)
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      expect(result.current.isSlow).toBe(false);

      // 3rd slow check — confirmed slow (3 of 3)
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      expect(result.current.isSlow).toBe(true);

      nowSpy.mockRestore();
      vi.useRealTimers();
    });

    it("should exit isSlow after a single fast response (FAST_CONFIRM_COUNT=1)", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));

      const nowSpy = vi.spyOn(performance, "now");
      // 3 slow → confirmed slow; then 1 fast → clears immediately
      nowSpy
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // slow 1/3
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // slow 2/3
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // slow 3/3 → isSlow=true
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(500) // fast 1/1 → isSlow=false
        .mockReturnValue(0);

      const { result } = renderHook(() => useNetworkStatus());

      // Initial + 2 scheduled checks → confirmed slow
      await act(async () => {});
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      expect(result.current.isSlow).toBe(true);

      // 1st fast check — FAST_CONFIRM_COUNT=1 → exits slow immediately
      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });
      await act(async () => {});
      expect(result.current.isSlow).toBe(false);

      nowSpy.mockRestore();
      vi.useRealTimers();
    });

    it("should re-enter slow after SLOW_CONFIRM_COUNT consecutive slow samples following recovery", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));

      const nowSpy = vi.spyOn(performance, "now");
      // 3 slow → confirmed slow; 1 fast → exits immediately; 3 slow → re-enters
      nowSpy
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // slow 1/3
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // slow 2/3
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // slow 3/3 → confirmed
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(500) // fast 1/1 → exits slow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // slow 1/3 (re-entering)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // slow 2/3
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // slow 3/3 → re-enters slow
        .mockReturnValue(0);

      const { result } = renderHook(() => useNetworkStatus());

      await act(async () => {});
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      expect(result.current.isSlow).toBe(true);

      // 1 fast → exits slow immediately (FAST_CONFIRM_COUNT=1)
      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });
      await act(async () => {});
      expect(result.current.isSlow).toBe(false);

      // 3 slow at INTERVAL_FAST intervals → re-enters slow
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      expect(result.current.isSlow).toBe(true);

      nowSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe("Network Information API", () => {
    function mockConnection(
      props: Partial<{ effectiveType: string; downlink: number; rtt: number }>
    ) {
      const listeners = new Map<string, EventListener>();
      const connection = {
        ...props,
        addEventListener: vi.fn((type: string, fn: EventListener) => {
          listeners.set(type, fn);
        }),
        removeEventListener: vi.fn(),
        _trigger: (type: string) => listeners.get(type)?.({} as Event)
      };
      Object.defineProperty(navigator, "connection", {
        writable: true,
        configurable: true,
        value: connection
      });
      return connection;
    }

    it("should not crash when navigator.connection is absent (Safari/Firefox)", async () => {
      Object.defineProperty(navigator, "connection", {
        writable: true,
        configurable: true,
        value: undefined
      });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));
      const nowSpy = vi.spyOn(performance, "now").mockReturnValue(0);

      expect(() => renderHook(() => useNetworkStatus())).not.toThrow();

      nowSpy.mockRestore();
    });

    it("should detect slow on mount when connection.effectiveType is slow-2g", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));
      mockConnection({ effectiveType: "slow-2g", downlink: 0.1 });
      const nowSpy = vi.spyOn(performance, "now").mockReturnValue(0);

      const { result } = renderHook(() => useNetworkStatus());
      // Mount check applies instantly (before first health check resolves)
      expect(result.current.isSlow).toBe(true);

      nowSpy.mockRestore();
    });

    it("should set isSlow on connection change to 2g without changing isOnline", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));
      const conn = mockConnection({ effectiveType: "4g", downlink: 10 });
      const nowSpy = vi
        .spyOn(performance, "now")
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(500) // initial fast check
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // connection-change check (slow — isSlow stays true)
        .mockReturnValue(0);

      const { result } = renderHook(() => useNetworkStatus());
      await act(async () => {});
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isSlow).toBe(false);

      // Simulate OS reporting 2g
      conn.effectiveType = "2g";
      conn.downlink = 0.1;
      await act(async () => {
        conn._trigger("change");
      });
      await act(async () => {});

      // isOnline preserved; isSlow set immediately from hint
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isSlow).toBe(true);

      nowSpy.mockRestore();
      vi.useRealTimers();
    });

    it("should not trigger checkConnection when tab is hidden on connection change", async () => {
      const fetchMock = vi.fn().mockResolvedValue(OK_RESPONSE);
      vi.stubGlobal("fetch", fetchMock);
      const conn = mockConnection({ effectiveType: "4g", downlink: 10 });
      const nowSpy = vi
        .spyOn(performance, "now")
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(500);

      renderHook(() => useNetworkStatus());
      await act(async () => {});
      fetchMock.mockClear();

      // Hide tab then fire connection change
      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: true
      });
      conn.effectiveType = "2g";
      await act(async () => {
        conn._trigger("change");
      });
      await act(async () => {});

      expect(fetchMock).not.toHaveBeenCalled();

      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: false
      });
      nowSpy.mockRestore();
    });

    it("should clean up connection change listener on unmount", () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));
      const conn = mockConnection({ effectiveType: "4g", downlink: 10 });

      const { unmount } = renderHook(() => useNetworkStatus());
      unmount();

      expect(conn.removeEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function)
      );
    });

    it("should detect slow via rtt spike even when effectiveType is still 4g", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));
      // effectiveType "4g" but rtt >= SLOW_THRESHOLD_MS (1500ms) — degraded 4G/3G
      const conn = mockConnection({
        effectiveType: "4g",
        downlink: 5,
        rtt: 1600
      });
      const nowSpy = vi.spyOn(performance, "now").mockReturnValue(0);

      const { result } = renderHook(() => useNetworkStatus());
      // Mount check: rtt=1600 → isConnectionSlow → isSlow pre-seeded true
      expect(result.current.isSlow).toBe(true);

      nowSpy.mockRestore();
      conn._trigger("change"); // suppress "unused" warning
    });

    it("should exit isSlow after one fast health probe on slow-connection mount (FAST_CONFIRM_COUNT=1)", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));

      const conn = mockConnection({
        effectiveType: "2g",
        downlink: 0.1,
        rtt: 2000
      });
      const nowSpy = vi
        .spyOn(performance, "now")
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(500) // initial check: fast → exits slow immediately
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(500) // connection-change check
        .mockReturnValue(0);

      const { result } = renderHook(() => useNetworkStatus());
      // Mount: 2g connection → isSlow pre-seeded true
      expect(result.current.isSlow).toBe(true);

      // Initial health check: fast — FAST_CONFIRM_COUNT=1 → clears immediately
      await act(async () => {});
      expect(result.current.isSlow).toBe(false);

      // OS upgrade event; connection already fast — isSlow stays false
      conn.effectiveType = "4g";
      conn.rtt = 50;
      conn.downlink = 10;
      await act(async () => {
        conn._trigger("change");
      });
      await act(async () => {});
      expect(result.current.isSlow).toBe(false);

      nowSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe("navigator.onLine fast-path", () => {
    it("should go offline immediately without a fetch when navigator.onLine is false", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        configurable: true,
        value: false
      });
      const fetchMock = vi.fn().mockResolvedValue(OK_RESPONSE);
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useNetworkStatus());
      await act(async () => {});

      expect(result.current.isOnline).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("isSlow detection (continued)", () => {
    it("should keep isSlow false on a fast response when not previously slow", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));

      const nowSpy = vi.spyOn(performance, "now");
      nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(500);

      const { result } = renderHook(() => useNetworkStatus());
      await act(async () => {});

      expect(result.current.isSlow).toBe(false);
      expect(result.current.isOnline).toBe(true);

      nowSpy.mockRestore();
    });

    it("should set isOnline false and isSlow false on network error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
      );

      const { result } = renderHook(() => useNetworkStatus());
      await act(async () => {});

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isSlow).toBe(false);
    });
  });

  describe("no-API adaptive mode (iOS/Firefox)", () => {
    it("should confirm slow after 2 checks (SLOW_CONFIRM_COUNT_NO_API) when navigator.connection absent", async () => {
      Object.defineProperty(navigator, "connection", {
        writable: true,
        configurable: true,
        value: undefined
      });
      vi.useFakeTimers();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));

      const nowSpy = vi.spyOn(performance, "now");
      // 2 consecutive slow responses — should confirm slow without a 3rd
      nowSpy
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // slow 1/2
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // slow 2/2 → isSlow=true
        .mockReturnValue(0);

      const { result } = renderHook(() => useNetworkStatus());

      // 1st slow check (initial)
      await act(async () => {});
      expect(result.current.isSlow).toBe(false); // not yet (1/2)

      // 2nd slow check at INTERVAL_FAST_NO_API = 15s
      await act(async () => {
        vi.advanceTimersByTime(15_000);
      });
      await act(async () => {});
      expect(result.current.isSlow).toBe(true); // confirmed after 2 checks ✅

      nowSpy.mockRestore();
      vi.useRealTimers();
    });

    it("should use INTERVAL_FAST_NO_API (15s) polling when navigator.connection absent", async () => {
      Object.defineProperty(navigator, "connection", {
        writable: true,
        configurable: true,
        value: undefined
      });
      vi.useFakeTimers();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));
      const nowSpy = vi.spyOn(performance, "now").mockReturnValue(0);

      const fetchMock = vi.mocked(fetch);
      renderHook(() => useNetworkStatus());
      await act(async () => {});
      fetchMock.mockClear();

      // Should NOT fire at 10s (less than 15s)
      await act(async () => {
        vi.advanceTimersByTime(10_000);
      });
      await act(async () => {});
      expect(fetchMock).not.toHaveBeenCalled();

      // SHOULD fire at 15s (INTERVAL_FAST_NO_API)
      await act(async () => {
        vi.advanceTimersByTime(5_000);
      });
      await act(async () => {});
      expect(fetchMock).toHaveBeenCalledTimes(1);

      nowSpy.mockRestore();
      vi.useRealTimers();
    });

    it("should use standard intervals (30s) when navigator.connection is present", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));
      Object.defineProperty(navigator, "connection", {
        writable: true,
        configurable: true,
        value: {
          effectiveType: "4g",
          downlink: 10,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }
      });
      const nowSpy = vi.spyOn(performance, "now").mockReturnValue(0);

      const fetchMock = vi.mocked(fetch);
      renderHook(() => useNetworkStatus());
      await act(async () => {});
      fetchMock.mockClear();

      // Should NOT fire at 20s (less than INTERVAL_FAST=30s)
      await act(async () => {
        vi.advanceTimersByTime(20_000);
      });
      await act(async () => {});
      expect(fetchMock).not.toHaveBeenCalled();

      // SHOULD fire at 30s
      await act(async () => {
        vi.advanceTimersByTime(10_000);
      });
      await act(async () => {});
      expect(fetchMock).toHaveBeenCalledTimes(1);

      nowSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe("adaptive poll interval", () => {
    it("uses fast interval (30s) after a fast response", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));
      const nowSpy = vi.spyOn(performance, "now");
      nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(500); // fast

      const fetchMock = vi.mocked(fetch);
      renderHook(() => useNetworkStatus());
      await act(async () => {});
      fetchMock.mockClear();

      // Advance 30s — should trigger next check
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      expect(fetchMock).toHaveBeenCalledTimes(1);

      nowSpy.mockRestore();
      vi.useRealTimers();
    });

    it("uses slow interval (60s) after SLOW_CONFIRM_COUNT consecutive slow responses", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));
      const nowSpy = vi.spyOn(performance, "now");
      // Three consecutive slow responses — one per scheduled check.
      // Note: scheduleNextCheck() is called synchronously before the first async
      // checkConnection resolves, so the first two timers are 30s (INTERVAL_FAST).
      // retryDelayRef switches to INTERVAL_SLOW=60s only after the 3rd slow check.
      nowSpy
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // initial check: slow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // 30s check: slow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2000) // 60s check: slow (confirms slow, retryDelay → 60s)
        .mockReturnValue(0);

      const fetchMock = vi.mocked(fetch);
      renderHook(() => useNetworkStatus());

      // Initial check (slow — count 1/3; retryDelayRef still 30s when timer was set)
      await act(async () => {});
      // Advance 30s → 2nd check fires (slow — count 2/3; retryDelayRef still 30s)
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      // Advance 30s → 3rd check fires (slow — count 3/3; retryDelayRef → 60s)
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      fetchMock.mockClear();

      // retryDelayRef is now INTERVAL_SLOW=60s — should NOT check at 30s
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      expect(fetchMock).not.toHaveBeenCalled();

      // SHOULD check at 60s total (30s more)
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {});
      expect(fetchMock).toHaveBeenCalledTimes(1);

      nowSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe("wake from sleep (visibilitychange)", () => {
    const simulateHide = () => {
      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: true
      });
      document.dispatchEvent(new Event("visibilitychange"));
    };

    const simulateWake = () => {
      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: false
      });
      document.dispatchEvent(new Event("visibilitychange"));
    };

    afterEach(() => {
      Object.defineProperty(document, "hidden", {
        writable: true,
        configurable: true,
        value: false
      });
    });

    it("stays online when the first post-wake health check fails with a TCP error", async () => {
      const nowSpy = vi.spyOn(performance, "now").mockReturnValue(0);
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(OK_RESPONSE) // initial mount check succeeds
        .mockRejectedValueOnce(new TypeError("Failed to fetch")) // post-wake TCP fail
        .mockResolvedValue(OK_RESPONSE); // subsequent polls
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useNetworkStatus());
      await act(async () => {});
      expect(result.current.isOnline).toBe(true);

      // Simulate browser sleep + wake
      await act(async () => simulateHide());
      await act(async () => simulateWake());
      await act(async () => {});

      // Grace period should have suppressed the goOffline() from the TypeError
      expect(result.current.isOnline).toBe(true);

      nowSpy.mockRestore();
    });

    it("does not double the retry interval when the post-wake check fails", async () => {
      vi.useFakeTimers();
      const nowSpy = vi.spyOn(performance, "now").mockReturnValue(0);
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(OK_RESPONSE) // initial mount check
        .mockRejectedValueOnce(new TypeError("Failed to fetch")) // post-wake fail
        .mockResolvedValue(OK_RESPONSE); // polls
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useNetworkStatus());
      await act(async () => {});

      fetchMock.mockClear();

      await act(async () => simulateHide());
      await act(async () => simulateWake());
      await act(async () => {});

      fetchMock.mockClear();

      // Retry interval should be INTERVAL_FAST (30s), not doubled to 60s.
      // If it had doubled, the next fetch would NOT fire at 30s+1ms.
      await act(async () => {
        vi.advanceTimersByTime(30_001);
      });
      await act(async () => {});
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.current.isOnline).toBe(true);

      nowSpy.mockRestore();
      vi.useRealTimers();
    });

    it("goes offline when navigator.onLine is false during the post-wake check", async () => {
      const nowSpy = vi.spyOn(performance, "now").mockReturnValue(0);
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK_RESPONSE));

      const { result } = renderHook(() => useNetworkStatus());
      await act(async () => {});
      expect(result.current.isOnline).toBe(true);

      await act(async () => simulateHide());

      // OS reports genuinely offline before the wake check runs
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        configurable: true,
        value: false
      });

      await act(async () => simulateWake());
      await act(async () => {});

      // navigator.onLine=false fast-path bypasses the grace and calls goOffline()
      expect(result.current.isOnline).toBe(false);

      nowSpy.mockRestore();
    });

    it("correctly goes offline on a normal polling failure after wake grace clears", async () => {
      vi.useFakeTimers();
      const nowSpy = vi.spyOn(performance, "now").mockReturnValue(0);
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(OK_RESPONSE) // initial mount check
        .mockRejectedValueOnce(new TypeError("Failed to fetch")) // post-wake: grace suppresses
        .mockRejectedValue(new TypeError("Failed to fetch")); // subsequent polls: goes offline
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useNetworkStatus());
      await act(async () => {});

      await act(async () => simulateHide());
      await act(async () => simulateWake());
      await act(async () => {});

      // Grace cleared — still online after the suppressed wake check
      expect(result.current.isOnline).toBe(true);

      // Next scheduled poll (no grace) fails → should go offline now
      await act(async () => {
        vi.advanceTimersByTime(30_001);
      });
      await act(async () => {});
      expect(result.current.isOnline).toBe(false);

      nowSpy.mockRestore();
      vi.useRealTimers();
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

  describe("timeout handling", () => {
    const abortingFetch = vi.fn().mockImplementation(
      (_url: string, { signal }: { signal: AbortSignal }) =>
        new Promise<never>((_, reject) => {
          signal.addEventListener("abort", () =>
            reject(new DOMException("The operation was aborted", "AbortError"))
          );
        })
    );

    it("keeps isOnline true when health check times out (timeout ≠ unreachable)", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", abortingFetch);

      const { result } = renderHook(() => useNetworkStatus());

      // Advance past FETCH_TIMEOUT (5 s) to fire the abort
      await act(async () => {
        vi.advanceTimersByTime(5001);
      });
      await act(async () => {});

      expect(result.current.isOnline).toBe(true);

      vi.useRealTimers();
    });

    it("confirms isSlow immediately on first timeout (without needing confirmation)", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", abortingFetch);

      const { result } = renderHook(() => useNetworkStatus());

      // Single timeout: initial check times out after 5s → isSlow=true immediately
      await act(async () => {
        vi.advanceTimersByTime(5_001);
      });
      await act(async () => {});

      expect(result.current.isSlow).toBe(true);
      expect(result.current.isOnline).toBe(true);

      vi.useRealTimers();
    });
  });
});
