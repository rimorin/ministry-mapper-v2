import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState, useEffect, useCallback } from "react";
import { Image, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { WIKI_CATEGORIES } from "../../utils/constants";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import HelpButton from "../navigation/help";
import {
  GetMapGeolocationModalProps,
  latlongInterface
} from "../../utils/interface";
import {
  AdvancedMarker,
  ControlPosition,
  Map,
  MapControl,
  Pin,
  useMap,
  useMapsLibrary
} from "@vis.gl/react-google-maps";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import getDirection from "../../utils/helpers/directiongenerator";
import TravelModeButtons from "../map/travelmodebtn";
import DirectionArrow from "../statics/directionarrow";

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
};

const ARRIVAL_THRESHOLD_IN_METRES = 50;

const calculateDistance = (
  point1: latlongInterface,
  point2: latlongInterface
): number => {
  if (!google?.maps?.geometry?.spherical) return Infinity;

  return google.maps.geometry.spherical.computeDistanceBetween(
    new google.maps.LatLng(point1.lat, point1.lng),
    new google.maps.LatLng(point2.lat, point2.lng)
  );
};

const GetMapGeolocation = NiceModal.create(
  ({ coordinates, origin, name }: GetMapGeolocationModalProps) => {
    const { t } = useTranslation();
    const modal = useModal();
    const map = useMap();
    const routesLibrary = useMapsLibrary("routes");
    const geometryLibrary = useMapsLibrary("geometry");

    const [currentCenter, setCurrentCenter] =
      useState<latlongInterface>(coordinates);
    const [currentLocation, setCurrentLocation] = useState<latlongInterface>();
    const [travelMode, setTravelMode] = useState<google.maps.TravelMode>(
      google.maps.TravelMode.WALKING
    );
    const [isCalculating, setIsCalculating] = useState(false);
    const [hasArrived, setHasArrived] = useState(false);
    const [directionsService, setDirectionsService] =
      useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] =
      useState<google.maps.DirectionsRenderer>();

    const updateLocation = useCallback(
      (position: GeolocationPosition) => {
        if (!geometryLibrary) return;

        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setCurrentLocation(newLocation);

        const distance = calculateDistance(newLocation, coordinates);

        if (distance < ARRIVAL_THRESHOLD_IN_METRES && !hasArrived) {
          setHasArrived(true);

          if (directionsRenderer) {
            directionsRenderer.setMap(null);
          }

          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
        }
      },
      [coordinates, hasArrived, directionsRenderer, geometryLibrary]
    );

    const handleLocationError = useCallback(() => {
      alert(
        t(
          "errors.unableToGetLocation",
          "Unable to get your current location. Please check your browser settings."
        )
      );
      modal.hide();
    }, [t, modal]);

    useEffect(() => {
      if (!routesLibrary || !map) return;

      const service = new routesLibrary.DirectionsService();
      const renderer = new routesLibrary.DirectionsRenderer({
        map,
        suppressMarkers: true
      });

      setDirectionsService(service);
      setDirectionsRenderer(renderer);

      return () => renderer.setMap(null);
    }, [routesLibrary, map]);

    useEffect(() => {
      if (
        !directionsService ||
        !directionsRenderer ||
        !currentLocation ||
        hasArrived
      )
        return;

      const calculateDirections = async () => {
        setIsCalculating(true);
        try {
          const result = await directionsService.route({
            origin: currentLocation,
            destination: coordinates,
            travelMode,
            provideRouteAlternatives: false,
            region: origin
          });
          directionsRenderer.setDirections(result);
        } catch (error) {
          console.error(error);
        } finally {
          setIsCalculating(false);
        }
      };

      calculateDirections();
    }, [
      directionsService,
      directionsRenderer,
      travelMode,
      currentLocation,
      coordinates,
      origin,
      hasArrived
    ]);

    useEffect(() => {
      if (!navigator.geolocation || hasArrived) {
        if (!navigator.geolocation) {
          alert(
            t(
              "errors.geolocationNotSupported",
              "Geolocation is not supported by your browser"
            )
          );
          modal.hide();
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        updateLocation,
        handleLocationError
      );

      const watchId = navigator.geolocation.watchPosition(
        updateLocation,
        console.error,
        GEOLOCATION_OPTIONS
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }, [updateLocation, handleLocationError, hasArrived, t, modal]);

    return (
      <Modal {...bootstrapDialog(modal)} fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>
            {t("address.locationWithName", "{{name}} Location", { name })}
          </Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.CHANGE_ADDRESS_NAME} />
        </Modal.Header>
        <Modal.Body
          style={{
            height: window.innerHeight < 700 ? "75dvh" : "80dvh"
          }}
        >
          <Map
            mapId="change-address-geolocation"
            clickableIcons={false}
            center={currentCenter}
            onCenterChanged={(center) => setCurrentCenter(center.detail.center)}
            defaultZoom={16}
            fullscreenControl={false}
            streetViewControl={false}
            gestureHandling="greedy"
          >
            {!hasArrived && currentLocation && (
              <AdvancedMarker position={currentLocation}>
                <DirectionArrow />
              </AdvancedMarker>
            )}
            <AdvancedMarker position={coordinates}>
              <Pin>
                {hasArrived && (
                  <div className="arrival-tooltip-wrapper">
                    <div className="arrival-tooltip">
                      {t("navigation.arrivedAtDestination")}
                    </div>
                  </div>
                )}
              </Pin>
            </AdvancedMarker>
            <MapControl position={ControlPosition.INLINE_END_BLOCK_END}>
              <Image
                src={getAssetUrl("gmaps.svg")}
                alt={t("navigation.openMaps")}
                width={24}
                height={24}
                style={{
                  cursor: "pointer",
                  marginRight: "20px",
                  marginTop: "15px"
                }}
                onClick={() => {
                  window.open(getDirection(coordinates), "_blank");
                }}
              />
            </MapControl>
            <MapCurrentTarget
              isLocating={isCalculating}
              onClick={() => setCurrentCenter(coordinates)}
            />
            <MapControl position={ControlPosition.INLINE_START_BLOCK_END}>
              <TravelModeButtons
                travelMode={travelMode}
                onTravelModeChange={setTravelMode}
              />
            </MapControl>
          </Map>
        </Modal.Body>
      </Modal>
    );
  }
);

export default GetMapGeolocation;
