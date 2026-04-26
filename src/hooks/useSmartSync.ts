import {
  useContext,
  createContext,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { useNetworkStatusContext } from "../components/middlewares/networkstatuscontext";
import {
  enqueueOp,
  generateAddressId,
  getOpTs,
  getQueue,
  getAllPendingOps,
  markInFlight,
  clearInFlight,
  resetAllInFlight,
  removeFromQueue,
  incrementFailCount
} from "../utils/smartsync";
import {
  fetchAddressOptionMap,
  batchUpdateAddress,
  batchCreateAddress
} from "../utils/addressUpdate";
import { pb } from "../utils/pocketbase";
import type {
  QueuedOp,
  WriteUpdateParams,
  WriteCreateParams
} from "../utils/interface";

const MAX_FAIL_COUNT = 3;
const RETRY_BASE_MS = 15_000;
const RETRY_MAX_MS = 300_000;
// Only show the pending indicator after this delay. Prevents a brief flash on
// fast networks where enqueue→flush completes before the timer fires.
const INDICATOR_SHOW_DELAY_MS = 300;

// Exponential backoff with uniform jitter: base doubles each attempt, capped
// at RETRY_MAX_MS, plus 0–RETRY_BASE_MS of random spread so 600+ users
// reconnecting simultaneously don't all retry at the exact same moment.
function getRetryDelay(retryCount: number): number {
  const base = Math.min(RETRY_BASE_MS * 2 ** retryCount, RETRY_MAX_MS);
  return base + Math.random() * RETRY_BASE_MS;
}

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const { status } = error as { status: unknown };
    return typeof status === "number" ? status : undefined;
  }
}

/**
 * Returns true for permanent server rejections that indicate the op can never
 * succeed (auth failure, deleted record, permission change, validation failure).
 * Transient errors (network, 5xx, 429, timeout) return false — op stays queued.
 */
export function isPermanentError(error: unknown): boolean {
  const s = getErrorStatus(error);
  return s === 403 || s === 404 || s === 422;
}

function is401Error(error: unknown): boolean {
  return getErrorStatus(error) === 401;
}

/**
 * Computes the toDeleteAoIds / toAddOptionIds pair needed by batchUpdateAddress.
 * Fetches server state only when the desired option set has actually changed,
 * avoiding a round-trip for updates that only modify text fields.
 */
async function resolveOptionChanges(
  initialOptionIds: string[],
  desiredOptionIds: string[],
  addressId: string,
  mapId: string
): Promise<{ toDeleteAoIds: string[]; toAddOptionIds: string[] }> {
  const initialSet = new Set(initialOptionIds);
  const desiredSet = new Set(desiredOptionIds);
  const userRemoved = initialOptionIds.filter((id) => !desiredSet.has(id));
  const userAdded = desiredOptionIds.filter((id) => !initialSet.has(id));
  if (userRemoved.length === 0 && userAdded.length === 0) {
    return { toDeleteAoIds: [], toAddOptionIds: [] };
  }
  const serverOptionMap = await fetchAddressOptionMap(addressId, mapId);
  return {
    toDeleteAoIds: userRemoved
      .map((id) => serverOptionMap.get(id))
      .filter(Boolean) as string[],
    toAddOptionIds: userAdded.filter((id) => !serverOptionMap.has(id))
  };
}

export type SmartSyncScope = { mapId: string } | { congregationId: string };

export interface UseSmartSyncResult {
  isOnline: boolean;
  isSlow: boolean;
  pendingCount: number;
  pendingAddressIds: Set<string>;
  // Debounced — only non-zero/non-empty after INDICATOR_SHOW_DELAY_MS of continuous pending state.
  // Use these for visual indicators; use the raw versions above for SSE guards.
  displayPendingCount: number;
  displayPendingAddressIds: Set<string>;
  enqueue: (op: QueuedOp) => Promise<void>;
  writeUpdate: (params: WriteUpdateParams) => Promise<void>;
  writeCreate: (params: WriteCreateParams) => Promise<void>;
}

export function useSmartSync(scope?: SmartSyncScope): UseSmartSyncResult {
  // Stable string extracted from scope — safe to use as effect dep without
  // triggering re-runs when the caller passes a new object with the same value.
  const scopeId = scope
    ? "mapId" in scope
      ? scope.mapId
      : scope.congregationId
    : undefined;

  const { isOnline, isSlow, lastHealthyAt } = useNetworkStatusContext();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingAddressIds, setPendingAddressIds] = useState<Set<string>>(
    new Set()
  );
  const [displayPendingCount, setDisplayPendingCount] = useState(0);
  const [displayPendingAddressIds, setDisplayPendingAddressIds] = useState<
    Set<string>
  >(new Set());
  // Refs capturing the latest pending state for the indicator timer callback.
  const pendingCountDisplayRef = useRef(0);
  const pendingAddressIdsDisplayRef = useRef<Set<string>>(new Set());
  const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True while the indicator is currently visible — lets us update it
  // immediately rather than re-running the delay on every count change.
  const indicatorVisibleRef = useRef(false);

  const isFlushing = useRef(false);
  const retryCountRef = useRef(0);
  // Set to true when enqueue() is called while a flush is in progress.
  // flushQueue resets it at the start of each run and schedules a follow-up
  // pass in finally if it was set — draining ops that arrived mid-flush.
  const enqueuedDuringFlushRef = useRef(false);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  // Stable ref to latest flushQueue — lets effects and callbacks always call
  // the current closure without capturing a stale one.
  const flushQueueRef = useRef<() => Promise<void>>(async () => {});
  // Refs for values needed inside async callbacks. Assigned during render so
  // async reads (event handlers, timers) always see the latest value without
  // an extra effect scheduling round-trip.
  const isOnlineRef = useRef(isOnline);
  const isSlowRef = useRef(isSlow);
  const scopeIdRef = useRef(scopeId);
  isOnlineRef.current = isOnline;
  isSlowRef.current = isSlow;
  scopeIdRef.current = scopeId;

  // refreshCount is self-resilient: IDB errors are swallowed so callers (enqueue,
  // flushQueue.finally, scope effect) never need their own try-catch.
  // If IDB is unavailable we preserve last-known state rather than lying to the UI.
  const refreshCount = async () => {
    if (!scope) return;
    const capturedScopeId = scopeId;
    try {
      const ops =
        "mapId" in scope
          ? await getQueue(scope.mapId)
          : (await getAllPendingOps()).filter(
              (op) => op.congregation === scope.congregationId
            );
      // Discard stale result if scope changed while the IDB read was in flight.
      if (capturedScopeId !== scopeIdRef.current) return;
      setPendingCount(ops.length);
      setPendingAddressIds(new Set(ops.map((o) => o.addressId)));
    } catch {
      // IDB unavailable — preserve last-known state; do not clear indicators.
    }
  };

  const enqueue = async (op: QueuedOp) => {
    await enqueueOp(op);
    // Signal that a new op arrived — if a flush is running right now it won't
    // see this op in its snapshot, so the finally block will schedule another pass.
    if (isFlushing.current) enqueuedDuringFlushRef.current = true;
    await refreshCount();
    if (!isFlushing.current && isOnlineRef.current && !isSlowRef.current)
      void flushQueueRef.current();
  };

  // Debounce the visual indicator: show only if ops are still pending after
  // INDICATOR_SHOW_DELAY_MS. Hide immediately when the queue empties so the
  // indicator doesn't linger after a successful flush.
  useEffect(() => {
    pendingCountDisplayRef.current = pendingCount;
    pendingAddressIdsDisplayRef.current = pendingAddressIds;

    if (pendingCount === 0) {
      if (indicatorTimerRef.current) {
        clearTimeout(indicatorTimerRef.current);
        indicatorTimerRef.current = null;
      }
      // Only update state if the indicator was actually showing — skips
      // re-renders entirely on fast networks where the flush beat the timer.
      if (indicatorVisibleRef.current) {
        indicatorVisibleRef.current = false;
        setDisplayPendingCount(0);
        setDisplayPendingAddressIds(new Set());
      }
      return;
    }

    if (indicatorVisibleRef.current) {
      setDisplayPendingCount(pendingCount);
      setDisplayPendingAddressIds(pendingAddressIds);
      return;
    }

    // Not yet showing — start the delay timer (only once per "quiet→busy" edge).
    if (!indicatorTimerRef.current) {
      indicatorTimerRef.current = setTimeout(() => {
        indicatorTimerRef.current = null;
        indicatorVisibleRef.current = true;
        setDisplayPendingCount(pendingCountDisplayRef.current);
        setDisplayPendingAddressIds(pendingAddressIdsDisplayRef.current);
      }, INDICATOR_SHOW_DELAY_MS);
    }
  }, [pendingCount, pendingAddressIds]);

  const flushQueue = async () => {
    if (!scope || isFlushing.current) return;
    if (!isOnlineRef.current || isSlowRef.current) return;

    const runFlush = async () => {
      isFlushing.current = true;
      enqueuedDuringFlushRef.current = false;
      let flushedCount = 0;
      let discardedCount = 0;
      let hadTransientFailures = false;
      // Set on first 401 — stops the loop and keeps all ops queued for retry
      // after the user re-authenticates. Dispatched as a single event after the
      // loop so the UI can prompt the user once, not once per pending op.
      let authExpired = false;
      try {
        // Guard IDB read — if the read fails (storage pressure, terminated
        // connection) treat it as transient so the 15s retry fires.
        let ops: Awaited<ReturnType<typeof getQueue>>;
        try {
          ops =
            "mapId" in scope
              ? await getQueue(scope.mapId)
              : (await getAllPendingOps()).filter(
                  (op) => op.congregation === scope.congregationId
                );
        } catch {
          hadTransientFailures = true;
          ops = [];
        }
        for (const op of ops) {
          if (authExpired) break;
          try {
            if (op.kind === "create" && op.createPayload) {
              const snapshotTs = await markInFlight(op.opKey);
              await batchCreateAddress({
                addressId: op.addressId,
                mapId: op.assignmentId,
                congregation: op.congregation,
                createPayload: op.createPayload,
                updateData: op.updateData,
                optionIds: op.desiredOptionIds
              });
              // Guard against mid-flush edit — same pattern as the update path below.
              let storedTs: number | undefined;
              try {
                storedTs = await getOpTs(op.opKey);
              } catch {
                storedTs = snapshotTs;
              }
              if (storedTs === undefined || storedTs === snapshotTs) {
                await removeFromQueue(op.opKey);
              }
              flushedCount++;
              continue;
            }

            const { toDeleteAoIds, toAddOptionIds } =
              await resolveOptionChanges(
                op.initialOptionIds,
                op.desiredOptionIds,
                op.addressId,
                op.assignmentId
              );

            const snapshotTs = await markInFlight(op.opKey);
            await batchUpdateAddress({
              addressId: op.addressId,
              mapId: op.assignmentId,
              congregation: op.congregation,
              updateData: op.updateData,
              toDeleteAoIds,
              toAddOptionIds
            });
            // Guard against mid-flush upsert: if the user edited this address
            // while batchUpdateAddress was in-flight, the IDB record now has a
            // newer ts. Skip the delete so the drain pass sends the updated op
            // instead of silently dropping it.
            let storedTs: number | undefined;
            try {
              storedTs = await getOpTs(op.opKey);
            } catch {
              storedTs = snapshotTs;
            }
            if (storedTs === undefined || storedTs === snapshotTs) {
              await removeFromQueue(op.opKey);
            }
            // Count the server write regardless — mm-flush-complete fires even
            // when the IDB op was superseded and kept for the drain pass.
            flushedCount++;
          } catch (error) {
            // Clear in-flight marker — op stays queued for retry.
            try {
              await clearInFlight(op.opKey);
            } catch {
              // IDB unavailable — op stays queued; retry on next flush.
            }
            if (is401Error(error)) {
              // Auth expired — stop processing and leave all remaining ops queued.
              authExpired = true;
            } else if (op.kind === "create" && getErrorStatus(error) === 400) {
              // A 400 on a create op could be a crash-retry duplicate: the batch
              // succeeded on a previous attempt but the app crashed before
              // removeFromQueue completed. Since the batch is atomic
              // (address + address_options succeed or fail together), checking
              // whether the address record exists is sufficient to distinguish
              // "already created" from a genuine validation failure.
              try {
                await pb
                  .collection("addresses")
                  .getOne(op.addressId, { fields: "id" });
                // Record exists — previous attempt succeeded. Treat as flushed.
                await removeFromQueue(op.opKey);
                flushedCount++;
              } catch (existenceError) {
                if (
                  existenceError &&
                  typeof existenceError === "object" &&
                  "status" in existenceError &&
                  (existenceError as { status: number }).status === 404
                ) {
                  // Genuine 400 (validation failure, bad payload). Count against budget.
                  const fails = await incrementFailCount(op.opKey);
                  if (fails >= MAX_FAIL_COUNT) {
                    await removeFromQueue(op.opKey);
                    discardedCount++;
                  }
                } else {
                  // Network or IDB error during the existence check — treat as transient.
                  hadTransientFailures = true;
                }
              }
            } else if (isPermanentError(error)) {
              // 403/404/422 — count against retry budget
              try {
                const fails = await incrementFailCount(op.opKey);
                if (fails >= MAX_FAIL_COUNT) {
                  await removeFromQueue(op.opKey);
                  discardedCount++;
                }
              } catch {
                // IDB failure — treat as transient so the op is retried.
                hadTransientFailures = true;
              }
            } else {
              hadTransientFailures = true;
            }
          }
        }
      } finally {
        // refreshCount is resilient — will not throw.
        await refreshCount();
        // Capture before clearing isFlushing: any enqueues during refreshCount
        // see isFlushing=true and correctly set the flag.
        const needsDrain = enqueuedDuringFlushRef.current;
        isFlushing.current = false;
        // Skip dispatching events and scheduling timers if the component unmounted
        // mid-flush — avoids leaking timers or firing events that stale listeners
        // on a newly-mounted map page would receive.
        if (!unmountedRef.current) {
          // Fire mm-flush-complete on any queue change so the UI re-fetches server
          // truth and replaces any stale optimistic state.
          if (flushedCount > 0 || discardedCount > 0) {
            window.dispatchEvent(new CustomEvent("mm-flush-complete"));
          }
          if (discardedCount > 0) {
            window.dispatchEvent(
              new CustomEvent("mm-op-discarded", {
                detail: { count: discardedCount }
              })
            );
          }
          // Dispatch auth-expired once — not once per op — so the UI can show a
          // single prompt. Ops remain queued; they'll flush after re-authentication.
          if (authExpired) {
            window.dispatchEvent(new CustomEvent("mm-auth-expired"));
          }
          // If any op failed transiently, schedule a retry with exponential
          // backoff + jitter. Re-check online/slow at fire time — network may
          // have changed during the delay.
          if (hadTransientFailures) {
            const delay = getRetryDelay(retryCountRef.current);
            retryCountRef.current++;
            if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
            flushTimerRef.current = setTimeout(() => {
              flushTimerRef.current = null;
              if (isOnlineRef.current && !isSlowRef.current)
                void flushQueueRef.current();
            }, delay);
          } else {
            retryCountRef.current = 0;
          }
          if (
            !hadTransientFailures &&
            needsDrain &&
            isOnlineRef.current &&
            !isSlowRef.current
          ) {
            // One or more ops were enqueued while this flush was running — they were
            // not in the snapshot and will not be processed unless we run another pass.
            void flushQueueRef.current();
          }
        }
      }
    };

    // Serialize flush across tabs — ifAvailable skips immediately if another
    // tab already holds the lock, preventing duplicate server writes.
    const lockKey =
      "mapId" in scope
        ? `mm-flush-map-${scope.mapId}`
        : `mm-flush-admin-${scope.congregationId}`;
    if ("locks" in navigator) {
      await navigator.locks.request(
        lockKey,
        { ifAvailable: true },
        async (lock) => {
          if (!lock) return;
          await runFlush();
        }
      );
    } else {
      await runFlush();
    }
  };

  // Keep flushQueueRef pointing at the latest flushQueue. useLayoutEffect
  // (no deps) runs after every committed render, safely after concurrent
  // React may have discarded uncommitted work.
  useLayoutEffect(() => {
    flushQueueRef.current = flushQueue;
  });

  // Flush when online AND not slow AND scope is ready.
  // lastHealthyAt in deps ensures a flush fires every 30s while the connection
  // is healthy — covering the "wake from sleep on same network" scenario where
  // isOnline/isSlow haven't changed so this effect would not otherwise re-run.
  useEffect(() => {
    if (isOnline && !isSlow && scopeId) {
      void flushQueueRef.current();
    }
  }, [isOnline, isSlow, scopeId, lastHealthyAt]);

  const triggerFlush = useEffectEvent(() => {
    if (!isSlowRef.current) void flushQueueRef.current();
  });

  // Also flush on native `online` event and SSE reconnect (PB_CONNECT) — both
  // fire before the health-check poll completes, so pending writes go out sooner.
  // Skip if slow — the health-check poll will trigger when slow clears.
  useEffect(() => {
    window.addEventListener("online", triggerFlush);
    window.addEventListener("mm-sse-reconnect", triggerFlush);
    return () => {
      window.removeEventListener("online", triggerFlush);
      window.removeEventListener("mm-sse-reconnect", triggerFlush);
    };
  }, []);

  // Reset state and refresh pending count when scope changes.
  // Does NOT cancel the flush timer — Effect 1 above may have just scheduled
  // a flush for this same scope change, and cancelling it here would
  // prevent indicators from ever clearing (effect ordering bug).
  useEffect(() => {
    setPendingCount(0);
    setPendingAddressIds(new Set());
    if (scopeId) refreshCount();
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- React Compiler memoizes refreshCount
  }, [scopeId]);

  useEffect(() => {
    // Reset any ops that were in-flight when the app last crashed so they retry
    // cleanly instead of being treated as in-progress duplicates.
    void resetAllInFlight().catch(() => {});
    return () => {
      unmountedRef.current = true;
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    };
  }, []);

  const writeUpdate = async ({
    addressId,
    mapId,
    congregation,
    updateData,
    initialTypes,
    desiredTypes,
    onOptimistic
  }: WriteUpdateParams) => {
    if (!scope) {
      // Direct mode (no scope): no queue — write straight to the server.
      // Errors propagate to the modal's catch block for notifyError display.
      const { toDeleteAoIds, toAddOptionIds } = await resolveOptionChanges(
        initialTypes.map((t) => t.id),
        desiredTypes.map((t) => t.id),
        addressId,
        mapId
      );
      await batchUpdateAddress({
        addressId,
        mapId,
        congregation,
        updateData,
        toDeleteAoIds,
        toAddOptionIds
      });
      window.dispatchEvent(new CustomEvent("mm-flush-complete"));
      return;
    }
    await enqueue({
      addressId,
      assignmentId: mapId,
      congregation,
      updateData,
      initialOptionIds: initialTypes.map((t) => t.id),
      desiredOptionIds: desiredTypes.map((t) => t.id),
      newTypes: desiredTypes,
      ts: Date.now()
    });
    onOptimistic?.();
  };

  const writeCreate = async ({
    mapId,
    congregation,
    createPayload,
    updateData,
    desiredTypes,
    onOptimistic
  }: WriteCreateParams) => {
    const clientId = generateAddressId();
    if (!scope) {
      // Direct mode (no scope): no queue — write straight to the server.
      await batchCreateAddress({
        addressId: clientId,
        mapId,
        congregation,
        createPayload,
        updateData,
        optionIds: desiredTypes.map((t) => t.id)
      });
      window.dispatchEvent(new CustomEvent("mm-flush-complete"));
      return;
    }
    await enqueue({
      addressId: clientId,
      assignmentId: mapId,
      congregation,
      kind: "create",
      createPayload,
      updateData,
      initialOptionIds: [],
      desiredOptionIds: desiredTypes.map((t) => t.id),
      newTypes: desiredTypes,
      ts: Date.now()
    });
    onOptimistic?.(clientId);
  };

  return {
    isOnline,
    isSlow,
    pendingCount,
    pendingAddressIds,
    displayPendingCount,
    displayPendingAddressIds,
    enqueue,
    writeUpdate,
    writeCreate
  };
}

const SmartSyncContext = createContext<UseSmartSyncResult | undefined>(
  undefined
);

export const SmartSyncProvider = SmartSyncContext.Provider;

export function useSmartSyncContext(): UseSmartSyncResult {
  const ctx = useContext(SmartSyncContext);
  if (!ctx)
    throw new Error(
      "useSmartSyncContext must be used within a SmartSyncProvider"
    );
  return ctx;
}
