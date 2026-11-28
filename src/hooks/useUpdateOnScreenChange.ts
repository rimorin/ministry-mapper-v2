import { useEffect, useRef } from "react";
import { applyWaitingUpdate } from "@/utils/appUpdate";

// A change of `screen` is a move to another screen, a natural break to load a
// waiting update: the app reopens on the screen the user moved to. The first
// render is not a move.
export default function useUpdateOnScreenChange(screen: string) {
  const previous = useRef(screen);

  useEffect(() => {
    if (previous.current === screen) return;
    previous.current = screen;
    // Once the move has settled, so a panel closing with it, like the phone
    // sidebar, already reads as closed.
    const timer = setTimeout(applyWaitingUpdate, 0);
    return () => clearTimeout(timer);
  }, [screen]);
}
