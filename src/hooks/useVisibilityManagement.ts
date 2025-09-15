import { useEffect, useCallback, useState } from "react";

export function useVisibilityChange(callback: () => void) {
  const stableCallback = useCallback(callback, [callback]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        stableCallback();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stableCallback]);
}

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(
    document.visibilityState === "visible"
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

export default useVisibilityChange;
