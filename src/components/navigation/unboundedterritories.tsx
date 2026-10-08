import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger
} from "@/components/ui/popover";
import AggregationBadge from "./aggrbadge";
import type {
  TerritoryListingProps,
  territoryDetails
} from "../../utils/interface";

// Past this many codes the trigger would crowd the map, so the rest collapse
// into a "+N" count.
const INLINE_CODE_COUNT = 2;

interface UnboundedTerritoriesProps {
  territories: territoryDetails[];
  handleSelect: TerritoryListingProps["handleSelect"];
}

// Territories without a boundary have no polygon to tap, so this names them
// and keeps them selectable from the map view.
const UnboundedTerritories = ({
  territories,
  handleSelect
}: UnboundedTerritoriesProps) => {
  const { t } = useTranslation();
  const inlineCodes = territories
    .slice(0, INLINE_CODE_COUNT)
    .map((territory) => territory.code)
    .join(", ");
  const hiddenCount = territories.length - INLINE_CODE_COUNT;

  return (
    <Popover>
      <PopoverTrigger className="flex max-w-60 items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning shadow-[0_0.125rem_0.25rem_rgba(0,0,0,0.075)]">
        <TriangleAlert className="size-4 shrink-0" />
        <span className="shrink-0 font-semibold">
          {t("territory.noBoundary", "No boundary")}
        </span>
        <span className="min-w-0 truncate font-bold">{inlineCodes}</span>
        {hiddenCount > 0 && (
          <span className="shrink-0 font-bold">+{hiddenCount}</span>
        )}
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="gap-2 p-2">
        <PopoverTitle className="px-2 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("territory.notShownOnMap", "Not shown on map")}
        </PopoverTitle>
        <div className="max-h-60 overflow-y-auto overscroll-contain">
          {territories.map((territory) => (
            <button
              type="button"
              key={territory.id}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-accent hover:text-accent-foreground"
              onClick={(e) => handleSelect?.(territory.id, e)}
            >
              <span className="shrink-0 font-semibold">{territory.code}</span>
              <span className="min-w-0 flex-1 truncate">{territory.name}</span>
              <AggregationBadge aggregate={territory.aggregates} size="sm" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UnboundedTerritories;
