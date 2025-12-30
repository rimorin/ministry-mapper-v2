import { useState, useEffect, useRef } from "react";

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
}

const HEALTH_ENDPOINT = `${import.meta.env.VITE_POCKETBASE_URL}/api/health`;
const CHECK_INTERVAL = 60000;
const MAX_RETRY_DELAY = 300000;
const SLOW_CONNECTION_THRESHOLD = 1000;
const FETCH_TIMEOUT = 10000;

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryDelayRef = useRef(CHECK_INTERVAL);

  useEffect(() => {
    const checkConnection = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(
        () => abortControllerRef.current?.abort(),
        FETCH_TIMEOUT
      );

      try {
        const start = Date.now();
        const response = await fetch(HEALTH_ENDPOINT, {
          method: "GET",
          cache: "no-cache",
          signal: abortControllerRef.current.signal
        });
        clearTimeout(timeoutId);
        const latency = Date.now() - start;

        setStatus({
          isOnline: response.ok,
          isSlowConnection: response.ok && latency > SLOW_CONNECTION_THRESHOLD
        });

        retryDelayRef.current = CHECK_INTERVAL;
        return true;
      } catch (error) {
        clearTimeout(timeoutId);
        if ((error as Error).name !== "AbortError") {
          setStatus({ isOnline: false, isSlowConnection: false });
          retryDelayRef.current = Math.min(
            retryDelayRef.current * 2,
            MAX_RETRY_DELAY
          );
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

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        checkConnection();
        scheduleNextCheck();
      }
    };

    const handleOnline = () => {
      retryDelayRef.current = CHECK_INTERVAL;
      checkConnection();
    };

    const handleOffline = () =>
      setStatus({ isOnline: false, isSlowConnection: false });

    scheduleNextCheck();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return status;
}
