import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker } from "react-leaflet";
import { Car, Footprints } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CustomControl from "./customcontrol";
import { ThemedTileLayer } from "./themedtilelayer";
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
import { latlongInterface, TravelMode } from "../../utils/interface";
import { MapCurrentTarget } from "./mapcurrenttarget";
import TravelModeButtons from "./travelmodebtn";
import useNotification from "../../hooks/useNotification";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";
import RoutingService from "./routingservice";
import { MapController } from "./mapcontroller";
import { calculateDistance } from "../../utils/helpers/calculatedistance";
import getDirection from "../../utils/helpers/directiongenerator";
import useGeolocation from "../../hooks/useGeolocation";
import { formatDistance, formatDuration } from "../../utils/helpers/maphelpers";

// Minimum distance (in meters) user must move before route updates
const ROUTE_UPDATE_THRESHOLD_METERS = 20;

interface DirectionsMapProps {
  coordinates: latlongInterface;
}

/**
 * A live route from the user's location to a destination, with travel modes,
 * hand-offs to Google Maps and Waze, and an arrival notice. Fills its parent,
 * which must have a height. Shared by the location modal and the assistant.
 */
const DirectionsMap = ({ coordinates }: DirectionsMapProps) => {
  const { t } = useTranslation();
  const { notifyWarning } = useNotification();
  const [centerOverride, setCenterOverride] = useState<latlongInterface | null>(
    null
  );
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
              trackEvent(ANALYTICS_EVENTS.DIRECTIONS_OPENED, {
                provider: "google-maps"
              });
              window.open(getDirection(coordinates), "_blank");
            }}
          >
            <img src={getAssetUrl("gmaps.svg")} className="h-6 w-6" alt="" />
          </button>
          <button
            type="button"
            aria-label="Waze"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2.5 hover:bg-muted transition-colors"
            onClick={() => {
              trackEvent(ANALYTICS_EVENTS.DIRECTIONS_OPENED, {
                provider: "waze"
              });
              window.open(getWazeDirection(coordinates), "_blank");
            }}
          >
            <img src={getAssetUrl("waze.svg")} className="h-6 w-6" alt="" />
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
  );
};

export default DirectionsMap;
