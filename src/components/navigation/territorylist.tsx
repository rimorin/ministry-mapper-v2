import { lazy } from "react";
import { cn } from "@/lib/utils";
import { List, Map, MapPin, X } from "lucide-react";
import * as m from "motion/react-m";
import { fadeIn, staggerContainer } from "@/lib/motion";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { TerritoryListingProps } from "../../utils/interface";
import AggregationBadge from "./aggrbadge";
import { useTranslation } from "react-i18next";
import useLocalStorage from "../../hooks/useLocalStorage";
import useAnalytics, { ANALYTICS_EVENTS } from "../../hooks/useAnalytics";
import SuspenseComponent from "../utils/suspense";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";

const TerritoryMapView = SuspenseComponent(
  lazy(() => import("./territorymapview")),
  <div className="flex items-center justify-center h-full">
    <Spinner aria-hidden="true" className="text-secondary" />
  </div>
);

const TerritoryListing = ({
  showListing,
  hideFunction,
  selectedTerritory,
  selectedTerritoryId,
  handleSelect,
  territories,
  hideSelectedTerritory = false,
  congregationCode
}: TerritoryListingProps) => {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();

  const [viewMode, setViewMode] = useLocalStorage<"list" | "map">(
    "territoryViewMode",
    "list"
  );

  const currentTerritories = !territories
    ? undefined
    : hideSelectedTerritory
      ? territories.filter((element) => element.code !== selectedTerritory)
      : territories;

  return (
    <Sheet open={showListing} onOpenChange={(open) => !open && hideFunction()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-[100dvh] gap-0 overflow-hidden p-0 sm:h-[85dvh] sm:rounded-t-2xl"
      >
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="fluid-text font-bold text-left">
              {t("territory.selectTerritory")}
            </SheetTitle>
            <div className="flex items-center gap-2">
              <ToggleGroup
                value={[viewMode]}
                onValueChange={(values) => {
                  const v = values[values.length - 1];
                  if (!v) return;
                  const newView = v as "list" | "map";
                  setViewMode(newView);
                  trackEvent(ANALYTICS_EVENTS.TERRITORY_LIST_VIEW_TOGGLED, {
                    view: newView
                  });
                }}
                size="sm"
                variant="outline"
              >
                <ToggleGroupItem
                  value="list"
                  aria-label={t("common.list", "List")}
                >
                  <List className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="map"
                  aria-label={t("common.map", "Map")}
                >
                  <Map className="size-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              <SheetClose
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                  />
                }
              >
                <X className="size-4" />
              </SheetClose>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea
          withFade
          className={
            viewMode === "map" ? "min-h-0 flex-1 p-0" : "min-h-0 flex-1"
          }
        >
          {viewMode === "list" ? (
            currentTerritories && currentTerritories.length > 0 ? (
              <m.div
                className="divide-y"
                variants={staggerContainer(0.04)}
                initial="hidden"
                animate="show"
              >
                {currentTerritories.map((element) => {
                  const isSelected = element.code === selectedTerritory;
                  return (
                    <m.button
                      type="button"
                      key={`list-group-item-${element.code}`}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 border-l-[3px] px-4 py-3.5 text-left transition-colors",
                        isSelected
                          ? "border-l-primary bg-primary/10 text-primary"
                          : "border-l-transparent hover:bg-accent hover:text-accent-foreground"
                      )}
                      style={
                        isSelected
                          ? { paddingLeft: "calc(1rem - 3px)" }
                          : undefined
                      }
                      variants={fadeIn}
                      onClick={(e) => handleSelect?.(element.id, e)}
                    >
                      <span className="min-w-0 truncate font-semibold">
                        {element.code}: {element.name}
                      </span>
                      <AggregationBadge aggregate={element.aggregates} />
                    </m.button>
                  );
                })}
              </m.div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <MapPin className="size-8 opacity-40" />
                <span className="text-sm">
                  {t("territory.noTerritories", "No Territories")}
                </span>
              </div>
            )
          ) : (
            <TerritoryMapView
              territories={territories}
              selectedTerritoryId={selectedTerritoryId}
              handleSelect={handleSelect}
              congregationCode={congregationCode}
            />
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default TerritoryListing;
