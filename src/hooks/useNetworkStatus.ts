import { useState, useEffect, useRef } from "react";

interface NetworkStatus {
  isOnline: boolean;
  isSlow: boolean;
}

// Network Information API (Chrome/Android only — progressive enhancement)
interface NetworkInformation extends EventTarget {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  // Estimated RTT in ms (multiples of 25). Spikes on degraded 4G/3G even when
  // effectiveType still reports "4g", catching cases downlink alone misses.
  rtt?: number;
}

const HEALTH_ENDPOINT = `${import.meta.env.VITE_POCKETBASE_URL}/api/health`;
const INTERVAL_FAST = 30_000;
const INTERVAL_SLOW = 60_000;
// When navigator.connection is absent (iOS/Firefox), use more aggressive settings
// to compensate for the lack of instant OS-level quality signals.
const INTERVAL_FAST_NO_API = 15_000;
const INTERVAL_SLOW_NO_API = 45_000;
const MAX_RETRY_DELAY = 300_000;
// Reduced from 10s: /api/health is a tiny payload; 5s is generous even on slow 3G
const FETCH_TIMEOUT = 5_000;
const SLOW_THRESHOLD_MS = 1_500;
// Require 3 consecutive slow samples to avoid false positives on 3G jitter
const SLOW_CONFIRM_COUNT = 3;
// Without navigator.connection: 2 samples (each 20s) = ~40s to confirm slow,
// vs 3 × 30s = ~90s. More false positives are acceptable here — queuing is
// transparent to the user and a flush happens as soon as the connection recovers.
const SLOW_CONFIRM_COUNT_NO_API = 2;
// Exit slow mode after a single fast health probe. Two confirmations added
// latency (up to 90s) that outweighs the rare cost of a premature flush attempt
// on a marginal signal — the flush has exponential backoff and recovers cleanly.
const FAST_CONFIRM_COUNT = 1;

function isConnectionSlow(connection: NetworkInformation): boolean {
  if (
    connection.effectiveType === "slow-2g" ||
    connection.effectiveType === "2g"
  )
    return true;
  // rtt spike on degraded 4G/3G: effectiveType may still report "4g" while the
  // link is unusable — check rtt as a secondary signal.
  if (connection.rtt !== undefined && connection.rtt >= SLOW_THRESHOLD_MS)
    return true;
  if (connection.downlink !== undefined && connection.downlink < 0.5)
    return true;
  return false;
}

// Symmetric to isConnectionSlow — used to pre-seed fast-confirm count on OS upgrade hint.
function isConnectionFast(connection: NetworkInformation): boolean {
  if (connection.effectiveType === "4g") return true;
  if (connection.rtt !== undefined && connection.rtt < 100) return true;
  return false;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlow: false
  });
  // Incremented on every confirmed fast health check. useSmartSync adds this
  // to its flush effect's dep array so a flush is scheduled even when isOnline
  // and isSlow haven't changed (e.g. tab wakes from sleep on same network).
  const [lastHealthyAt, setLastHealthyAt] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayRef = useRef(INTERVAL_FAST);
  const slowCountRef = useRef(0);
  const fastCountRef = useRef(0);
  // Sync mirror of status.isSlow so event callbacks can read the current slow
  // state without a stale closure.
  const isSlowRef = useRef(false);
  // Set to true for the duration of the post-wake health check so that a
  // TCP-level "Failed to fetch" (OS network stack not yet ready after sleep)
  // does not trigger goOffline() and double the retry backoff. Cleared
  // immediately after checkConnection() returns; no timer required.
  const inWakeGraceRef = useRef(false);

  useEffect(() => {
    // Resolve Network Information API once at mount. Used both for adaptive
    // constants and for the 'change' event listener.
    const connection = (
      navigator as Navigator & { connection?: NetworkInformation }
    ).connection;
    // When the API is absent (iOS Safari, Firefox), compensate with tighter
    // polling: fewer confirmation samples and shorter intervals.
    const hasNetworkInfo = !!connection;
    const effectiveSlowConfirmCount = hasNetworkInfo
      ? SLOW_CONFIRM_COUNT
      : SLOW_CONFIRM_COUNT_NO_API;
    const effectiveIntervalFast = hasNetworkInfo
      ? INTERVAL_FAST
      : INTERVAL_FAST_NO_API;
    const effectiveIntervalSlow = hasNetworkInfo
      ? INTERVAL_SLOW
      : INTERVAL_SLOW_NO_API;

    // Seed the initial retry delay with the effective fast interval
    // (the ref default was INTERVAL_FAST which may differ for no-API devices).
    retryDelayRef.current = effectiveIntervalFast;

    const goOffline = () => {
      slowCountRef.current = 0;
      fastCountRef.current = 0;
      isSlowRef.current = false;
      setStatus({ isOnline: false, isSlow: false });
    };

    // Immediately marks the connection as confirmed-slow, bypassing the
    // multi-poll confirmation cycle. Used on mount and on OS connection-change
    // hints where the signal is authoritative enough to skip polling confirmation.
    const markSlow = () => {
      slowCountRef.current = effectiveSlowConfirmCount;
      fastCountRef.current = 0;
      isSlowRef.current = true;
      setStatus((prev) => ({ ...prev, isSlow: true }));
      retryDelayRef.current = effectiveIntervalSlow;
    };

    // Updates slow-detection counters, derives the new isSlow state, and sets
    // the adaptive polling interval. Returns the new isSlow value.
    // Relies on FAST_CONFIRM_COUNT === 1: any single fast response exits slow mode.
    // Update this function if FAST_CONFIRM_COUNT ever increases.
    const recordSample = (
      isSampleSlow: boolean,
      isTimeout: boolean = false
    ) => {
      if (isSampleSlow) {
        slowCountRef.current += 1;
        fastCountRef.current = 0;
      } else {
        fastCountRef.current += 1;
        slowCountRef.current = 0;
      }
      // A timeout is a strong slow signal (enter immediately, no confirmation).
      // Stay slow while already slow with slow samples; enter slow once threshold
      // is reached. Any fast sample exits slow (FAST_CONFIRM_COUNT === 1).
      const newIsSlow = isSampleSlow
        ? isTimeout ||
          isSlowRef.current ||
          slowCountRef.current >= effectiveSlowConfirmCount
        : false;
      isSlowRef.current = newIsSlow;
      setStatus({ isOnline: true, isSlow: newIsSlow });
      // Use slow interval only while count is at/above threshold. Drops back to
      // fast polling on first fast sample so recovery is confirmed quickly.
      retryDelayRef.current =
        slowCountRef.current >= effectiveSlowConfirmCount
          ? effectiveIntervalSlow
          : effectiveIntervalFast;
      return newIsSlow;
    };

    const checkConnection = async () => {
      // Fast-path: skip the TCP round-trip when the OS already knows we're offline.
      if (!navigator.onLine) {
        goOffline();
        return false;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Capture controller locally to avoid race: a subsequent checkConnection
      // replacing abortControllerRef.current before this timeout fires.
      const controller = new AbortController();
      abortControllerRef.current = controller;
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, FETCH_TIMEOUT);

      try {
        const start = performance.now();
        const response = await fetch(`${HEALTH_ENDPOINT}?_=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal
        });
        const elapsed = performance.now() - start;
        clearTimeout(timeoutId);

        // JSON Content-Type confirms a genuine PocketBase response; captive portals
        // return 200 HTML which would otherwise pass the response.ok check.
        const isJson = response.headers
          .get("content-type")
          ?.includes("application/json");
        if (response.ok && isJson) {
          const newIsSlow = recordSample(elapsed > SLOW_THRESHOLD_MS);
          // Track the last time the connection was confirmed fast. This drives a
          // periodic flush signal in useSmartSync even when isOnline/isSlow haven't
          // changed — covering the "wake from sleep on same network" scenario.
          if (!newIsSlow) setLastHealthyAt(Date.now());
        } else {
          goOffline();
          retryDelayRef.current = effectiveIntervalFast;
        }
        return true;
      } catch (error) {
        clearTimeout(timeoutId);
        if ((error as Error).name === "AbortError" && timedOut) {
          // 5 s timeout: request is definitely slow — count as a slow sample.
          // Keep isOnline: true since timeout ≠ unreachable.
          recordSample(true, true);
        } else if ((error as Error).name !== "AbortError") {
          if (inWakeGraceRef.current) {
            // First TCP-level failure after system wake: the OS network stack
            // may not be ready for new connections yet. Suppress goOffline()
            // and reset to fast polling so the next scheduled check decides
            // the true connectivity state.
            retryDelayRef.current = effectiveIntervalFast;
          } else {
            goOffline();
            retryDelayRef.current = Math.min(
              retryDelayRef.current * 2,
              MAX_RETRY_DELAY
            );
          }
        }
        return false;
      }
    };

    const scheduleNextCheck = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(async () => {
        await checkConnection();
        scheduleNextCheck();
      }, retryDelayRef.current);
    };

    checkConnection();

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        // Guard the post-wake check against false-offline from TCP failures.
        // The grace is scoped exactly to the duration of checkConnection().
        inWakeGraceRef.current = true;
        await checkConnection();
        inWakeGraceRef.current = false;
        scheduleNextCheck();
      }
    };

    // Shared handler for browser `online` and SSE reconnect — both signal the
    // connection is back. Await checkConnection so recordSample() updates
    // retryDelayRef before scheduleNextCheck() reads it (same reason as
    // handleConnectionChange), then restart the polling loop at the fast interval.
    const handleNetworkResume = async () => {
      retryDelayRef.current = effectiveIntervalFast;
      // Pre-seed fast count: an explicit network-recovery event (WiFi switch,
      // SSE reconnect) is a strong signal — one confirming health check is
      // enough to exit slow mode. The 2-poll requirement is for scheduled
      // polling on marginal signals, not genuine network handoff events.
      if (isSlowRef.current) {
        fastCountRef.current = FAST_CONFIRM_COUNT - 1;
        slowCountRef.current = 0;
      }
      await checkConnection();
      scheduleNextCheck();
    };

    // Network Information API (Chrome/Android — progressive enhancement).
    // Provides near-instant quality signal from the OS without waiting for
    // SLOW_CONFIRM_COUNT polling cycles (~90s worst case).

    const handleConnectionChange = async () => {
      if (document.hidden || !connection) return;
      if (isConnectionSlow(connection)) {
        // OS reports poor quality: jump straight to confirmed slow without
        // waiting for 3 consecutive health-check timeouts.
        // Preserve isOnline — a connection hint proves link quality, not reachability.
        markSlow();
      } else if (isSlowRef.current && isConnectionFast(connection)) {
        // OS signals upgrade — pre-seed fast count so one confirming health check
        // exits slow mode rather than needing FAST_CONFIRM_COUNT full polls.
        fastCountRef.current = FAST_CONFIRM_COUNT - 1;
        slowCountRef.current = 0;
      }
      // Await so recordSample() updates retryDelayRef before scheduleNextCheck()
      // reads it — otherwise the next timer would be queued with the old (slow)
      // interval even when this check confirms a fast connection.
      await checkConnection();
      scheduleNextCheck();
    };

    // Apply connection quality hint immediately on mount — covers the case
    // where the app opens on an already-degraded connection.
    if (connection && isConnectionSlow(connection)) markSlow();

    scheduleNextCheck();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleNetworkResume);
    window.addEventListener("offline", goOffline);
    window.addEventListener("mm-sse-reconnect", handleNetworkResume);
    connection?.addEventListener?.("change", handleConnectionChange);

    return () => {
      inWakeGraceRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleNetworkResume);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("mm-sse-reconnect", handleNetworkResume);
      connection?.removeEventListener?.("change", handleConnectionChange);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { ...status, lastHealthyAt };
}
