import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState, useEffect, useRef } from "react";
import { Image, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import CustomControl from "../map/customcontrol";
import { DESTINATION_PROXIMITY_THRESHOLD_METERS } from "../../utils/constants";
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
import RoutingService from "../map/routingservice";
import { MapController } from "../map/mapcontroller";
import { calculateDistance } from "../../utils/helpers/calculatedistance";
import getDirection from "../../utils/helpers/directiongenerator";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import useGeolocation from "../../hooks/useGeolocation";

// Minimum distance (in meters) user must move before route updates
const ROUTE_UPDATE_THRESHOLD_METERS = 20;

const GetMapGeolocation = NiceModal.create(
  ({ coordinates, name }: GetMapGeolocationModalProps) => {
    const { t } = useTranslation();
    const { notifyWarning } = useNotification();
    const [centerOverride, setCenterOverride] =
      useState<latlongInterface | null>(null);
    const [travelMode, setTravelMode] = useState<TravelMode>(() => {
      const saved = localStorage.getItem("preferredTravelMode");
      return (saved as TravelMode) || "WALKING";
    });
    const [isRouteLoading, setIsRouteLoading] = useState(false);
    const [distanceToDestination, setDistanceToDestination] = useState<
      number | null
    >(null);
    const modal = useModal();

    const [routeStartLocation, setRouteStartLocation] =
      useState<latlongInterface | null>(null);
    const lastRouteUpdateLocation = useRef<latlongInterface | null>(null);
    const isInitialMount = useRef(true);

    const { currentLocation, locationError, isSupported } = useGeolocation({
      enableWatch: true,
      watchOptions: {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000
      }
    });

    const isWithinProximity =
      distanceToDestination !== null &&
      distanceToDestination <= DESTINATION_PROXIMITY_THRESHOLD_METERS;

    const formatDistance = (meters: number): string => {
      if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
      }
      return `${Math.round(meters)} m`;
    };

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
      localStorage.setItem("preferredTravelMode", mode);
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
      <Modal {...bootstrapDialog(modal)} fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>
            {t("address.locationWithName", "{{name}} Location", { name })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="geolocation-modal-body">
          <MapContainer
            center={[coordinates.lat, coordinates.lng]}
            zoom={16}
            className="map-container"
            zoomControl={true}
            scrollWheelZoom={true}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
              <div className="map-control-button">
                <Image
                  src={getAssetUrl("gmaps.svg")}
                  alt={t("navigation.openMaps")}
                  width={24}
                  height={24}
                  onClick={() => {
                    window.open(getDirection(coordinates), "_blank");
                  }}
                />
              </div>
            </CustomControl>
            {isWithinProximity && (
              <CustomControl position="bottomleft">
                <div className="alert alert-success map-notification map-notification-arrival">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {t(
                    "location.arrivedAtDestination",
                    "You've reached your destination"
                  )}
                </div>
              </CustomControl>
            )}
            {!isWithinProximity && distanceToDestination !== null && (
              <CustomControl position="bottomright">
                <div className="alert alert-info map-notification map-notification-tracking">
                  <div className="map-notification-tracking-spinner">
                    <div
                      className="spinner-grow spinner-grow-sm text-primary"
                      role="status"
                    >
                      <span className="visually-hidden">
                        {t("navigation.updatingLocation", "Updating location")}
                      </span>
                    </div>
                  </div>
                  <div className="map-notification-tracking-content">
                    <span className="map-notification-distance">
                      {formatDistance(distanceToDestination)}
                    </span>
                    <span className="map-notification-status">
                      {t("navigation.updatingLocation", "Updating location")}
                    </span>
                  </div>
                </div>
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
        </Modal.Body>
      </Modal>
    );
  }
);

export default GetMapGeolocation;
