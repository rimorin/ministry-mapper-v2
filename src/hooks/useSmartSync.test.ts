import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSmartSync, isPermanentError } from "./useSmartSync";
import type { QueuedOp } from "../utils/interface";

vi.mock("../components/middlewares/networkstatuscontext", () => ({
  useNetworkStatusContext: vi.fn()
}));

vi.mock("../utils/smartsync", () => ({
  enqueueOp: vi.fn(),
  getOpTs: vi.fn(),
  getQueue: vi.fn(),
  getAllPendingOps: vi.fn(),
  removeFromQueue: vi.fn(),
  incrementFailCount: vi.fn(),
  generateAddressId: vi.fn().mockReturnValue("client-id-1"),
  markInFlight: vi.fn(),
  clearInFlight: vi.fn(),
  resetAllInFlight: vi.fn()
}));

vi.mock("../utils/addressUpdate", () => ({
  batchUpdateAddress: vi.fn(),
  batchCreateAddress: vi.fn(),
  fetchAddressOptionMap: vi.fn()
}));

const mockGetOne = vi.hoisted(() => vi.fn());

vi.mock("../utils/pocketbase", () => ({
  pb: { collection: () => ({ getOne: mockGetOne }) }
}));

import { useNetworkStatusContext } from "../components/middlewares/networkstatuscontext";
import {
  enqueueOp,
  getOpTs,
  getQueue,
  getAllPendingOps,
  removeFromQueue,
  incrementFailCount,
  markInFlight,
  clearInFlight,
  resetAllInFlight
} from "../utils/smartsync";
import {
  batchUpdateAddress,
  batchCreateAddress,
  fetchAddressOptionMap
} from "../utils/addressUpdate";

const MAX_FAIL_COUNT = 3;

type StoredOp = QueuedOp & { opKey: string; failCount?: number };

const makeOp = (overrides: Partial<StoredOp> = {}): StoredOp => ({
  addressId: "addr-1",
  assignmentId: "map-1",
  congregation: "cong-1",
  updateData: {
    notes: "",
    status: "X",
    not_home_tries: 0,
    dnc_time: "",
    coordinates: "",
    updated_by: "user-1"
  },
  initialOptionIds: [],
  desiredOptionIds: [],
  ts: 1000,
  opKey: "map-1:addr-1",
  ...overrides
});

function setOnline(value: boolean) {
  setNetworkState(value, false);
}

function setNetworkState(isOnline: boolean, isSlow: boolean) {
  vi.mocked(useNetworkStatusContext).mockReturnValue({
    isOnline,
    isSlow,
    lastHealthyAt: 0
  });
}

/** Advance all fake timers and drain every resulting promise chain. */
async function runAllTimers() {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

describe("useSmartSync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setOnline(true);
    vi.mocked(getQueue).mockResolvedValue([]);
    vi.mocked(getAllPendingOps).mockResolvedValue([]);
    vi.mocked(enqueueOp).mockResolvedValue(undefined);
    // Default: stored ts matches snapshot ts (op not superseded) — removeFromQueue proceeds.
    vi.mocked(getOpTs).mockResolvedValue(1000);
    vi.mocked(removeFromQueue).mockResolvedValue(undefined);
    vi.mocked(incrementFailCount).mockResolvedValue(1);
    vi.mocked(markInFlight).mockResolvedValue(1000);
    vi.mocked(clearInFlight).mockResolvedValue(undefined);
    vi.mocked(resetAllInFlight).mockResolvedValue(undefined);
    vi.mocked(batchUpdateAddress).mockResolvedValue(undefined);
    vi.mocked(batchCreateAddress).mockResolvedValue(undefined);
    vi.mocked(fetchAddressOptionMap).mockResolvedValue(new Map());
    // Default: address not found on server (genuine 400 failure scenario).
    mockGetOne.mockRejectedValue({ status: 404 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ── isPermanentError ──────────────────────────────────────────────────────────

  describe("isPermanentError", () => {
    it.each([403, 404, 422])("returns true for HTTP %i", (s) => {
      expect(isPermanentError({ status: s })).toBe(true);
    });
    it.each([500, 429, 503])("returns false for HTTP %i", (s) => {
      expect(isPermanentError({ status: s })).toBe(false);
    });
    it("returns false for a plain Error (no status)", () => {
      expect(isPermanentError(new Error("network"))).toBe(false);
    });
    it("returns false for null", () => {
      expect(isPermanentError(null)).toBe(false);
    });
  });

  // ── Initial state ─────────────────────────────────────────────────────────────

  describe("initial state", () => {
    it("returns zero pending when no assignmentId", () => {
      const { result } = renderHook(() => useSmartSync(undefined));
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.pendingAddressIds.size).toBe(0);
    });

    it("reads pending ops from IDB on mount", async () => {
      vi.mocked(getQueue).mockResolvedValue([
        makeOp({ addressId: "a1", opKey: "map-1:a1" }),
        makeOp({ addressId: "a2", opKey: "map-1:a2" })
      ]);
      const { result } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(result.current.pendingCount).toBe(2);
      expect(result.current.pendingAddressIds.has("a1")).toBe(true);
    });

    it("reflects isOnline from useNetworkStatus", () => {
      setOnline(false);
      const { result } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      expect(result.current.isOnline).toBe(false);
    });

    it("reflects isSlow from useNetworkStatus", () => {
      setNetworkState(true, true);
      const { result } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      expect(result.current.isSlow).toBe(true);
    });
  });

  // ── enqueue ───────────────────────────────────────────────────────────────────

  describe("enqueue", () => {
    it("calls enqueueOp with the op", async () => {
      const { result } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      await act(async () => {
        await result.current.enqueue(makeOp());
      });
      expect(enqueueOp).toHaveBeenCalledWith(
        expect.objectContaining({ addressId: "addr-1" })
      );
    });

    it("refreshes pending count after enqueue", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      const { result } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      await act(async () => {
        await result.current.enqueue(makeOp());
      });
      expect(result.current.pendingCount).toBe(1);
    });
  });

  // ── Flush — guard conditions ──────────────────────────────────────────────────

  describe("flush guard conditions", () => {
    it("does not flush when offline", async () => {
      setOnline(false);
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchUpdateAddress).not.toHaveBeenCalled();
    });

    it("does not flush when slow connection", async () => {
      setNetworkState(true, true);
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchUpdateAddress).not.toHaveBeenCalled();
    });

    it("flushes when slow clears while staying online", async () => {
      setNetworkState(true, true);
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress).mockResolvedValue(undefined);
      const { rerender } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchUpdateAddress).not.toHaveBeenCalled();

      // Connection improves — isSlow clears
      setNetworkState(true, false);
      rerender();
      await runAllTimers();
      expect(batchUpdateAddress).toHaveBeenCalledTimes(1);
    });

    it("does not flush without assignmentId", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      renderHook(() => useSmartSync(undefined));
      await runAllTimers();
      expect(batchUpdateAddress).not.toHaveBeenCalled();
    });

    it("does not flush when queue is empty", async () => {
      vi.mocked(getQueue).mockResolvedValue([]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchUpdateAddress).not.toHaveBeenCalled();
    });

    it("flushes on mm-sse-reconnect when not slow", async () => {
      // First flush drains the initial queue on mount.
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress).mockResolvedValue(undefined);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchUpdateAddress).toHaveBeenCalledTimes(1);

      // A new op arrives and SSE reconnects — flush should fire immediately
      // without waiting for the 30s health-check polling tick.
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      act(() => window.dispatchEvent(new CustomEvent("mm-sse-reconnect")));
      await runAllTimers();
      expect(batchUpdateAddress).toHaveBeenCalledTimes(2);
    });

    it("does not flush on mm-sse-reconnect when slow", async () => {
      setNetworkState(true, true); // slow — flush effect and handler both skip
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();

      act(() => window.dispatchEvent(new CustomEvent("mm-sse-reconnect")));
      await runAllTimers();
      expect(batchUpdateAddress).not.toHaveBeenCalled();
    });

    it("flushes when lastHealthyAt changes while isOnline/isSlow are unchanged (wake scenario)", async () => {
      // Simulate: network was already online+fast (typical state before phone sleep).
      // No state change occurs on wake — only lastHealthyAt is bumped by the health check.
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress).mockResolvedValue(undefined);

      const { rerender } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchUpdateAddress).toHaveBeenCalledTimes(1);

      // Simulate a second health check on wake: same isOnline/isSlow, new lastHealthyAt
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(useNetworkStatusContext).mockReturnValue({
        isOnline: true,
        isSlow: false,
        lastHealthyAt: Date.now() + 30_000
      });
      rerender();
      await runAllTimers();
      expect(batchUpdateAddress).toHaveBeenCalledTimes(2);
    });
  });

  // ── Flush — success path ──────────────────────────────────────────────────────

  describe("flush — success path", () => {
    it("calls batchUpdateAddress once per queued op", async () => {
      vi.mocked(getQueue).mockResolvedValue([
        makeOp({ addressId: "a1", opKey: "map-1:a1" }),
        makeOp({ addressId: "a2", opKey: "map-1:a2" })
      ]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchUpdateAddress).toHaveBeenCalledTimes(2);
    });

    it("skips fetchAddressOptionMap for status-only ops (no option delta)", async () => {
      vi.mocked(getQueue).mockResolvedValue([
        makeOp({ initialOptionIds: ["o1"], desiredOptionIds: ["o1"] })
      ]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(fetchAddressOptionMap).not.toHaveBeenCalled();
    });

    it("calls fetchAddressOptionMap when options changed", async () => {
      vi.mocked(getQueue).mockResolvedValue([
        makeOp({ initialOptionIds: ["o1"], desiredOptionIds: ["o2"] })
      ]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(fetchAddressOptionMap).toHaveBeenCalledWith("addr-1", "map-1");
    });

    it("3-way merge: does not re-add options the server already has", async () => {
      vi.mocked(getQueue).mockResolvedValue([
        makeOp({ initialOptionIds: ["o1"], desiredOptionIds: ["o1", "o2"] })
      ]);
      vi.mocked(fetchAddressOptionMap).mockResolvedValue(
        new Map([
          ["o1", "ao1"],
          ["o2", "ao2"]
        ])
      );
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchUpdateAddress).toHaveBeenCalledWith(
        expect.objectContaining({ toAddOptionIds: [] })
      );
    });

    it("3-way merge: does not delete options the server already removed", async () => {
      vi.mocked(getQueue).mockResolvedValue([
        makeOp({ initialOptionIds: ["o1", "o2"], desiredOptionIds: ["o1"] })
      ]);
      vi.mocked(fetchAddressOptionMap).mockResolvedValue(
        new Map([["o1", "ao1"]]) // server no longer has o2
      );
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchUpdateAddress).toHaveBeenCalledWith(
        expect.objectContaining({ toDeleteAoIds: [] })
      );
    });

    it("calls removeFromQueue with the opKey after success", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(removeFromQueue).toHaveBeenCalledWith("map-1:addr-1");
    });

    it("dispatches mm-flush-complete after a successful op", async () => {
      const listener = vi.fn();
      window.addEventListener("mm-flush-complete", listener);
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(listener).toHaveBeenCalled();
      window.removeEventListener("mm-flush-complete", listener);
    });

    it("clears pendingAddressIds for the flushed address after success", async () => {
      vi.mocked(getQueue)
        .mockResolvedValueOnce([makeOp()]) // flushQueue snapshot
        .mockResolvedValueOnce([makeOp()]) // mount refreshCount
        .mockResolvedValue([]); // finally refreshCount — queue now empty

      const { result } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(result.current.pendingAddressIds.has("addr-1")).toBe(false);
      expect(result.current.pendingCount).toBe(0);
    });
  });

  // ── Flush — create op success path ───────────────────────────────────────────

  describe("flush — create op success path", () => {
    const makeCreateOp = (overrides: Parameters<typeof makeOp>[0] = {}) =>
      makeOp({
        kind: "create",
        addressId: "new-addr",
        opKey: "map-1:new-addr",
        createPayload: {
          map: "map-1",
          territory: "territory-1",
          code: "101",
          floor: 1,
          sequence: 1,
          congregation: "cong-1",
          created_by: "user-1",
          source: ""
        },
        ...overrides
      });

    it("calls batchCreateAddress (not batchUpdateAddress) for a create op", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeCreateOp()]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchCreateAddress).toHaveBeenCalledTimes(1);
      expect(batchUpdateAddress).not.toHaveBeenCalled();
    });

    it("calls batchCreateAddress with the correct payload", async () => {
      vi.mocked(getQueue).mockResolvedValue([
        makeCreateOp({ desiredOptionIds: ["opt-1"] })
      ]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchCreateAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          addressId: "new-addr",
          mapId: "map-1",
          optionIds: ["opt-1"]
        })
      );
    });

    it("removes create op from queue and dispatches mm-flush-complete on success", async () => {
      const listener = vi.fn();
      window.addEventListener("mm-flush-complete", listener);
      vi.mocked(getQueue).mockResolvedValue([makeCreateOp()]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(removeFromQueue).toHaveBeenCalledWith("map-1:new-addr");
      expect(listener).toHaveBeenCalled();
      window.removeEventListener("mm-flush-complete", listener);
    });

    it("keeps create op queued when op was superseded mid-flush (ts changed)", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeCreateOp({ ts: 1000 })]);
      // Snapshot ts captured at markInFlight time = 1000
      vi.mocked(markInFlight).mockResolvedValueOnce(1000);
      // User edited the op while batchCreateAddress was in-flight → stored ts changed
      vi.mocked(getOpTs).mockResolvedValueOnce(2000);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchCreateAddress).toHaveBeenCalledTimes(1);
      expect(removeFromQueue).not.toHaveBeenCalled();
    });
  });

  // ── Flush — permanent error ───────────────────────────────────────────────────

  describe("flush — permanent error (403/404/422)", () => {
    it("calls incrementFailCount on a permanent error", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress).mockRejectedValueOnce({ status: 404 });
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(incrementFailCount).toHaveBeenCalledWith("map-1:addr-1");
    });

    it("discards op and dispatches mm-op-discarded at MAX_FAIL_COUNT", async () => {
      const listener = vi.fn();
      window.addEventListener("mm-op-discarded", listener);
      vi.mocked(incrementFailCount).mockResolvedValue(MAX_FAIL_COUNT);
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress).mockRejectedValueOnce({ status: 422 });
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(removeFromQueue).toHaveBeenCalledWith("map-1:addr-1");
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { count: 1 } })
      );
      window.removeEventListener("mm-op-discarded", listener);
    });

    it("counts against fail budget when create op returns 400 and address does not exist", async () => {
      const createOp = makeOp({
        kind: "create",
        createPayload: {
          map: "map-1",
          territory: "territory-1",
          code: "101",
          floor: 1,
          sequence: 1,
          congregation: "cong-1",
          created_by: "user-1",
          source: ""
        }
      });
      vi.mocked(getQueue).mockResolvedValue([createOp]);
      vi.mocked(batchCreateAddress).mockRejectedValueOnce({ status: 400 });
      // Address not found — genuine failure, count the strike (default: 404).
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(incrementFailCount).toHaveBeenCalledWith("map-1:addr-1");
    });

    it("treats create 400 as success when address already exists (crash-retry duplicate)", async () => {
      const createOp = makeOp({
        kind: "create",
        createPayload: {
          map: "map-1",
          territory: "territory-1",
          code: "101",
          floor: 1,
          sequence: 1,
          congregation: "cong-1",
          created_by: "user-1",
          source: ""
        }
      });
      vi.mocked(getQueue).mockResolvedValue([createOp]);
      vi.mocked(batchCreateAddress).mockRejectedValueOnce({ status: 400 });
      // Address exists — crash-retry scenario, treat as already flushed.
      mockGetOne.mockResolvedValueOnce({ id: "addr-1" });
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(incrementFailCount).not.toHaveBeenCalled();
      expect(removeFromQueue).toHaveBeenCalledWith("map-1:addr-1");
    });

    it("treats create 400 as transient when existence check fails due to network error", async () => {
      const createOp = makeOp({
        kind: "create",
        createPayload: {
          map: "map-1",
          territory: "territory-1",
          code: "101",
          floor: 1,
          sequence: 1,
          congregation: "cong-1",
          created_by: "user-1",
          source: ""
        }
      });
      // Return op only on the first flush; subsequent retry flushes see empty queue.
      vi.mocked(getQueue)
        .mockResolvedValueOnce([createOp])
        .mockResolvedValue([]);
      vi.mocked(batchCreateAddress).mockRejectedValueOnce({ status: 400 });
      // getOne throws non-404 (network down) — treat as transient, keep op queued.
      mockGetOne.mockRejectedValueOnce(new Error("network"));
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(incrementFailCount).not.toHaveBeenCalled();
      expect(removeFromQueue).not.toHaveBeenCalled();
    });
  });

  // ── Flush — 401 auth expired ──────────────────────────────────────────────────

  describe("flush — 401 auth expired", () => {
    it("keeps the op in queue (does not call removeFromQueue) on 401", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress).mockRejectedValueOnce({ status: 401 });
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(incrementFailCount).not.toHaveBeenCalled();
      expect(removeFromQueue).not.toHaveBeenCalled();
    });

    it("dispatches mm-auth-expired exactly once even with multiple queued ops", async () => {
      const listener = vi.fn();
      window.addEventListener("mm-auth-expired", listener);
      vi.mocked(getQueue).mockResolvedValue([
        makeOp({ addressId: "a1", opKey: "map-1:a1" }),
        makeOp({ addressId: "a2", opKey: "map-1:a2" })
      ]);
      // Both ops would fail with 401, but we break after the first
      vi.mocked(batchUpdateAddress).mockRejectedValue({ status: 401 });
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(listener).toHaveBeenCalledTimes(1);
      // Second op was never attempted — break after first 401
      expect(batchUpdateAddress).toHaveBeenCalledTimes(1);
      window.removeEventListener("mm-auth-expired", listener);
    });

    it("does not schedule a retry on 401", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress).mockRejectedValueOnce({ status: 401 });
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      // batchUpdateAddress is called only once — no retry attempt
      expect(batchUpdateAddress).toHaveBeenCalledTimes(1);
    });
  });

  // ── Flush — transient error ───────────────────────────────────────────────────

  describe("flush — transient error (network / 5xx)", () => {
    it("does not call incrementFailCount for a transient error", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress).mockRejectedValueOnce(new Error("network"));
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(incrementFailCount).not.toHaveBeenCalled();
    });

    it("retries after a backoff delay on transient failure", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress)
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValueOnce(undefined);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchUpdateAddress).toHaveBeenCalledTimes(2);
    });

    it("schedules a retry when getQueue fails (IDB unavailable)", async () => {
      // flushQueue's getQueue throws (call 1) → hadTransientFailures → retry timer.
      // mount refreshCount + flush finally refreshCount consume calls 2-3.
      // Retry flush (call 4) succeeds and processes the op.
      vi.mocked(getQueue)
        .mockRejectedValueOnce(new Error("IDB terminated")) // call 1: flush snapshot
        .mockResolvedValueOnce([]) // call 2: mount refreshCount
        .mockResolvedValueOnce([]) // call 3: flush finally refreshCount
        .mockResolvedValueOnce([makeOp()]) // call 4: retry flush snapshot
        .mockResolvedValue([]);
      vi.mocked(batchUpdateAddress).mockResolvedValue(undefined);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(batchUpdateAddress).toHaveBeenCalledTimes(1);
    });
  });

  // ── RC4: drain ops enqueued during flush ─────────────────────────────────────

  describe("follow-up flush for ops enqueued during active flush", () => {
    it("schedules another flush when enqueue is called during an active flush", async () => {
      // a1 is queued initially; a2 is enqueued mid-flush inside batchUpdateAddress
      vi.mocked(getQueue)
        .mockResolvedValueOnce([makeOp({ addressId: "a1", opKey: "map-1:a1" })]) // mount refreshCount
        .mockResolvedValueOnce([makeOp({ addressId: "a1", opKey: "map-1:a1" })]) // flushQueue snapshot
        .mockResolvedValueOnce([makeOp({ addressId: "a2", opKey: "map-1:a2" })]) // enqueue's refreshCount
        .mockResolvedValueOnce([makeOp({ addressId: "a2", opKey: "map-1:a2" })]) // finally refreshCount
        .mockResolvedValueOnce([makeOp({ addressId: "a2", opKey: "map-1:a2" })]) // second flush snapshot
        .mockResolvedValue([]); // all subsequent refreshCounts

      let capturedEnqueue: ((op: QueuedOp) => Promise<void>) | undefined =
        undefined;
      vi.mocked(batchUpdateAddress).mockImplementation(async () => {
        // Call enqueue while isFlushing is true — this is the RC4 scenario
        if (capturedEnqueue) {
          await capturedEnqueue(makeOp({ addressId: "a2", opKey: "map-1:a2" }));
        }
      });

      const { result } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      capturedEnqueue = result.current.enqueue;
      await runAllTimers();

      // Both a1 (first flush) and a2 (follow-up flush) should be processed
      expect(batchUpdateAddress).toHaveBeenCalledTimes(2);
    });

    it("does not schedule a follow-up flush when no ops were enqueued mid-flush", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress).mockResolvedValue(undefined);

      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();

      // Only one flush — no concurrent enqueue was observed
      expect(batchUpdateAddress).toHaveBeenCalledTimes(1);
    });
  });

  // ── scope change ─────────────────────────────────────────────────────────────

  describe("scope change", () => {
    it("resets pending state when scope changes", async () => {
      // Persistent mock so flush+finally both return the op — pendingCount stays 1.
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      const { result, rerender } = renderHook(
        ({ id }: { id: string | undefined }) =>
          useSmartSync(id ? { mapId: id } : undefined),
        { initialProps: { id: "map-1" as string | undefined } }
      );
      await runAllTimers();
      expect(result.current.pendingCount).toBe(1);

      vi.mocked(getQueue).mockResolvedValue([]);
      rerender({ id: "map-2" });
      await act(async () => {});
      expect(result.current.pendingCount).toBe(0);
    });
  });

  // ── Unmount cleanup ───────────────────────────────────────────────────────────

  describe("unmount cleanup", () => {
    it("clears the retry timer on unmount", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress).mockRejectedValueOnce(
        new TypeError("network")
      );
      const spy = vi.spyOn(globalThis, "clearTimeout");
      const { unmount } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      await act(async () => {}); // flush runs, fails transiently → retry timer set
      unmount();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("does not dispatch window events after unmount mid-flush", async () => {
      const flushListener = vi.fn();
      window.addEventListener("mm-flush-complete", flushListener);

      // Pause batchUpdateAddress so flushQueue is still running when we unmount
      let resolveBatch!: () => void;
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress).mockReturnValue(
        new Promise<void>((resolve) => {
          resolveBatch = resolve;
        })
      );

      const { unmount } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Unmount while flush is in progress
      unmount();

      // Now let batchUpdateAddress resolve and the finally block run
      await act(async () => {
        resolveBatch();
        await vi.runAllTimersAsync();
      });

      // mm-flush-complete must NOT fire after unmount
      expect(flushListener).not.toHaveBeenCalled();
      window.removeEventListener("mm-flush-complete", flushListener);
    });

    it("schedules a flush immediately when an op is enqueued while idle and online", async () => {
      vi.mocked(getQueue).mockResolvedValue([]);
      const { result } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      await act(async () => {});

      vi.mocked(enqueueOp).mockResolvedValue(undefined);
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);

      await act(async () => {
        await result.current.enqueue(makeOp());
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(batchUpdateAddress).toHaveBeenCalled();
    });
  });

  describe("local-first writes", () => {
    const writeUpdateParams = {
      addressId: "addr-1",
      mapId: "map-1",
      congregation: "cong-1",
      updateData: makeOp().updateData,
      initialTypes: [],
      desiredTypes: []
    };
    const writeCreateParams = {
      mapId: "map-1",
      congregation: "cong-1",
      createPayload: {
        map: "map-1",
        territory: "territory-1",
        code: "101",
        floor: 1,
        sequence: 1,
        congregation: "cong-1",
        created_by: "user-1",
        source: ""
      },
      updateData: makeOp().updateData,
      desiredTypes: []
    };

    it("writeUpdate always enqueues and calls onOptimistic regardless of network state", async () => {
      setOnline(false);
      const onOptimistic = vi.fn();
      const { result } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      await act(async () => {
        await result.current.writeUpdate({
          ...writeUpdateParams,
          onOptimistic
        });
      });
      expect(enqueueOp).toHaveBeenCalled();
      expect(onOptimistic).toHaveBeenCalled();
      expect(batchUpdateAddress).not.toHaveBeenCalled();
    });

    it("writeUpdate enqueues even when online and fast", async () => {
      const { result } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      await act(async () => {
        await result.current.writeUpdate(writeUpdateParams);
      });
      expect(enqueueOp).toHaveBeenCalled();
      expect(batchUpdateAddress).not.toHaveBeenCalled();
    });

    it("writeCreate always enqueues and calls onOptimistic regardless of network state", async () => {
      setOnline(false);
      const onOptimistic = vi.fn();
      const { result } = renderHook(() => useSmartSync({ mapId: "map-1" }));
      await act(async () => {
        await result.current.writeCreate({
          ...writeCreateParams,
          onOptimistic
        });
      });
      expect(enqueueOp).toHaveBeenCalled();
      expect(onOptimistic).toHaveBeenCalled();
      expect(batchCreateAddress).not.toHaveBeenCalled();
    });
  });

  // ── Direct mode (admin — no assignmentId) ─────────────────────────────────────

  describe("direct mode (assignmentId undefined)", () => {
    const writeUpdateParams = {
      addressId: "addr-1",
      mapId: "map-1",
      congregation: "cong-1",
      updateData: makeOp().updateData,
      initialTypes: [],
      desiredTypes: []
    };
    const writeCreateParams = {
      mapId: "map-1",
      congregation: "cong-1",
      createPayload: {
        map: "map-1",
        territory: "territory-1",
        code: "101",
        floor: 1,
        sequence: 1,
        congregation: "cong-1",
        created_by: "user-1",
        source: ""
      },
      updateData: makeOp().updateData,
      desiredTypes: []
    };

    it("writeUpdate calls batchUpdateAddress directly and does not enqueue", async () => {
      const { result } = renderHook(() => useSmartSync(undefined));
      await act(async () => {
        await result.current.writeUpdate(writeUpdateParams);
      });
      expect(batchUpdateAddress).toHaveBeenCalledTimes(1);
      expect(enqueueOp).not.toHaveBeenCalled();
    });

    it("writeUpdate does not call onOptimistic in direct mode", async () => {
      const onOptimistic = vi.fn();
      const { result } = renderHook(() => useSmartSync(undefined));
      await act(async () => {
        await result.current.writeUpdate({
          ...writeUpdateParams,
          onOptimistic
        });
      });
      expect(onOptimistic).not.toHaveBeenCalled();
    });

    it("writeUpdate dispatches mm-flush-complete after a direct write", async () => {
      const listener = vi.fn();
      window.addEventListener("mm-flush-complete", listener);
      const { result } = renderHook(() => useSmartSync(undefined));
      await act(async () => {
        await result.current.writeUpdate(writeUpdateParams);
      });
      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener("mm-flush-complete", listener);
    });

    it("writeUpdate propagates server errors to the caller in direct mode", async () => {
      vi.mocked(batchUpdateAddress).mockRejectedValueOnce({ status: 422 });
      const { result } = renderHook(() => useSmartSync(undefined));
      await expect(
        act(async () => {
          await result.current.writeUpdate(writeUpdateParams);
        })
      ).rejects.toMatchObject({ status: 422 });
      expect(enqueueOp).not.toHaveBeenCalled();
    });

    it("writeCreate calls batchCreateAddress directly and does not enqueue", async () => {
      const { result } = renderHook(() => useSmartSync(undefined));
      await act(async () => {
        await result.current.writeCreate(writeCreateParams);
      });
      expect(batchCreateAddress).toHaveBeenCalledTimes(1);
      expect(enqueueOp).not.toHaveBeenCalled();
    });

    it("writeCreate does not call onOptimistic in direct mode", async () => {
      const onOptimistic = vi.fn();
      const { result } = renderHook(() => useSmartSync(undefined));
      await act(async () => {
        await result.current.writeCreate({
          ...writeCreateParams,
          onOptimistic
        });
      });
      expect(onOptimistic).not.toHaveBeenCalled();
    });

    it("writeCreate dispatches mm-flush-complete after a direct write", async () => {
      const listener = vi.fn();
      window.addEventListener("mm-flush-complete", listener);
      const { result } = renderHook(() => useSmartSync(undefined));
      await act(async () => {
        await result.current.writeCreate(writeCreateParams);
      });
      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener("mm-flush-complete", listener);
    });

    it("writeCreate propagates server errors to the caller in direct mode", async () => {
      vi.mocked(batchCreateAddress).mockRejectedValueOnce({ status: 500 });
      const { result } = renderHook(() => useSmartSync(undefined));
      await expect(
        act(async () => {
          await result.current.writeCreate(writeCreateParams);
        })
      ).rejects.toMatchObject({ status: 500 });
      expect(enqueueOp).not.toHaveBeenCalled();
    });
  });

  describe("IN_FLIGHT state", () => {
    it("resets all in-flight ops on mount", async () => {
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await act(async () => {});
      expect(resetAllInFlight).toHaveBeenCalled();
    });

    it("marks op in-flight before the server write", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(markInFlight).toHaveBeenCalledWith("map-1:addr-1");
    });

    it("clears in-flight marker when a server write fails transiently", async () => {
      vi.mocked(getQueue).mockResolvedValue([makeOp()]);
      vi.mocked(batchUpdateAddress)
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValue(undefined);
      renderHook(() => useSmartSync({ mapId: "map-1" }));
      await runAllTimers();
      expect(clearInFlight).toHaveBeenCalledWith("map-1:addr-1");
    });
  });

  // ── Congregation scope (admin) ────────────────────────────────────────────────

  describe("congregation scope (admin)", () => {
    it("calls getAllPendingOps (not getQueue) for pending count on mount", async () => {
      vi.mocked(getAllPendingOps).mockResolvedValue([
        makeOp({ addressId: "a1", opKey: "mapA:a1", assignmentId: "mapA" }),
        makeOp({ addressId: "b1", opKey: "mapB:b1", assignmentId: "mapB" })
      ]);
      const { result } = renderHook(() =>
        useSmartSync({ congregationId: "cong-1" })
      );
      await runAllTimers();
      expect(getAllPendingOps).toHaveBeenCalled();
      expect(getQueue).not.toHaveBeenCalled();
      expect(result.current.pendingCount).toBe(2);
      expect(result.current.pendingAddressIds.has("a1")).toBe(true);
      expect(result.current.pendingAddressIds.has("b1")).toBe(true);
    });

    it("flushes ops from multiple maps in one pass via getAllPendingOps", async () => {
      const opA = makeOp({
        addressId: "a1",
        opKey: "mapA:a1",
        assignmentId: "mapA"
      });
      const opB = makeOp({
        addressId: "b1",
        opKey: "mapB:b1",
        assignmentId: "mapB"
      });
      vi.mocked(getAllPendingOps).mockResolvedValue([opA, opB]);
      renderHook(() => useSmartSync({ congregationId: "cong-1" }));
      await runAllTimers();
      expect(getQueue).not.toHaveBeenCalled();
      expect(batchUpdateAddress).toHaveBeenCalledTimes(2);
      expect(batchUpdateAddress).toHaveBeenCalledWith(
        expect.objectContaining({ mapId: "mapA" })
      );
      expect(batchUpdateAddress).toHaveBeenCalledWith(
        expect.objectContaining({ mapId: "mapB" })
      );
    });

    it("writeUpdate enqueues and calls onOptimistic — does not write directly", async () => {
      setOnline(false);
      const onOptimistic = vi.fn();
      const { result } = renderHook(() =>
        useSmartSync({ congregationId: "cong-1" })
      );
      await act(async () => {
        await result.current.writeUpdate({
          addressId: "addr-1",
          mapId: "map-1",
          congregation: "cong-1",
          updateData: makeOp().updateData,
          initialTypes: [],
          desiredTypes: [],
          onOptimistic
        });
      });
      expect(enqueueOp).toHaveBeenCalled();
      expect(onOptimistic).toHaveBeenCalled();
      expect(batchUpdateAddress).not.toHaveBeenCalled();
    });

    it("writeCreate enqueues and calls onOptimistic — does not write directly", async () => {
      setOnline(false);
      const onOptimistic = vi.fn();
      const { result } = renderHook(() =>
        useSmartSync({ congregationId: "cong-1" })
      );
      await act(async () => {
        await result.current.writeCreate({
          mapId: "map-1",
          congregation: "cong-1",
          createPayload: {
            map: "map-1",
            territory: "territory-1",
            code: "101",
            floor: 1,
            sequence: 1,
            congregation: "cong-1",
            created_by: "user-1",
            source: ""
          },
          updateData: makeOp().updateData,
          desiredTypes: [],
          onOptimistic
        });
      });
      expect(enqueueOp).toHaveBeenCalled();
      expect(onOptimistic).toHaveBeenCalledWith(expect.any(String));
      expect(batchCreateAddress).not.toHaveBeenCalled();
    });

    it("resets pending state when congregationId changes", async () => {
      vi.mocked(getAllPendingOps).mockResolvedValue([
        makeOp({ addressId: "a1", opKey: "mapA:a1", assignmentId: "mapA" })
      ]);
      const { result, rerender } = renderHook(
        ({ id }: { id: string }) => useSmartSync({ congregationId: id }),
        { initialProps: { id: "cong-1" } }
      );
      await runAllTimers();
      expect(result.current.pendingCount).toBe(1);

      vi.mocked(getAllPendingOps).mockResolvedValue([]);
      rerender({ id: "cong-2" });
      await act(async () => {});
      expect(result.current.pendingCount).toBe(0);
    });

    it("filters getAllPendingOps by congregationId — ops from other congregations are excluded", async () => {
      vi.mocked(getAllPendingOps).mockResolvedValue([
        makeOp({
          addressId: "a1",
          opKey: "mapA:a1",
          assignmentId: "mapA",
          congregation: "cong-1"
        }),
        makeOp({
          addressId: "b1",
          opKey: "mapB:b1",
          assignmentId: "mapB",
          congregation: "cong-2"
        })
      ]);
      const { result } = renderHook(() =>
        useSmartSync({ congregationId: "cong-1" })
      );
      await runAllTimers();
      // Only the op belonging to cong-1 should be counted
      expect(result.current.pendingCount).toBe(1);
      expect(result.current.pendingAddressIds.has("a1")).toBe(true);
      expect(result.current.pendingAddressIds.has("b1")).toBe(false);
      // Flush should only attempt the cong-1 op
      expect(batchUpdateAddress).toHaveBeenCalledTimes(1);
      expect(batchUpdateAddress).toHaveBeenCalledWith(
        expect.objectContaining({ mapId: "mapA" })
      );
    });
  });
});
