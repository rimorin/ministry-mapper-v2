import type { WheelEvent } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export interface FilterChip {
  value: string;
  label: string;
  count: number;
}

interface FilterChipsProps {
  chips: FilterChip[];
  value: string;
  onValueChange: (value: string) => void;
  "aria-label": string;
  // On the row, for its edges: it scrolls sideways rather than wrapping.
  className?: string;
}

// A mouse wheel only scrolls up and down; turned sideways, it reaches the
// chips past the edge.
const scrollSideways = (event: WheelEvent<HTMLDivElement>) => {
  if (event.deltaX === 0) event.currentTarget.scrollLeft += event.deltaY;
};

// One chip at a time, each with how many it holds, in a single row that
// scrolls, so a long list of groups never pushes down what it filters.
// Pressing the chosen chip again goes back to the first, the "All" chip. The
// toggles are told apart by position, since Base UI reads an empty value as
// none.
const FilterChips = ({
  chips,
  value,
  onValueChange,
  className,
  ...props
}: FilterChipsProps) => (
  <div
    className={cn(
      "scroll-fade-x overflow-x-auto overscroll-x-contain scrollbar-none",
      className
    )}
    onWheel={scrollSideways}
  >
    <ToggleGroup
      value={[String(chips.findIndex((chip) => chip.value === value))]}
      onValueChange={([index = "0"]) => onValueChange(chips[+index].value)}
      size="sm"
      variant="outline"
      spacing={1.5}
      {...props}
    >
      {chips.map((chip, index) => (
        <ToggleGroupItem
          key={chip.value}
          value={String(index)}
          // Filled in, since the toggle's own pressed tint is too faint to
          // read as the filter in force.
          className="group/chip rounded-full pr-1.5 pl-3 data-[pressed]:border-primary data-[pressed]:bg-primary data-[pressed]:text-primary-foreground"
        >
          {chip.label}{" "}
          {/* Its own pill, so a count never reads as part of "Group 2". */}
          <span className="min-w-5 rounded-full bg-muted px-1.5 text-center text-xs text-muted-foreground tabular-nums group-data-[pressed]/chip:bg-primary-foreground/20 group-data-[pressed]/chip:text-primary-foreground">
            {chip.count}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  </div>
);

export default FilterChips;
