import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState, useEffect } from "react";
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
  ControlPosition,
  Map,
  MapControl,
  useMap,
  useMapsLibrary
} from "@vis.gl/react-google-maps";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import getDirection from "../../utils/helpers/directiongenerator";
import TravelModeButtons from "../map/travelmodebtn";

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
