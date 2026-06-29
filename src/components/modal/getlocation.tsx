import NiceModal from "@ebay/nice-modal-react";
import * as m from "motion/react-m";
import { useState, useEffect, useRef } from "react";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XIcon, Car, Footprints } from "lucide-react";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker } from "react-leaflet";
import CustomControl from "../map/customcontrol";
import { ThemedTileLayer } from "../map/themedtilelayer";
import {
  DESTINATION_PROXIMITY_THRESHOLD_METERS,
  PREFERRED_TRAVEL_MODE_KEY
} from "../../utils/constants";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import getWazeDirection from "../../utils/helpers/wazegenerator";
import {
  currentLocationIcon,
  destinationIcon
} from "../../utils/helpers/mapicons";
import {
  GetMapGeolocationModalProps,
  latlongInterface,
  TravelMode
} from "../../utils/interface";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import TravelModeButtons from "../map/travelmodebtn";
import useNotification from "../../hooks/useNotification";
import useAnalytics, { ANALYTICS_EVENTS } from "../../hooks/useAnalytics";
import RoutingService from "../map/routingservice";
import { MapController } from "../map/mapcontroller";
import { calculateDistance } from "../../utils/helpers/calculatedistance";
import getDirection from "../../utils/helpers/directiongenerator";
import useGeolocation from "../../hooks/useGeolocation";
import { formatDistance, formatDuration } from "../../utils/helpers/maphelpers";

// Minimum distance (in meters) user must move before route updates
const ROUTE_UPDATE_THRESHOLD_METERS = 20;

const GetMapGeolocation = NiceModal.create(
  ({ coordinates, name }: GetMapGeolocationModalProps) => {
    const { dialogProps, contentProps } = useBaseUiDialog({
      size: "fullscreen"
    });
    const { t } = useTranslation();
    const { notifyWarning } = useNotification();
    const { trackEvent } = useAnalytics();
    const [centerOverride, setCenterOverride] =
      useState<latlongInterface | null>(null);
    const [travelMode, setTravelMode] = useState<TravelMode>(() => {
      const saved = localStorage.getItem(PREFERRED_TRAVEL_MODE_KEY);
      return (saved as TravelMode) || "WALKING";
    });
    const [isRouteLoading, setIsRouteLoading] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{
      duration: number;
      distance: number;
    } | null>(null);
    const [distanceToDestination, setDistanceToDestination] = useState<
      number | null
    >(null);

    const [routeStartLocation, setRouteStartLocation] =
      useState<latlongInterface | null>(null);
    const lastRouteUpdateLocation = useRef<latlongInterface | null>(null);
    const isInitialMount = useRef(true);

    const isWithinProximity =
      distanceToDestination !== null &&
      distanceToDestination <= DESTINATION_PROXIMITY_THRESHOLD_METERS;

    const { currentLocation, locationError, isSupported } = useGeolocation({
      enableWatch: true,
      watchOptions: {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000
      }
    });

    useEffect(() => {
      if (!isSupported) {
        notifyWarning(
          t(
            "errors.geolocationNotSupported",
            "Geolocation is not supported by your browser"
          )
        );
      }
    }, [isSupported, notifyWarning, t]);

    useEffect(() => {
      if (locationError) {
        notifyWarning(
          t(
            "errors.unableToGetLocation",
            "Unable to get your current location. Please check your browser settings."
          )
        );
      }
    }, [locationError, notifyWarning, t]);

    useEffect(() => {
      if (currentLocation) {
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          coordinates.lat,
          coordinates.lng
        );
        setDistanceToDestination(distance);
        if (distance <= DESTINATION_PROXIMITY_THRESHOLD_METERS) {
          setRouteInfo(null);
        }

        if (!lastRouteUpdateLocation.current) {
          setRouteStartLocation(currentLocation);
          lastRouteUpdateLocation.current = currentLocation;
        } else {
          const distanceMoved = calculateDistance(
            lastRouteUpdateLocation.current.lat,
            lastRouteUpdateLocation.current.lng,
            currentLocation.lat,
            currentLocation.lng
          );

          if (distanceMoved >= ROUTE_UPDATE_THRESHOLD_METERS) {
            setRouteStartLocation(currentLocation);
            lastRouteUpdateLocation.current = currentLocation;
          }
        }
      }
    }, [currentLocation, coordinates]);

    const handleTravelModeChange = (mode: TravelMode) => {
      setTravelMode(mode);
      localStorage.setItem(PREFERRED_TRAVEL_MODE_KEY, mode);
      trackEvent(ANALYTICS_EVENTS.TRAVEL_MODE_CHANGED, { mode });
    };

    useEffect(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      if (lastRouteUpdateLocation.current) {
        setRouteStartLocation(lastRouteUpdateLocation.current);
      }
    }, [travelMode]);

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader className="flex-row items-center justify-between px-4 pt-4 pb-3 shrink-0 border-b gap-2">
            <DialogTitle className="truncate">
              {t("address.locationWithName", "{{name}} Location", { name })}
            </DialogTitle>
            <DialogClose
              render={
                <Button variant="ghost" size="icon-sm" className="shrink-0" />
              }
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          <m.div
            className="geolocation-modal-body flex-1 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "linear", delay: 0.2 }}
          >
            <MapContainer
              center={[coordinates.lat, coordinates.lng]}
              zoom={16}
              className="map-container"
              zoomControl={true}
              scrollWheelZoom={true}
            >
              <ThemedTileLayer />
              <MapController center={centerOverride} zoomLevel={16} />
              {currentLocation && (
                <>
                  <Marker
                    position={[currentLocation.lat, currentLocation.lng]}
                    icon={currentLocationIcon}
                  />
                  {!isWithinProximity && routeStartLocation && (
                    <RoutingService
                      start={routeStartLocation}
                      end={coordinates}
                      travelMode={travelMode}
                      onLoadingChange={setIsRouteLoading}
                      onRouteData={setRouteInfo}
                    />
                  )}
                </>
              )}
              <Marker
                position={[coordinates.lat, coordinates.lng]}
                icon={destinationIcon}
              />
              {currentLocation && (
                <CustomControl position="topright">
                  <MapCurrentTarget
                    onClick={() => setCenterOverride({ ...currentLocation })}
                  />
                </CustomControl>
              )}
              <CustomControl position="topright">
                <div className="flex flex-col overflow-hidden rounded-xl border bg-background/95 shadow-md divide-y divide-border">
                  <button
                    type="button"
                    aria-label={t("navigation.openMaps")}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2.5 hover:bg-muted transition-colors"
                    onClick={() => {
                      trackEvent(ANALYTICS_EVENTS.DIRECTIONS_OPENED);
                      window.open(getDirection(coordinates), "_blank");
                    }}
                  >
                    <img
                      src={getAssetUrl("gmaps.svg")}
                      className="h-6 w-6"
                      alt=""
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Waze"
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2.5 hover:bg-muted transition-colors"
                    onClick={() => {
                      trackEvent(ANALYTICS_EVENTS.DIRECTIONS_OPENED);
                      window.open(getWazeDirection(coordinates), "_blank");
                    }}
                  >
                    <img
                      src={getAssetUrl("waze.svg")}
                      className="h-6 w-6"
                      alt=""
                    />
                  </button>
                </div>
              </CustomControl>
              {isWithinProximity && (
                <CustomControl position="bottomleft">
                  <Alert variant="success">
                    <AlertDescription>
                      {t(
                        "location.arrivedAtDestination",
                        "You've reached your destination"
                      )}
                    </AlertDescription>
                  </Alert>
                </CustomControl>
              )}
              {!isWithinProximity && distanceToDestination !== null && (
                <CustomControl position="bottomright">
                  {routeInfo ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-full border shadow-md px-4 py-2 flex items-center gap-2">
                      {travelMode === "DRIVING" ? (
                        <Car className="size-4 text-muted-foreground shrink-0" />
                      ) : (
                        <Footprints className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm font-bold tabular-nums">
                        {formatDuration(routeInfo.duration)}
                      </span>
                      <span className="text-muted-foreground text-sm">·</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistance(routeInfo.distance)}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-full border shadow-md px-4 py-2 flex items-center gap-2">
                      <Spinner
                        aria-label={t(
                          "navigation.updatingLocation",
                          "Updating location"
                        )}
                        className="text-primary size-3.5 shrink-0"
                      />
                      <span className="text-sm font-semibold tabular-nums">
                        {formatDistance(distanceToDestination)}
                      </span>
                    </div>
                  )}
                </CustomControl>
              )}
              {!isWithinProximity && (
                <CustomControl position="bottomleft">
                  <TravelModeButtons
                    travelMode={travelMode}
                    onTravelModeChange={handleTravelModeChange}
                    isLoading={isRouteLoading}
                  />
                </CustomControl>
              )}
            </MapContainer>
          </m.div>
        </DialogContent>
      </Dialog>
    );
  }
);

export default GetMapGeolocation;
