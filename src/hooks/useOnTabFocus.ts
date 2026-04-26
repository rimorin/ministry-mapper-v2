import { useEffect, useEffectEvent, useRef } from "react";

// Middleground between SWR's 5s and a 30s dormancy threshold.
// Ignores quick alt-tabs while catching browser tab throttling (starts ~5–10s).
export const TAB_FOCUS_THROTTLE_MS = 15_000;

/**
 * Calls `callback` whenever the tab becomes visible, throttled to at most once
 * per `throttleMs`. Covers browser-throttled background tabs where the SSE
 * connection stalls without disconnecting — no PB_CONNECT fires in that case.
 */
export default function useOnTabFocus(
  callback: () => void,
  throttleMs = TAB_FOCUS_THROTTLE_MS
) {
  const onFocus = useEffectEvent(callback);
  const lastCalledAt = useRef<number>(-Infinity);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) return;
      const now = Date.now();
      if (now - lastCalledAt.current < throttleMs) return;
      lastCalledAt.current = now;
      onFocus();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [throttleMs]);
}
