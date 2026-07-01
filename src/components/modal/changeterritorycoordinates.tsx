import NiceModal from "@ebay/nice-modal-react";
import * as m from "motion/react-m";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import {
  MapContainer,
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
import ModalSubmitButton from "../form/submit";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import CustomControl from "../map/customcontrol";
import useNotification from "../../hooks/useNotification";
import useAnalytics, { ANALYTICS_EVENTS } from "../../hooks/useAnalytics";
import { updateDataById } from "../../utils/pocketbase";
import { SearchControl } from "../map/searchcontrol";
import { MapController } from "../map/mapcontroller";
import useGeolocation from "../../hooks/useGeolocation";
import { currentLocationIcon } from "../../utils/helpers/mapicons";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import ComponentAuthorizer from "../navigation/authorizer";
import GenericButton from "../navigation/button";
import { Check, Undo2, X, Pentagon, TriangleAlert } from "lucide-react";
import { ThemedTileLayer } from "../map/themedtilelayer";
import { useIsMobile } from "../../hooks/use-mobile";

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

  const isMobile = useIsMobile();
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
        <div
          className="w-52 rounded-xl border bg-background/95 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
              {t("territory.drawBoundaryTitle", "Draw Boundary")}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                vertices.length >= 3
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {vertices.length}/{MAX_VERTICES}
            </span>
          </div>

          {/* Action buttons */}
          <div className="p-2.5 flex flex-col gap-1.5">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              disabled={vertices.length < 3}
              className="w-full h-8"
              aria-label={t("territory.completeDrawing", "Complete drawing")}
            >
              <Check className="size-3.5" />
              {t("territory.complete", "Complete")}
            </Button>

            <div className="grid grid-cols-2 gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onUndo();
                }}
                disabled={vertices.length === 0}
                className="h-8 text-xs"
                aria-label={t("territory.undoLastPoint", "Undo last point")}
              >
                <Undo2 className="size-3.5" />
                {t("common.undo", "Undo")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                aria-label={t("territory.cancelDrawing", "Cancel drawing")}
              >
                <X className="size-3.5" />
                {t("common.cancel", "Cancel")}
              </Button>
            </div>
          </div>

          {/* Hints */}
          <div className="px-2.5 pb-2.5 flex flex-col gap-1 border-t pt-2">
            {vertices.length >= MAX_VERTICES ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                <TriangleAlert className="size-3.5 shrink-0" />
                {t("territory.maxVertices", "Maximum points reached")}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-snug">
                {vertices.length === 0
                  ? t("territory.clickToAdd", "Click map to add points")
                  : vertices.length < 3
                    ? t(
                        "territory.needMorePoints",
                        "Add {{n}} more point(s) to complete",
                        { n: 3 - vertices.length }
                      )
                    : t(
                        "territory.canComplete",
                        "Double-click or press Complete"
                      )}
              </p>
            )}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 flex-wrap">
              <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono">
                ESC
              </kbd>
              <span>cancel</span>
              <span>·</span>
              <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono">
                ⌫
              </kbd>
              <span>undo</span>
              <span>·</span>
              <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono">
                ↵
              </kbd>
              <span>done</span>
            </div>
          </div>
        </div>
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
    const [vertices, setVertices] = useState<latlongInterface[]>(coordinates);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchCenter, setSearchCenter] = useState<latlongInterface | null>(
      null
    );
    const [recenterTrigger, setRecenterTrigger] = useState(0);
    const hasInitiallyRecentered = useRef(false);

    const { modal, dialogProps, contentProps } = useBaseUiDialog({
      size: "fullscreen",
      staticBackdrop: isDrawing
    });
    const { t } = useTranslation();
    const { runAction } = useNotification();
    const { trackEvent } = useAnalytics();

    const handleClose = () => {
      modal.resolve(undefined);
      modal.hide();
    };

    const mergedDialogProps = {
      ...dialogProps,
      onOpenChange: (open: boolean) => {
        if (!open && !isDrawing) {
          handleClose();
        }
      }
    };

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
      trackEvent(ANALYTICS_EVENTS.TERRITORY_BOUNDARY_DRAW_STARTED);
    };

    const handleCompleteDrawing = () => {
      setIsDrawing(false);
      trackEvent(ANALYTICS_EVENTS.TERRITORY_BOUNDARY_DRAW_COMPLETED);
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

      await runAction(
        async () => {
          await updateDataById("territories", territoryId, {
            coordinates: vertices.length >= 3 ? vertices : null
          });
          trackEvent(ANALYTICS_EVENTS.TERRITORY_BOUNDARY_SAVED, {
            point_count: vertices.length
          });
          modal.resolve(vertices);
          modal.hide();
        },
        { setLoading: setIsSaving }
      );
    };

    return (
      <Dialog {...mergedDialogProps}>
        <DialogContent {...contentProps} showCloseButton={false}>
          <form
            onSubmit={handleSave}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <DialogHeader className="flex-row items-center justify-between px-4 py-2 shrink-0 border-b">
              <DialogTitle>
                {isSelectOnly
                  ? t("territory.selectLocation", "Select Territory Location")
                  : territoryName
                    ? `${t("territory.changeBoundary", "Change Boundary")}: ${territoryName}`
                    : t("territory.setLocation", "Set Territory Location")}
              </DialogTitle>
              {!isDrawing && (
                <DialogClose
                  render={
                    <Button variant="ghost" size="icon-sm" type="button" />
                  }
                >
                  <X />
                  <span className="sr-only">Close</span>
                </DialogClose>
              )}
            </DialogHeader>
            <m.div
              className="p-0 flex-1 relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, ease: "linear", delay: 0.2 }}
            >
              <MapContainer
                center={[initialCenter.lat, initialCenter.lng]}
                zoom={17}
                style={{ height: "100%", width: "100%" }}
              >
                <ThemedTileLayer />

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
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        onClick={handleStartDrawing}
                        className="shadow-md rounded-full px-4"
                      >
                        <Pentagon className="size-4" />
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
            </m.div>
            <DialogFooter className="px-4 py-3 shrink-0 flex-row justify-around">
              <GenericButton
                variant="secondary"
                onClick={handleClose}
                label={t("common.cancel")}
              />
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
                userPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
              >
                <ModalSubmitButton
                  isSaving={isSaving}
                  disabled={vertices.length < 3}
                />
              </ComponentAuthorizer>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default ConfigureTerritoryCoordinates;
