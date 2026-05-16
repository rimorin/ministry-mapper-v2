import * as React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "@/lib/utils";

const FADE_MASK = `linear-gradient(
  to bottom,
  transparent 0,
  black calc(min(var(--scroll-area-overflow-y-start, 0) * 1px, 28px)),
  black calc(100% - min(var(--scroll-area-overflow-y-end, 0) * 1px, 28px)),
  transparent 100%
)`;

function ScrollArea({
  className,
  children,
  withFade = false,
  ...props
}: ScrollAreaPrimitive.Root.Props & { withFade?: boolean }) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="h-full w-full max-h-[inherit] rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
        style={withFade ? { maskImage: FADE_MASK } : undefined}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none p-px",
        // Hover-only: hidden by default, revealed when hovering or scrolling
        "opacity-0 transition-opacity duration-200",
        "data-[hovering]:opacity-100 data-[scrolling]:opacity-100",
        // Slimmer track: 6px (w-1.5) instead of 10px
        "data-vertical:h-full data-vertical:w-1.5 data-vertical:border-l data-vertical:border-l-transparent",
        "data-horizontal:h-1.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-foreground/20 transition-colors hover:bg-foreground/35"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
