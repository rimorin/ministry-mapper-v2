import { useEffect, useEffectEvent } from "react";
import { pb, isAbortError } from "../utils/pocketbase";

/**
 * Calls `callback` whenever the PocketBase SSE connection (re)establishes.
 * Covers genuine network drops and cold starts — PB_CONNECT fires on every
 * connect, not just the first.
 *
 * @param callback - Function to call on reconnect. Always uses the latest
 *   closure values via useEffectEvent — no need to include them in deps.
 * @param enabled - Whether the subscription is active (default: true). Pass
 *   a falsy guard (e.g. !!mapId) to skip subscribing until ready.
 */
export default function useOnSSEReconnect(
  callback: () => void,
  enabled = true
) {
  const onReconnect = useEffectEvent(callback);

  useEffect(() => {
    if (!enabled) return;

    let isCleaned = false;
    let unsubscribe: (() => void) | undefined;

    pb.realtime
      .subscribe("PB_CONNECT", onReconnect)
      .then((unsub) => {
        if (isCleaned) {
          unsub();
          return;
        }
        unsubscribe = unsub;
      })
      .catch((error) => {
        if (!isAbortError(error))
          console.error("[useOnSSEReconnect] subscription failed:", error);
      });

    return () => {
      isCleaned = true;
      if (unsubscribe) unsubscribe();
    };
  }, [enabled]);
}
