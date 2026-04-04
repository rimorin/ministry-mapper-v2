import { useEffect, useEffectEvent } from "react";

export function useVisibilityChange(callback: () => void) {
  const onVisible = useEffectEvent(callback);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        onVisible();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}

export default useVisibilityChange;
