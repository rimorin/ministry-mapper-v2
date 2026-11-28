import type { WheelEvent } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface FilterChip {
  value: string;
  label: string;
  count: number;
}

type FilterChipsProps = {
  // The first chip is "All".
  chips: FilterChip[];
  "aria-label": string;
  // Applied to the scrolling row.
  className?: string;
} & (
  | {
      multiple?: false;
      value: string;
      onValueChange: (value: string) => void;
    }
  | {
      // Several chips at once; none chosen is "All".
      multiple: true;
      value: string[];
      onValueChange: (value: string[]) => void;
    }
);

// A chip filled in when pressed, since the toggle's own pressed tint is too
// faint to read as chosen.
export const chipClass =
  "rounded-full data-[pressed]:border-primary data-[pressed]:bg-primary data-[pressed]:text-primary-foreground";

// Lets a mouse wheel scroll the row sideways.
const scrollSideways = (event: WheelEvent<HTMLDivElement>) => {
  if (event.deltaX === 0) event.currentTarget.scrollLeft += event.deltaY;
};

const ALL = "0";

// Chips with a count each, in a row that scrolls rather than wraps. Pressing
// "All", or letting go of the last chip chosen, goes back to everyone.
// Toggles are keyed by position, since Base UI reads an empty value as none.
const FilterChips = ({
  chips,
  className,
  "aria-label": ariaLabel,
  ...selection
}: FilterChipsProps) => {
  // Several chosen: a value whose chip has gone is dropped, and none left
  // shows "All". One chosen: shown as given, since the caller filters by it.
  const chosen = selection.multiple
    ? chips.flatMap((chip, index) =>
        selection.value.includes(chip.value) ? [String(index)] : []
      )
    : [String(chips.findIndex((chip) => chip.value === selection.value))];
  const pressed = chosen.length > 0 ? chosen : [ALL];

  const onPressedChange = (next: string[]) => {
    if (!selection.multiple) {
      const [index = ALL] = next;
      selection.onValueChange(chips[+index].value);
      return;
    }
    const allJustPressed = next.includes(ALL) && !pressed.includes(ALL);
    selection.onValueChange(
      allJustPressed
        ? []
        : next
            .filter((index) => index !== ALL)
            .map((index) => chips[+index].value)
    );
  };

  return (
    <div
      className={cn(
        "scroll-fade-x overflow-x-auto overscroll-x-contain scrollbar-none",
        className
      )}
      onWheel={scrollSideways}
    >
      <ToggleGroup
        multiple={selection.multiple}
        value={pressed}
        onValueChange={onPressedChange}
        size="sm"
        variant="outline"
        spacing={1.5}
        aria-label={ariaLabel}
      >
        {chips.map((chip, index) => (
          <ToggleGroupItem
            key={chip.value}
            value={String(index)}
            className={cn(chipClass, "group/chip pr-1.5 pl-3")}
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
};

export default FilterChips;
