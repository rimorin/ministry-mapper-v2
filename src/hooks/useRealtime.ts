import { useEffect, useRef } from "react";
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
 */
export default function useRealtimeSubscription(
  collectionName: string,
  callback: (data: RecordSubscription<RecordModel>) => void,
  options: RecordSubscribeOptions | undefined,
  dependencies: React.DependencyList = [],
  enabled = true
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let unsubscribe: (() => void) | undefined;

    const subscribe = async () => {
      try {
        unsubscribe = await setupRealtimeListener(
          collectionName,
          (data) => callbackRef.current(data),
          options
        );
      } catch (error) {
        console.error("Failed to setup realtime listener:", error);
      }
    };

    subscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [enabled, collectionName, ...dependencies]);
}
