import { useState, Fragment, use, useRef, useEffect } from "react";
import {
  Offcanvas,
  ListGroup,
  ToggleButtonGroup,
  ToggleButton,
  Image
} from "react-bootstrap";
import { MapContainer, TileLayer, Polygon, Marker } from "react-leaflet";
import L, { LatLngExpression, LatLngBounds } from "leaflet";
import {
  TERRITORY_SELECTOR_VIEWPORT_HEIGHT,
  DEFAULT_COORDINATES
} from "../../utils/constants";
import {
  TerritoryListingProps,
  territoryDetails,
  latlongInterface
} from "../../utils/interface";
import AggregationBadge from "./aggrbadge";
import { useTranslation } from "react-i18next";
import {
  getPolygonCenter,
  isValidCoordinate
} from "../../utils/helpers/maphelpers";
import { currentLocationIcon } from "../../utils/helpers/mapicons";
import { MapController } from "../map/mapcontroller";
import CustomControl from "../map/customcontrol";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import useLocalStorage from "../../hooks/useLocalStorage";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import { ThemeContext } from "../utils/context";
import useGeolocation from "../../hooks/useGeolocation";
import "leaflet/dist/leaflet.css";

const DEFAULT_MAP_ZOOM =
  typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 17;

const POLYGON_OPACITY = {
  selected: 0.5,
  hovered: 0.4,
  default: 0.3
} as const;

const POLYGON_WEIGHT = {
  selected: 4,
  hovered: 3,
  default: 2.5
} as const;

const getColorForTerritory = (index: number, total: number) => {
  const hue = (360 / total) * index;
  const saturation = 75;
  const lightness = 55;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const getProgressColor = (aggregate: number): string => {
  if (aggregate > 90) return "#dc3545";
  if (aggregate > 70) return "#fd7e14";
  return "#198754";
};

const calculateFontSize = (
  text: string,
  availableWidth: number,
  maxSize: number,
  minSize: number
): number => {
  const pixelsPerChar = 8;
  const estimatedWidth = text.length * pixelsPerChar;
  const scaleFactor = availableWidth / estimatedWidth;
  const calculatedSize = 12 * scaleFactor;
  return Math.max(minSize, Math.min(maxSize, calculatedSize));
};

const getPolygonWidthInPixels = (
  coordinates: Array<{ lat: number; lng: number }>
): number => {
  if (!coordinates || coordinates.length === 0) return 150;

  const bounds = new LatLngBounds(
    coordinates.map((coord) => [coord.lat, coord.lng])
  );
  const latWidth = bounds.getNorthEast().lat - bounds.getSouthWest().lat;
  const lngWidth = bounds.getNorthEast().lng - bounds.getSouthWest().lng;
  const avgWidthInDegrees = Math.max(latWidth, lngWidth);
  const widthInMeters = avgWidthInDegrees * 111000;
  const widthInPixels = (widthInMeters / 1000) * 100;

  return widthInPixels;
};

const createLabelIcon = (
  territory: territoryDetails,
  color: string,
  isSelected: boolean,
  coordinates: Array<{ lat: number; lng: number }>
) => {
  const polygonWidthPx = getPolygonWidthInPixels(coordinates);
  const codeAvailableWidth = polygonWidthPx * 0.6;
  const codeFontSize = calculateFontSize(
    territory.code,
    codeAvailableWidth,
    22,
    14
  );
  const percentFontSize = Math.max(10, codeFontSize * 0.65);
  const codeSize = isSelected ? Math.min(codeFontSize * 1.1, 24) : codeFontSize;
  const percentSize = isSelected
    ? Math.min(percentFontSize * 1.1, 14)
    : percentFontSize;
  const progressColor = getProgressColor(territory.aggregates || 0);

  return L.divIcon({
    className: "territory-label-icon",
    html: `
      <div style="
        text-align: center;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          font-size: ${codeSize}px;
          font-weight: 800;
          color: ${color};
          text-shadow: 
            -2px -2px 0 #000,
            2px -2px 0 #000,
            -2px 2px 0 #000,
            2px 2px 0 #000,
            -2px 0 0 #000,
            2px 0 0 #000,
            0 -2px 0 #000,
            0 2px 0 #000,
            0 0 4px #000,
            0 0 8px #000;
          margin-bottom: 4px;
          letter-spacing: 1px;
        ">${territory.code}</div>
        <div style="
          font-size: ${percentSize}px;
          font-weight: 700;
          color: ${progressColor};
          background-color: rgba(255, 255, 255, 0.95);
          padding: 2px 8px;
          border-radius: 12px;
          display: inline-block;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        ">${territory.aggregates || 0}%</div>
      </div>
    `,
    iconSize: [Math.min(codeAvailableWidth, 200), 60],
    iconAnchor: [Math.min(codeAvailableWidth, 200) / 2, 30]
  });
};

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
  const [viewMode, setViewMode] = useLocalStorage<"list" | "map">(
    "territoryViewMode",
    "list"
  );
  const [cachedMapState, setCachedMapState] = useLocalStorage<{
    center: [number, number];
    congregationId: string;
  } | null>(`territoryMapViewState_${congregationCode || "default"}`, null);
  const [hoveredTerritoryId, setHoveredTerritoryId] = useState<
    string | undefined
  >();
  const { currentLocation } = useGeolocation({
    skipGeolocation: viewMode !== "map"
  });

  // Trigger for programmatic map centering (e.g., "center to my location" button)
  // Set to coordinates to trigger pan, then reset to null to allow manual panning
  const [centerToLocation, setCenterToLocation] =
    useState<latlongInterface | null>(null);

  // Debounce timer for caching map position (prevents excessive saves during panning)
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const currentTerritories = !territories
    ? undefined
    : hideSelectedTerritory
      ? territories.filter((element) => element.code !== selectedTerritory)
      : territories;

  const territoriesWithCoordinates =
    territories?.filter(
      (territory) =>
        territory.coordinates &&
        Array.isArray(territory.coordinates) &&
        territory.coordinates.length >= 3
    ) || [];

  const territoriesWithoutCoordinates = territories?.length
    ? territories.length - territoriesWithCoordinates.length
    : 0;

  const defaultCenter: [number, number] = [
    DEFAULT_COORDINATES.Singapore.lat,
    DEFAULT_COORDINATES.Singapore.lng
  ];

  const getMapCenter = (): [number, number] => {
    if (
      cachedMapState &&
      cachedMapState.congregationId === congregationCode &&
      cachedMapState.center
    ) {
      return cachedMapState.center;
    }

    if (territoriesWithCoordinates.length === 0) return defaultCenter;

    const firstTerritory = territoriesWithCoordinates[0];
    if (firstTerritory.coordinates && firstTerritory.coordinates.length >= 3) {
      const validCoords = firstTerritory.coordinates.filter(isValidCoordinate);
      if (validCoords.length >= 3) {
        return getPolygonCenter(validCoords);
      }
    }

    return defaultCenter;
  };

  const mapCenter = getMapCenter();

  // Cache map position after 500ms of inactivity (debounced to reduce storage writes)
  const handleMapCenterChange = (center: latlongInterface) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setCachedMapState({
        center: [center.lat, center.lng],
        congregationId: congregationCode || "default"
      });
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
            onChange={(value) => setViewMode(value as "list" | "map")}
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
          <div style={{ height: "100%", width: "100%" }}>
            {territoriesWithCoordinates.length > 0 ? (
              <MapContainer
                center={mapCenter}
                zoom={DEFAULT_MAP_ZOOM}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* MapController for centering to current location */}
                <MapController
                  center={centerToLocation}
                  zoomLevel={DEFAULT_MAP_ZOOM}
                  onCenterChange={(center) => {
                    // Reset trigger after move completes to allow manual panning to be cached
                    setCenterToLocation(null);
                    handleMapCenterChange(center);
                  }}
                />

                {/* Current location marker and target button */}
                {currentLocation && (
                  <>
                    <Marker
                      position={[currentLocation.lat, currentLocation.lng]}
                      icon={currentLocationIcon}
                    />
                    <CustomControl position="topright">
                      <MapCurrentTarget
                        onClick={() => {
                          // Trigger map pan to current location and cache the position
                          setCenterToLocation({ ...currentLocation });
                          handleMapCenterChange(currentLocation);
                        }}
                      />
                    </CustomControl>
                  </>
                )}

                {/* Territory count indicator */}
                {territoriesWithoutCoordinates > 0 && (
                  <CustomControl position="bottomright">
                    <div className="alert alert-warning map-notification mb-0">
                      <span style={{ color: "red", fontWeight: "600" }}>
                        {territoriesWithoutCoordinates}
                      </span>{" "}
                      {t("territory.withoutBoundaries", "without boundaries")}
                    </div>
                  </CustomControl>
                )}

                {territoriesWithCoordinates.map((territory, index) => {
                  const isSelected = territory.id === selectedTerritoryId;
                  const isHovered = territory.id === hoveredTerritoryId;
                  const color = getColorForTerritory(
                    index,
                    territoriesWithCoordinates.length
                  );

                  const validCoordinates = territory.coordinates!.filter(
                    (coord) =>
                      coord &&
                      typeof coord.lat === "number" &&
                      typeof coord.lng === "number"
                  );

                  if (validCoordinates.length < 3) return null;

                  const center = getPolygonCenter(validCoordinates);

                  return (
                    <Fragment key={territory.id}>
                      <Polygon
                        positions={validCoordinates.map(
                          (coord) => [coord.lat, coord.lng] as LatLngExpression
                        )}
                        pathOptions={{
                          color: color,
                          fillColor: color,
                          fillOpacity: isSelected
                            ? POLYGON_OPACITY.selected
                            : isHovered
                              ? POLYGON_OPACITY.hovered
                              : POLYGON_OPACITY.default,
                          weight: isSelected
                            ? POLYGON_WEIGHT.selected
                            : isHovered
                              ? POLYGON_WEIGHT.hovered
                              : POLYGON_WEIGHT.default,
                          opacity: 1
                        }}
                        eventHandlers={{
                          mouseover: () => setHoveredTerritoryId(territory.id),
                          mouseout: () => setHoveredTerritoryId(undefined),
                          click: () => {
                            if (handleSelect) {
                              handleSelect(
                                territory.id,
                                {} as React.SyntheticEvent
                              );
                            }
                          }
                        }}
                      />
                      <Marker
                        position={center}
                        icon={createLabelIcon(
                          territory,
                          color,
                          isSelected,
                          validCoordinates
                        )}
                        interactive={false}
                      />
                    </Fragment>
                  );
                })}
              </MapContainer>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100">
                <div className="empty-state">
                  <div className="empty-state-icon">🗺️</div>
                  <div className="empty-state-title">
                    {t(
                      "territory.noTerritoryCoordinates",
                      "No Territory Boundaries"
                    )}
                  </div>
                  <div className="empty-state-description">
                    {t(
                      "territory.noTerritoryCoordinatesDescription",
                      "Use 'Change Location' in the Territory menu to draw territory boundaries."
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default TerritoryListing;
