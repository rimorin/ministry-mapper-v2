import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState, useRef, useEffect } from "react";
import { Modal, Button, Card, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  MapContainer,
  TileLayer,
  Polygon,
  CircleMarker,
  Polyline,
  Marker,
  useMapEvents,
  useMap
} from "react-leaflet";
import { LatLngExpression, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ConfigureTerritoryCoordinatesModalProps,
  latlongInterface
} from "../../utils/interface";
import ModalFooter from "../form/footer";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import CustomControl from "../map/customcontrol";
import useNotification from "../../hooks/useNotification";
import { updateDataById } from "../../utils/pocketbase";
import { SearchControl } from "../map/searchcontrol";
import { MapController } from "../map/mapcontroller";
import useGeolocation from "../../hooks/useGeolocation";
import { currentLocationIcon } from "../../utils/helpers/mapicons";
import { MapCurrentTarget } from "../map/mapcurrenttarget";

const PRIMARY_BLUE = "#3388ff";
const VERTEX_RADIUS_MOBILE = 8;
const VERTEX_RADIUS_DESKTOP = 6;
const MAP_FITBOUNDS_PADDING = 80;
const MAP_FITBOUNDS_MAX_ZOOM = 20;

const POLYLINE_STYLE = {
  color: PRIMARY_BLUE,
  weight: 2,
  dashArray: "5, 10"
} as const;

const POLYLINE_GHOST_STYLE = {
  ...POLYLINE_STYLE,
  opacity: 0.5
} as const;

const POLYLINE_CLOSING_STYLE = {
  ...POLYLINE_STYLE,
  opacity: 0.3
} as const;

interface TerritoryPolygonDrawerProps {
  vertices: latlongInterface[];
  setVertices: (vertices: latlongInterface[]) => void;
  onComplete: () => void;
  onCancel: () => void;
  onUndo: () => void;
}

const TerritoryPolygonDrawer = ({
  vertices,
  setVertices,
  onComplete,
  onCancel,
  onUndo
}: TerritoryPolygonDrawerProps) => {
  const { t } = useTranslation();
  const [cursorPosition, setCursorPosition] = useState<latlongInterface | null>(
    null
  );
  const MAX_VERTICES = 25;

  useMapEvents({
    click(e) {
      if (vertices.length < MAX_VERTICES) {
        setVertices([...vertices, { lat: e.latlng.lat, lng: e.latlng.lng }]);
      }
    },
    dblclick(e) {
      e.originalEvent.preventDefault();
      if (vertices.length >= 2) {
        if (vertices.length < MAX_VERTICES) {
          setVertices([...vertices, { lat: e.latlng.lat, lng: e.latlng.lng }]);
        }
        setTimeout(onComplete, 100);
      }
    },
    mousemove(e) {
      if (vertices.length > 0) {
        setCursorPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    }
  });

  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px)").matches;
  const vertexRadius = isMobile ? VERTEX_RADIUS_MOBILE : VERTEX_RADIUS_DESKTOP;

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault(); // Prevent modal from closing
        onCancel();
      } else if (e.key === "Backspace" && vertices.length > 0) {
        e.preventDefault();
        onUndo();
      } else if (e.key === "Enter" && vertices.length >= 3) {
        onComplete();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [vertices, onCancel, onUndo, onComplete]);

  return (
    <>
      {/* Vertex markers */}
      {vertices.map((vertex, index) => (
        <CircleMarker
          key={`vertex-${index}`}
          center={[vertex.lat, vertex.lng]}
          radius={vertexRadius}
          pathOptions={{
            color: PRIMARY_BLUE,
            fillColor: PRIMARY_BLUE,
            fillOpacity: 0.8,
            weight: 2
          }}
        />
      ))}

      {/* Connecting lines between vertices */}
      {vertices.length > 1 && (
        <Polyline
          positions={vertices.map((v) => [v.lat, v.lng] as LatLngExpression)}
          pathOptions={POLYLINE_STYLE}
        />
      )}

      {/* Ghost line from last vertex to cursor */}
      {vertices.length > 0 && cursorPosition && (
        <Polyline
          positions={[
            [
              vertices[vertices.length - 1].lat,
              vertices[vertices.length - 1].lng
            ],
            [cursorPosition.lat, cursorPosition.lng]
          ]}
          pathOptions={POLYLINE_GHOST_STYLE}
        />
      )}

      {/* Closing line preview when enough vertices */}
      {vertices.length >= 3 && cursorPosition && (
        <Polyline
          positions={[
            [cursorPosition.lat, cursorPosition.lng],
            [vertices[0].lat, vertices[0].lng]
          ]}
          pathOptions={POLYLINE_CLOSING_STYLE}
        />
      )}

      <CustomControl position="topleft">
        <Card
          className="map-control-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <Card.Body>
            <div className="d-flex flex-column gap-2">
              <Button
                size="sm"
                variant="success"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                disabled={vertices.length < 3}
                className="w-100"
                aria-label={t("territory.completeDrawing", "Complete drawing")}
              >
                <i className="bi bi-check-circle me-2"></i>
                {t("territory.complete", "Complete")} ({vertices.length})
              </Button>
              <Button
                size="sm"
                variant="warning"
                onClick={(e) => {
                  e.stopPropagation();
                  onUndo();
                }}
                disabled={vertices.length === 0}
                className="w-100"
                aria-label={t("territory.undoLastPoint", "Undo last point")}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                {t("common.undo", "Undo")}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="w-100"
                aria-label={t("territory.cancelDrawing", "Cancel drawing")}
              >
                <i className="bi bi-x-circle me-2"></i>
                {t("common.cancel", "Cancel")}
              </Button>
            </div>
            <div className="mt-2 small text-muted">
              <div>{t("territory.clickToAdd", "Click map to add points")}</div>
              <div>
                {t("territory.doubleClickFinish", "Double-click to finish")}
              </div>
              <div>
                {t("territory.pointsRange", "Min 3, max {{max}} points", {
                  max: MAX_VERTICES
                })}
              </div>
              <div
                className="mt-1"
                style={{ fontFamily: "monospace", fontSize: "0.85em" }}
              >
                <kbd
                  style={{
                    padding: "2px 4px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "3px"
                  }}
                >
                  ESC
                </kbd>
                : {t("common.cancel", "Cancel")} |{" "}
                <kbd
                  style={{
                    padding: "2px 4px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "3px"
                  }}
                >
                  ⌫
                </kbd>
                : {t("common.undo", "Undo")} |{" "}
                <kbd
                  style={{
                    padding: "2px 4px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "3px"
                  }}
                >
                  ↵
                </kbd>
                : {t("territory.complete", "Complete")}
              </div>
            </div>
            {vertices.length >= MAX_VERTICES && (
              <div className="mt-2 small text-warning">
                <i className="bi bi-exclamation-triangle me-1"></i>
                {t("territory.maxVertices", "Maximum points reached")}
              </div>
            )}
          </Card.Body>
        </Card>
      </CustomControl>
    </>
  );
};

const FitBoundsToExistingPolygon = ({
  vertices
}: {
  vertices: latlongInterface[];
}) => {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (!vertices || vertices.length < 3 || hasFitted.current) return;

    const bounds = new LatLngBounds(
      vertices.map((v) => [v.lat, v.lng] as [number, number])
    );

    map.fitBounds(bounds, {
      padding: [MAP_FITBOUNDS_PADDING, MAP_FITBOUNDS_PADDING],
      maxZoom: MAP_FITBOUNDS_MAX_ZOOM
    });
    hasFitted.current = true;
  }, [vertices, map]);

  return null;
};

const ConfigureTerritoryCoordinates = NiceModal.create(
  ({
    territoryId,
    territoryName = "",
    coordinates = [],
    origin,
    isSelectOnly = false
  }: ConfigureTerritoryCoordinatesModalProps) => {
    const { t } = useTranslation();
    const { notifyError } = useNotification();
    const modal = useModal();

    const [vertices, setVertices] = useState<latlongInterface[]>(coordinates);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchCenter, setSearchCenter] = useState<latlongInterface | null>(
      null
    );
    const [recenterTrigger, setRecenterTrigger] = useState(0);
    const hasInitiallyRecentered = useRef(false);

    // Use universal map centering hook
    const { center: initialCenter, currentLocation } = useGeolocation({
      coordinates
    });

    useEffect(() => {
      if (
        (!coordinates || coordinates.length === 0) &&
        currentLocation &&
        !hasInitiallyRecentered.current
      ) {
        setSearchCenter(currentLocation);
        setRecenterTrigger((prev) => prev + 1);
        hasInitiallyRecentered.current = true;
      }
    }, [currentLocation, coordinates]);

    const mapCenter = searchCenter;

    const handleStartDrawing = () => {
      setVertices([]);
      setIsDrawing(true);
    };

    const handleCompleteDrawing = () => {
      setIsDrawing(false);
    };

    const handleCancelDrawing = () => {
      setVertices(coordinates);
      setIsDrawing(false);
    };

    const handleUndo = () => {
      setVertices(vertices.slice(0, -1));
    };

    const handleSave = async (event: React.FormEvent<HTMLElement>) => {
      event.preventDefault();

      if (isSelectOnly) {
        modal.resolve(vertices);
        modal.hide();
        return;
      }

      if (!territoryId) {
        modal.resolve(vertices);
        modal.hide();
        return;
      }

      setIsSaving(true);
      try {
        await updateDataById("territories", territoryId, {
          coordinates: vertices.length >= 3 ? vertices : null
        });
        modal.resolve(vertices);
        modal.hide();
      } catch (error) {
        notifyError(error);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <Modal
        {...bootstrapDialog(modal)}
        onHide={() => {
          modal.resolve(undefined);
          modal.remove();
        }}
        keyboard={!isDrawing}
        fullscreen
      >
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title>
              {isSelectOnly
                ? t("territory.selectLocation", "Select Territory Location")
                : territoryName
                  ? `${t("territory.changeLocation", "Change Location")}: ${territoryName}`
                  : t("territory.setLocation", "Set Territory Location")}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            <MapContainer
              center={[initialCenter.lat, initialCenter.lng]}
              zoom={17}
              style={{ height: "calc(100vh - 120px)", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Search control for location search */}
              <SearchControl
                onLocationSelect={(location) => {
                  setSearchCenter(location);
                  setRecenterTrigger((prev) => prev + 1);
                }}
                origin={origin}
              />

              {/* Device location marker - only show for new polygons */}
              {currentLocation && vertices.length < 3 && (
                <Marker
                  position={[currentLocation.lat, currentLocation.lng]}
                  icon={currentLocationIcon}
                />
              )}

              {/* Recenter to device location button */}
              {currentLocation && !isDrawing && vertices.length < 3 && (
                <CustomControl position="topright">
                  <MapCurrentTarget
                    onClick={() => {
                      setSearchCenter(currentLocation);
                      setRecenterTrigger((prev) => prev + 1);
                    }}
                  />
                </CustomControl>
              )}

              {/* Smoothly recenter when device location loads or search is used */}
              {!isDrawing && vertices.length < 3 && (
                <MapController
                  center={mapCenter}
                  zoomLevel={17}
                  trigger={recenterTrigger}
                />
              )}

              {!isDrawing && vertices.length >= 3 && (
                <FitBoundsToExistingPolygon vertices={vertices} />
              )}

              {!isDrawing && vertices.length >= 3 && (
                <Polygon
                  positions={vertices.map(
                    (v) => [v.lat, v.lng] as LatLngExpression
                  )}
                  pathOptions={{
                    color: PRIMARY_BLUE,
                    fillColor: PRIMARY_BLUE,
                    fillOpacity: 0.3,
                    weight: 2
                  }}
                />
              )}

              {isDrawing && (
                <TerritoryPolygonDrawer
                  vertices={vertices}
                  setVertices={setVertices}
                  onComplete={handleCompleteDrawing}
                  onCancel={handleCancelDrawing}
                  onUndo={handleUndo}
                />
              )}

              {!isDrawing && (
                <CustomControl position="bottomleft">
                  <div
                    className="bg-white p-2 rounded shadow"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleStartDrawing}
                      className="w-100"
                    >
                      <i className="bi bi-pentagon me-2"></i>
                      {vertices.length >= 3
                        ? t("territory.redrawBoundary", "Redraw Boundary")
                        : t(
                            "territory.drawBoundary",
                            "Draw Territory Boundary"
                          )}
                    </Button>
                  </div>
                </CustomControl>
              )}
            </MapContainer>
          </Modal.Body>
          <ModalFooter
            handleClick={() => {
              modal.resolve(undefined);
              modal.hide();
            }}
            userAccessLevel={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
            isSaving={isSaving}
            disableSubmitBtn={vertices.length < 3}
          />
        </Form>
      </Modal>
    );
  }
);

export default ConfigureTerritoryCoordinates;
