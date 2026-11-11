import { createContext, use, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { isEndgame } from "../../utils/policies";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";

export interface NextAddressSlotValue {
  target: HTMLElement | null;
  surface: "admin" | "publisher";
  renderButton: (onClick: () => void) => ReactNode;
}

export const NextAddressSlotContext =
  createContext<NextAddressSlotValue | null>(null);

interface NextAvailableProps {
  remaining: number;
  progress: number;
  isFiltered: boolean;
  onClick: () => void;
}

const NextAvailable = ({
  remaining,
  progress,
  isFiltered,
  onClick
}: NextAvailableProps) => {
  const slot = use(NextAddressSlotContext);
  const surface = slot?.surface;

  // Early on nearly every address still needs a call, so the next one is
  // whatever is already on screen. The button only earns its place once what
  // is left is scattered, which is the same point the cells start highlighting.
  // A filter scatters what is left by itself, so it offers the button early.
  const isOffered = remaining > 0 && (isFiltered || isEndgame(progress));

  // Keyed on isOffered, not fired on render, so a map that sits in its endgame
  // across many re-renders still counts as one offer.
  useEffect(() => {
    if (isOffered && surface) {
      trackEvent(ANALYTICS_EVENTS.NEXT_ADDRESS_OFFERED, { surface });
    }
  }, [isOffered, surface]);

  if (!isOffered || !slot?.target) return null;

  return createPortal(
    slot.renderButton(() => {
      trackEvent(ANALYTICS_EVENTS.NEXT_ADDRESS_USED, { surface: slot.surface });
      onClick();
    }),
    slot.target
  );
};

export default NextAvailable;
