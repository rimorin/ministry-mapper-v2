import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { countPop } from "@/lib/motion";

interface CountBadgeProps {
  count: number;
  // "active" = occupied status (Assign/Personal); "notify" = unread (Messages).
  tone?: "active" | "notify";
  onClick: () => void;
  ariaLabel: string;
}

export default function CountBadge({
  count,
  tone = "active",
  onClick,
  ariaLabel
}: CountBadgeProps) {
  return (
    <Button
      size="sm"
      variant="default"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "rounded-l-none px-2.5 font-semibold tabular-nums",
        tone === "active" && "border-l border-primary-foreground/20",
        tone === "notify" &&
          "bg-(--mm-warning) text-black hover:bg-(--mm-warning)/90"
      )}
    >
      <AnimatePresence mode="popLayout">
        <m.span
          key={count}
          variants={countPop}
          initial="hidden"
          animate="show"
          exit="exit"
          className="inline-block"
        >
          {count}
        </m.span>
      </AnimatePresence>
    </Button>
  );
}
