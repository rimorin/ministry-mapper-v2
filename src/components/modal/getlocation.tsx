import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState, useEffect } from "react";
import { ButtonGroup, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { USER_ACCESS_LEVELS, WIKI_CATEGORIES } from "../../utils/constants";
import HelpButton from "../navigation/help";
import {
  GetMapGeolocationModalProps,
  latlongInterface
} from "../../utils/interface";
import { Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { MapCurrentTarget } from "../utils/mapcurrenttarget";
import ModalFooter from "../form/footer";
import getDirection from "../../utils/helpers/directiongenerator";
import GenericButton from "../navigation/button";

const GetMapGeolocation = NiceModal.create(
  ({ coordinates, origin, name }: GetMapGeolocationModalProps) => {
    const { t } = useTranslation();
    const [currentCenter, setCurrentCenter] =
      useState<latlongInterface>(coordinates);
    const [currentLocation, setCurrentLocation] = useState<latlongInterface>();
    const [travelMode, setTravelMode] = useState<google.maps.TravelMode>(
      google.maps.TravelMode.WALKING
    );
    const [isCalculating, setIsCalculating] = useState(true);
    const modal = useModal();

    const map = useMap();

    const routesLibrary = useMapsLibrary("routes");
    const [directionsService, setDirectionsService] =
      useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] =
      useState<google.maps.DirectionsRenderer>();

    const getCurrentLocation = (
      onSuccess: (position: GeolocationPosition) => void,
      onError: () => void
    ) => {
      if (!navigator.geolocation) {
        alert(
          t(
            "errors.geolocationNotSupported",
            "Geolocation is not supported by your browser"
          )
        );
        onError();
        return;
      }
      navigator.geolocation.getCurrentPosition(onSuccess, onError);
    };

    useEffect(() => {
      if (!routesLibrary || !map) return;
      setDirectionsService(new routesLibrary.DirectionsService());
      setDirectionsRenderer(
        new routesLibrary.DirectionsRenderer({
          map
        })
      );
    }, [routesLibrary, map, travelMode]);

    useEffect(() => {
      if (!directionsService || !directionsRenderer || !currentLocation) return;

      const initDirections = async () => {
        try {
          const direction = await directionsService.route({
            origin: currentLocation,
            destination: coordinates,
            travelMode: travelMode,
            provideRouteAlternatives: false,
            region: origin
          });
          directionsRenderer.setDirections(direction);
          setIsCalculating(false);
        } catch (error) {
          console.error(error);
        }
      };

      setIsCalculating(true);
      initDirections();

      return () => directionsRenderer.setMap(null);
    }, [directionsService, directionsRenderer, travelMode, currentLocation]);

    useEffect(() => {
      getCurrentLocation(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          alert(
            t(
              "errors.unableToGetLocation",
              "Unable to get your current location. Please check your browser settings."
            )
          );
          modal.hide();
        }
      );
    }, []);

    return (
      <Modal
        {...bootstrapDialog(modal)}
        fullscreen
        onHide={() => modal.remove()}
      >
        <Modal.Header>
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
            <MapCurrentTarget
              isLocating={isCalculating}
              onClick={() => setCurrentCenter(coordinates)}
            />
          </Map>
        </Modal.Body>
        <ModalFooter
          handleClick={() => modal.hide()}
          requiredAcLForSave={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
        >
          <GenericButton
            variant="secondary"
            onClick={() => {
              window.open(getDirection(coordinates), "_blank");
            }}
            label={t("navigation.openMaps", "Open Maps")}
          />
          <ButtonGroup
            aria-label={t("navigation.transportModes", "Transport modes")}
          >
            <GenericButton
              variant={
                travelMode === google.maps.TravelMode.WALKING
                  ? "primary"
                  : "secondary"
              }
              aria-label={t("navigation.walkMode", "Walk mode")}
              onClick={() => setTravelMode(google.maps.TravelMode.WALKING)}
              label="🚶"
            />
            <GenericButton
              variant={
                travelMode === google.maps.TravelMode.DRIVING
                  ? "primary"
                  : "secondary"
              }
              aria-label={t("navigation.driveMode", "Drive mode")}
              onClick={() => setTravelMode(google.maps.TravelMode.DRIVING)}
              label="🚗"
            />
            <GenericButton
              variant={
                travelMode === google.maps.TravelMode.TRANSIT
                  ? "primary"
                  : "secondary"
              }
              aria-label={t("navigation.transitMode", "Transit mode")}
              onClick={() => setTravelMode(google.maps.TravelMode.TRANSIT)}
              label="🚌"
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    );
  }
);

export default GetMapGeolocation;
