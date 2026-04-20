import { useEffect, useEffectEvent } from "react";
import {
  RecordModel,
  RecordSubscribeOptions,
  RecordSubscription
} from "pocketbase";
import { setupRealtimeListener } from "../utils/pocketbase";

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
 */
export default function useRealtimeSubscription(
  collectionName: string,
  callback: (data: RecordSubscription<RecordModel>) => void,
  options: RecordSubscribeOptions | undefined,
  dependencies: React.DependencyList = [],
  enabled = true,
  debounceMs = 0
) {
  const onData = useEffectEvent((data: RecordSubscription<RecordModel>) => {
    callback(data);
  });

  useEffect(() => {
    if (!enabled) return;

    let isCleaned = false;
    let unsubscribe: (() => void) | undefined;

    const subscribe = () => {
      if (isCleaned) return;
      setupRealtimeListener(collectionName, onData, options)
        .then((unsub) => {
          if (isCleaned) {
            unsub();
            return;
          }
          unsubscribe = unsub;
        })
        .catch((error) => {
          console.error("Failed to setup realtime listener:", error);
        });
    };

    const timeoutId =
      debounceMs > 0 ? setTimeout(subscribe, debounceMs) : undefined;
    if (timeoutId === undefined) subscribe();

    return () => {
      isCleaned = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- spread deps are caller-controlled; options captured via closure
  }, [enabled, debounceMs, collectionName, ...dependencies]);
}
