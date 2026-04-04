import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the pocketbase npm package so the module-level `new PocketBase(...)` call
// doesn't error out in the test environment (no real URL available).
vi.mock("pocketbase", () => {
  const PocketBaseMock = function () {
    return {
      authStore: {
        onChange: vi.fn(),
        clear: vi.fn(),
        record: null,
        isValid: false
      },
      collection: vi.fn().mockReturnThis(),
      send: vi.fn(),
      beforeSend: null,
      autoCancellation: vi.fn()
    };
  };
  return { default: PocketBaseMock };
});

import { withRetry } from "./pocketbase";

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Pin Math.random to 1 so jitter is fully deterministic:
    // delay = 1 * min(baseDelay * 2^attempt, maxDelay) = full backoff each time.
    vi.spyOn(Math, "random").mockReturnValue(1);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ─── Success ────────────────────────────────────────────────────────────────

  describe("success", () => {
    it("returns the result immediately when fn succeeds on the first attempt", async () => {
      const fn = vi.fn().mockResolvedValue("ok");
      const result = await withRetry(fn, 3, 100);
      expect(result).toBe("ok");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("returns the result when fn succeeds after an initial transient failure", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 503 })
        .mockResolvedValue("recovered");

      const promise = withRetry(fn, 3, 100);
      await vi.runAllTimersAsync();
      expect(await promise).toBe("recovered");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Transient errors (must retry) ──────────────────────────────────────────

  describe("transient errors — retries up to the retry limit", () => {
    it.each([
      ["network failure (status 0, !isAbort)", { status: 0, isAbort: false }],
      ["request timeout (408)", { status: 408 }],
      ["rate limited (429)", { status: 429 }],
      ["internal server error (500)", { status: 500 }],
      ["bad gateway (502)", { status: 502 }],
      ["service unavailable (503)", { status: 503 }],
      ["gateway timeout (504)", { status: 504 }]
    ])("%s", async (_, error) => {
      const fn = vi.fn().mockRejectedValue(error);

      const promise = withRetry(fn, 3, 100);
      promise.catch(() => {}); // prevent unhandled rejection before our assertion attaches
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toEqual(error);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  // ─── Non-transient errors (must NOT retry) ──────────────────────────────────

  describe("non-transient errors — throws immediately without retrying", () => {
    it.each([
      ["intentional abort (status 0, isAbort)", { status: 0, isAbort: true }],
      ["bad request (400)", { status: 400 }],
      ["unauthorized (401)", { status: 401 }],
      ["forbidden (403)", { status: 403 }],
      ["not found (404)", { status: 404 }],
      ["validation error (422)", { status: 422 }]
    ])("%s", async (_, error) => {
      const fn = vi.fn().mockRejectedValue(error);

      await expect(withRetry(fn, 3, 100)).rejects.toEqual(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Retry count ────────────────────────────────────────────────────────────

  describe("retry count", () => {
    it("respects a custom retries parameter", async () => {
      const fn = vi.fn().mockRejectedValue({ status: 500 });

      const promise = withRetry(fn, 5, 100);
      promise.catch(() => {});
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toBeDefined();
      expect(fn).toHaveBeenCalledTimes(5);
    });

    it("does not retry at all when retries is 1", async () => {
      const fn = vi.fn().mockRejectedValue({ status: 503 });

      const promise = withRetry(fn, 1, 100);
      promise.catch(() => {});
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toBeDefined();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("treats retries <= 0 as a single attempt", async () => {
      const fn = vi.fn().mockRejectedValue({ status: 400 });

      await expect(withRetry(fn, 0, 100)).rejects.toEqual({ status: 400 });
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Delay behaviour ────────────────────────────────────────────────────────

  describe("delay behaviour", () => {
    it("uses exponential backoff — each delay doubles the previous", async () => {
      const delays: number[] = [];
      vi.spyOn(global, "setTimeout").mockImplementation(
        (fn: TimerHandler, delay?: number) => {
          delays.push(delay as number);
          (fn as () => void)();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }
      );

      const fn = vi.fn().mockRejectedValue({ status: 500 });
      const promise = withRetry(fn, 3, 100, 10_000);
      await promise.catch(() => {});

      // 3 attempts, delay only between attempts (not after the last one):
      // attempt 0→1: 100ms, attempt 1→2: 200ms
      expect(delays).toEqual([100, 200]);
    });

    it("caps the delay at maxDelay", async () => {
      const delays: number[] = [];
      vi.spyOn(global, "setTimeout").mockImplementation(
        (fn: TimerHandler, delay?: number) => {
          delays.push(delay as number);
          (fn as () => void)();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }
      );

      // baseDelay=10_000 would exceed maxDelay=500 from attempt 0 onwards
      const fn = vi.fn().mockRejectedValue({ status: 500 });
      const promise = withRetry(fn, 3, 10_000, 500);
      await promise.catch(() => {});

      delays.forEach((d) => expect(d).toBeLessThanOrEqual(500));
    });

    it("applies full jitter — delay is a random fraction of the backoff window", async () => {
      const delays: number[] = [];
      vi.spyOn(global, "setTimeout").mockImplementation(
        (fn: TimerHandler, delay?: number) => {
          delays.push(delay as number);
          (fn as () => void)();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }
      );

      // With Math.random()=0.5 the delay should be half the full backoff
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const fn = vi.fn().mockRejectedValue({ status: 500 });
      const promise = withRetry(fn, 3, 100, 10_000);
      await promise.catch(() => {});

      // 0.5*(100*2^0)=50, 0.5*(100*2^1)=100 — no delay after last attempt
      expect(delays).toEqual([50, 100]);
    });

    it("skips the delay after the final failed attempt", async () => {
      const delays: number[] = [];
      vi.spyOn(global, "setTimeout").mockImplementation(
        (fn: TimerHandler, delay?: number) => {
          delays.push(delay as number);
          (fn as () => void)();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }
      );

      const fn = vi.fn().mockRejectedValue({ status: 500 });
      const promise = withRetry(fn, 3, 100, 10_000);
      await promise.catch(() => {});

      // retries=3 → 3 attempts → 2 inter-attempt delays, NOT 3
      expect(delays).toHaveLength(2);
    });
  });
});
