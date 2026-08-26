import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isEndgame } from "../../utils/policies";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";

interface NextAvailableProps {
  remaining: number;
  progress: number;
  surface: "admin" | "publisher";
  onClick: () => void;
}

// The floating map controls sit on tiles and need an opaque bg-background to
// stay legible. This one sits on the grid, which already is bg-background, so
// it lifts to the secondary surface — the tone the sticky headers use.
const NextAvailable = ({
  remaining,
  progress,
  surface,
  onClick
}: NextAvailableProps) => {
  const { t } = useTranslation();

  // Early on nearly every address still needs a call, so the next one is
  // whatever is already on screen. The button only earns its place once what
  // is left is scattered, which is the same point the cells start highlighting.
  const isOffered = remaining > 0 && isEndgame(progress);

  // Keyed on isOffered, not fired on render, so a map that sits in its endgame
  // across many re-renders still counts as one offer.
  useEffect(() => {
    if (isOffered) {
      trackEvent(ANALYTICS_EVENTS.NEXT_ADDRESS_OFFERED, { surface });
    }
  }, [isOffered, surface]);

  if (!isOffered) return null;

  return (
    <Button
      variant="secondary"
      onClick={() => {
        trackEvent(ANALYTICS_EVENTS.NEXT_ADDRESS_USED, { surface });
        onClick();
      }}
      className="absolute right-4 bottom-4 z-20 rounded-full border-border px-3.5 text-xs tabular-nums shadow-sm"
    >
      {t("navigation.addressesLeft", "{{count}} to go", { count: remaining })}
      <ChevronRight className="size-3.5 text-muted-foreground" />
    </Button>
  );
};

export default NextAvailable;
