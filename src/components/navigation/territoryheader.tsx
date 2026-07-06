import {
  GripVertical,
  List,
  LocateFixed,
  Map,
  Plus,
  TrendingUp,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "react-i18next";
import ComponentAuthorizer from "./authorizer";
import { GenericDropdownButton } from "./dropdownbutton";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { MapSortMode, territoryHeaderProp } from "../../utils/interface";
import * as m from "motion/react-m";
import { fadeSlideDown } from "@/lib/motion";

const SORT_MODE_META: Record<
  MapSortMode,
  { icon: typeof GripVertical; labelKey: string; fallback: string }
> = {
  sequence: {
    icon: GripVertical,
    labelKey: "navigation.sortSequence",
    fallback: "Sequence"
  },
  progress: {
    icon: TrendingUp,
    labelKey: "navigation.sortProgress",
    fallback: "Progress"
  },
  proximity: {
    icon: LocateFixed,
    labelKey: "navigation.sortProximity",
    fallback: "Proximity"
  }
};
const SORT_MODES = Object.keys(SORT_MODE_META) as MapSortMode[];

const TerritoryHeader = ({
  name,
  isMapView,
  isAssignmentLoading,
  hasSelectedTerritory,
  userAccessLevel,
  onToggleView,
  onGenerateLink,
  onCreateMap,
  sortMode,
  onSortModeChange,
  isLoadingLocation
}: territoryHeaderProp) => {
  const { t } = useTranslation();

  if (!name) return null;

  const sortModeLabels = Object.fromEntries(
    SORT_MODES.map((mode) => [
      mode,
      t(SORT_MODE_META[mode].labelKey, SORT_MODE_META[mode].fallback)
    ])
  ) as Record<MapSortMode, string>;
  const currentSortMode = sortMode ?? "sequence";
  const SortIcon = SORT_MODE_META[currentSortMode].icon;

  const showCreateMapAction = hasSelectedTerritory && !!onCreateMap;

  return (
    <m.div
      className="sticky top-0 z-30 flex min-h-[44px] flex-col gap-1.5 border-b border-border bg-background px-4 py-2 text-base text-foreground"
      variants={fadeSlideDown}
      initial="hidden"
      animate="show"
    >
      <span className="font-extrabold text-center">{name}</span>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onToggleView && (
            <ToggleGroup
              value={[isMapView ? "map" : "list"]}
              onValueChange={(value) => {
                if (value[0]) onToggleView();
              }}
              variant="outline"
              size="sm"
              aria-label={t("navigation.viewToggle", "View toggle")}
            >
              <ToggleGroupItem
                value="list"
                aria-label={t("navigation.listView", "List View")}
              >
                <List className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="map"
                aria-label={t("navigation.mapView", "Map View")}
              >
                <Map className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          {onSortModeChange && !isMapView && (
            <GenericDropdownButton
              align="start"
              variant="outline"
              size="sm"
              label={
                <>
                  {isLoadingLocation ? (
                    <Spinner data-icon="inline-start" aria-hidden="true" />
                  ) : (
                    <SortIcon className="size-4" />
                  )}
                  <span className="sr-only sm:not-sr-only sm:inline">
                    {sortModeLabels[currentSortMode]}
                  </span>
                </>
              }
            >
              <DropdownMenuRadioGroup
                value={currentSortMode}
                onValueChange={(value) =>
                  onSortModeChange(value as MapSortMode)
                }
              >
                {SORT_MODES.map((mode) => (
                  <DropdownMenuRadioItem key={mode} value={mode} closeOnClick>
                    {sortModeLabels[mode]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </GenericDropdownButton>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onGenerateLink && (
            <ComponentAuthorizer
              requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
              userPermission={userAccessLevel}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerateLink}
                disabled={isAssignmentLoading}
                aria-label={t("navigation.generateLink", "Quick Link")}
              >
                {isAssignmentLoading ? (
                  <Spinner aria-hidden="true" />
                ) : (
                  <Zap className="size-4" />
                )}
                {t("navigation.generateLink", "Link")}
              </Button>
            </ComponentAuthorizer>
          )}
          {showCreateMapAction && (
            <ComponentAuthorizer
              requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
              userPermission={userAccessLevel}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateMap}
                aria-label={t("map.newMap", "New Map")}
              >
                <Plus className="size-4" />
                {t("map.newMap", "Map")}
              </Button>
            </ComponentAuthorizer>
          )}
        </div>
      </div>
    </m.div>
  );
};

export default TerritoryHeader;
