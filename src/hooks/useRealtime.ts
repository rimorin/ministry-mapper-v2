import { useEffect, useEffectEvent, useState } from "react";
import {
  RecordModel,
  RecordSubscribeOptions,
  RecordSubscription
} from "pocketbase";
import { setupRealtimeListener, isAbortError } from "../utils/pocketbase";
import useOnTabFocus from "./useOnTabFocus";

/**
 * Custom hook to manage a PocketBase real-time subscription.
 *
 * @param collectionName - The name of the collection to subscribe to.
 * @param callback - The function to execute when a message is received.
 * @param options - Subscription options.
 * @param dependencies - Array of primitive values that trigger resubscription.
 * @param enabled - Whether the subscription is enabled (default: true).
 * @param debounceMs - Delay before establishing the subscription. Use a small
 *   value (e.g. 50) for components that mount inside virtual lists, where rows
 *   may be mounted and immediately unmounted during initial layout, to avoid
 *   unnecessary cancelled network requests. Defaults to 0 (no debounce).
 * @param topic - The subscription topic. Defaults to "*" (all records). Pass a
 *   record ID to subscribe to a single record directly, which is more efficient
 *   than using a `filter` and ensures realtime events are received reliably.
 */
export default function useRealtimeSubscription(
  collectionName: string,
  callback: (data: RecordSubscription<RecordModel>) => void,
  options: RecordSubscribeOptions | undefined,
  dependencies: React.DependencyList = [],
  enabled = true,
  debounceMs = 0,
  topic = "*"
) {
  const onData = useEffectEvent((data: RecordSubscription<RecordModel>) => {
    callback(data);
  });
  const getOptions = useEffectEvent(() => options);

  const [resubscribeKey, setResubscribeKey] = useState(0);
  useOnTabFocus(() => setResubscribeKey((k) => k + 1));

  useEffect(() => {
    if (!enabled) return;

    let isCleaned = false;
    let unsubscribe: (() => void) | undefined;
    let retryTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const subscribe = (retryCount = 0) => {
      if (isCleaned) return;
      setupRealtimeListener(collectionName, onData, getOptions(), topic)
        .then((unsub) => {
          if (isCleaned) {
            unsub();
            return;
          }
          unsubscribe = unsub;
        })
        .catch((error) => {
          if (isCleaned || isAbortError(error)) return;
          console.error("Failed to setup realtime listener:", error);
          const delay = Math.min(1_000 * 2 ** retryCount, 30_000);
          retryTimeoutId = setTimeout(() => subscribe(retryCount + 1), delay);
        });
    };

    const timeoutId =
      debounceMs > 0 ? setTimeout(subscribe, debounceMs) : undefined;
    if (timeoutId === undefined) subscribe();

    return () => {
      isCleaned = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      if (retryTimeoutId !== undefined) clearTimeout(retryTimeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [
    enabled,
    debounceMs,
    collectionName,
    topic,
    resubscribeKey,
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- spread deps are caller-controlled
    ...dependencies
  ]);
}
