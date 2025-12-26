import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState, useEffect } from "react";
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

const GetMapGeolocation = NiceModal.create(
  ({ coordinates, name }: GetMapGeolocationModalProps) => {
    const { t } = useTranslation();
    const { notifyWarning } = useNotification();
    const [centerOverride, setCenterOverride] =
      useState<latlongInterface | null>(null);
    const [currentLocation, setCurrentLocation] = useState<latlongInterface>();
    const [travelMode, setTravelMode] = useState<TravelMode>(() => {
      const saved = localStorage.getItem("preferredTravelMode");
      return (saved as TravelMode) || "WALKING";
    });
    const [isRouteLoading, setIsRouteLoading] = useState(false);
    const [distanceToDestination, setDistanceToDestination] = useState<
      number | null
    >(null);
    const modal = useModal();

    const isWithinProximity =
      distanceToDestination !== null &&
      distanceToDestination <= DESTINATION_PROXIMITY_THRESHOLD_METERS;

    useEffect(() => {
      if (!navigator.geolocation) {
        notifyWarning(
          t(
            "errors.geolocationNotSupported",
            "Geolocation is not supported by your browser"
          )
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(userLocation);

          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            coordinates.lat,
            coordinates.lng
          );
          setDistanceToDestination(distance);

          if (distance > DESTINATION_PROXIMITY_THRESHOLD_METERS) {
            setIsRouteLoading(true);
          }
        },
        () => {
          notifyWarning(
            t(
              "errors.unableToGetLocation",
              "Unable to get your current location. Please check your browser settings."
            )
          );
        }
      );
    }, []);

    const handleTravelModeChange = (mode: TravelMode) => {
      setTravelMode(mode);
      localStorage.setItem("preferredTravelMode", mode);
    };

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
            <MapController center={centerOverride} />
            {currentLocation && (
              <>
                <Marker
                  position={[currentLocation.lat, currentLocation.lng]}
                  icon={currentLocationIcon}
                />
                {!isWithinProximity && (
                  <RoutingService
                    start={currentLocation}
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
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    window.open(getDirection(coordinates), "_blank");
                  }}
                />
              </div>
            </CustomControl>
            {isWithinProximity && (
              <CustomControl position="bottomleft">
                <div className="alert alert-success arrival-notification">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {t(
                    "location.arrivedAtDestination",
                    "You've reached your destination"
                  )}
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
