import { List, Map, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "react-i18next";
import ComponentAuthorizer from "./authorizer";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import { territoryHeaderProp } from "../../utils/interface";
import * as m from "motion/react-m";
import { fadeSlideDown } from "@/lib/motion";

const TerritoryHeader = ({
  name,
  isMapView,
  isAssignmentLoading,
  hasSelectedTerritory,
  userAccessLevel,
  onToggleView,
  onGenerateLink,
  onCreateMap
}: territoryHeaderProp) => {
  const { t } = useTranslation();

  if (!name) return null;

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
