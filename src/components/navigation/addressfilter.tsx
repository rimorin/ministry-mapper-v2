import { useState, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { STATUS_TILE_CLASS, useStatusOptions } from "../form/statusoptions";
import type { AddressFilter, HHOptionProps } from "../../utils/interface";
import {
  countAddressFilters,
  EMPTY_ADDRESS_FILTER
} from "../../hooks/useAddressFilter";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";

interface AddressFilterPopoverProps {
  filter: AddressFilter;
  onChange: (filter: AddressFilter) => void;
  options: HHOptionProps[];
  surface: "admin" | "publisher";
  side?: "top" | "bottom";
  trigger: ReactElement;
}

// Past this many household types the list no longer fits at a glance.
const SEARCHABLE_OPTION_COUNT = 8;

const groupLabelClass =
  "text-xs font-medium uppercase tracking-wide text-muted-foreground";

// A popover rather than a sheet so the grid stays in view: each toggle dims or
// restores cells immediately, which is how you tell whether it did what you meant.
const AddressFilterPopover = ({
  filter,
  onChange,
  options,
  surface,
  side = "bottom",
  trigger
}: AddressFilterPopoverProps) => {
  const { t } = useTranslation();
  const statuses = useStatusOptions();
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const visibleOptions = options.filter(
    (option) =>
      option.description.toLowerCase().includes(needle) ||
      option.code.toLowerCase().includes(needle)
  );

  const toggleType = (id: string, checked: boolean) =>
    onChange({
      ...filter,
      types: checked
        ? [...filter.types, id]
        : filter.types.filter((type) => type !== id)
    });

  // Reported on close, so one visit counts once however many toggles it took.
  const handleOpenChange = (open: boolean) => {
    if (open) return;
    setQuery("");
    if (countAddressFilters(filter) === 0) return;
    trackEvent(ANALYTICS_EVENTS.ADDRESS_FILTER_APPLIED, {
      surface,
      statuses: filter.statuses.join(","),
      types: filter.types.length
    });
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        side={side}
        className="w-80 max-w-[calc(100vw-2rem)] gap-3"
      >
        <div className="flex items-center justify-between">
          <PopoverTitle className="font-medium">
            {t("address.filterTitle", "Filter addresses")}
          </PopoverTitle>
          <Button
            variant="ghost"
            size="sm"
            className="-me-2 h-7"
            disabled={countAddressFilters(filter) === 0}
            onClick={() => onChange(EMPTY_ADDRESS_FILTER)}
          >
            {t("common.clear", "Clear")}
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={groupLabelClass}>
            {t("address.filterStatus", "Status")}
          </span>
          <ToggleGroup
            multiple
            variant="outline"
            value={filter.statuses}
            onValueChange={(statuses) => onChange({ ...filter, statuses })}
            className="flex w-full"
          >
            {statuses.map(({ value, label, icon, pressedClass }) => (
              <ToggleGroupItem
                key={value}
                value={value}
                aria-label={label}
                className={cn(STATUS_TILE_CLASS, pressedClass)}
              >
                {icon}
                <span className="text-[10px] font-medium leading-none">
                  {label}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        {/* With a single household type every address carries it, so there
            is nothing to narrow down. */}
        {options.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <span className={groupLabelClass}>
              {t("household.household", "Household")}
            </span>
            {options.length > SEARCHABLE_OPTION_COUNT && (
              <div className="relative">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("address.filterSearch", "Search household")}
                  aria-label={t("address.filterSearch", "Search household")}
                  className="ps-8"
                />
              </div>
            )}
            <div className="-mx-2 max-h-56 overflow-y-auto overscroll-contain">
              {visibleOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 hover:bg-muted"
                >
                  <Checkbox
                    checked={filter.types.includes(option.id)}
                    onCheckedChange={(checked) =>
                      toggleType(option.id, checked)
                    }
                  />
                  <span className="flex-1 truncate">{option.description}</span>
                  {/* The code is what the grid badges show, so it ties each
                      row back to the cells it will pick out. */}
                  <span className="text-xs text-muted-foreground">
                    {option.code}
                  </span>
                </label>
              ))}
              {visibleOptions.length === 0 && (
                <p className="px-2 py-2 text-muted-foreground">
                  {t("common.noResults", "No results found.")}
                </p>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default AddressFilterPopover;
