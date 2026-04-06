import { lazy, use } from "react";
import {
  Offcanvas,
  ListGroup,
  ToggleButtonGroup,
  ToggleButton,
  Image,
  Spinner
} from "react-bootstrap";
import { TERRITORY_SELECTOR_VIEWPORT_HEIGHT } from "../../utils/constants";
import { TerritoryListingProps } from "../../utils/interface";
import AggregationBadge from "./aggrbadge";
import { useTranslation } from "react-i18next";
import useLocalStorage from "../../hooks/useLocalStorage";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import { ThemeContext } from "../utils/context";
import useAnalytics, { ANALYTICS_EVENTS } from "../../hooks/useAnalytics";
import SuspenseComponent from "../utils/suspense";

const TerritoryMapView = SuspenseComponent(
  lazy(() => import("./territorymapview")),
  <div className="d-flex align-items-center justify-content-center h-100">
    <Spinner animation="border" variant="secondary" size="sm" />
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
  const { actualTheme } = use(ThemeContext);
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
    <Offcanvas
      placement="bottom"
      show={showListing}
      onHide={hideFunction}
      style={{
        height: TERRITORY_SELECTOR_VIEWPORT_HEIGHT,
        borderTopLeftRadius: "1rem",
        borderTopRightRadius: "1rem"
      }}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="d-flex justify-content-between align-items-center w-100 me-3">
          <span style={{ fontSize: "1.125rem", fontWeight: "600" }}>
            {t("territory.selectTerritory")}
          </span>
          <ToggleButtonGroup
            type="radio"
            name="view-mode"
            value={viewMode}
            onChange={(value) => {
              const newView = value as "list" | "map";
              setViewMode(newView);
              trackEvent(ANALYTICS_EVENTS.TERRITORY_LIST_VIEW_TOGGLED, {
                view: newView
              });
            }}
            size="sm"
          >
            <ToggleButton
              id="view-mode-list"
              value="list"
              variant="outline-primary"
            >
              <Image
                src={getAssetUrl("list.svg")}
                alt={t("common.list", "List")}
                width={20}
                height={20}
                style={{
                  filter:
                    actualTheme === "dark" ? "brightness(0) invert(1)" : "none"
                }}
              />
            </ToggleButton>
            <ToggleButton
              id="view-mode-map"
              value="map"
              variant="outline-primary"
            >
              <Image
                src={getAssetUrl("maplocation.svg")}
                alt={t("common.map", "Map")}
                width={20}
                height={20}
                style={{
                  filter:
                    actualTheme === "dark" ? "brightness(0) invert(1)" : "none"
                }}
              />
            </ToggleButton>
          </ToggleButtonGroup>
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className={viewMode === "map" ? "p-0" : ""}>
        {viewMode === "list" ? (
          <ListGroup onSelect={handleSelect}>
            {currentTerritories && currentTerritories.length > 0 ? (
              currentTerritories.map((element) => (
                <ListGroup.Item
                  action
                  key={`list-group-item-${element.code}`}
                  eventKey={element.id}
                  className={element.code === selectedTerritory ? "active" : ""}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">
                      {element.code}: {element.name}
                    </span>
                    <AggregationBadge aggregate={element.aggregates} />
                  </div>
                </ListGroup.Item>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📍</div>
                <div className="empty-state-title">
                  {t("territory.noTerritories", "No Territories")}
                </div>
                <div className="empty-state-description">
                  {t(
                    "territory.noTerritoriesDescription",
                    "No territories available to select"
                  )}
                </div>
              </div>
            )}
          </ListGroup>
        ) : (
          <TerritoryMapView
            territories={territories}
            selectedTerritoryId={selectedTerritoryId}
            handleSelect={handleSelect}
            congregationCode={congregationCode}
          />
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default TerritoryListing;
