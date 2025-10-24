import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, useCallback, useEffect } from "react";
import { Modal, Form, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import HelpButton from "../navigation/help";
import {
  ConfigureAddressCoordinatesModalProps,
  latlongInterface
} from "../../utils/interface";
import { AdvancedMarker, Map, MapMouseEvent } from "@vis.gl/react-google-maps";
import { GmapAutocomplete } from "../map/mapautocomplete";
import { ControlPanel } from "../map/mapinfopanel";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import CurrentLocationMarker from "../statics/currentlocator";
import { updateDataById } from "../../utils/pocketbase";
import GenericButton from "../navigation/button";

const ChangeMapGeolocation = NiceModal.create(
  ({
    mapId = "",
    name = "",
    coordinates,
    origin,
    isSelectOnly = false
  }: ConfigureAddressCoordinatesModalProps) => {
    const { t } = useTranslation();
    const [addressLocation, setAddressLocation] =
      useState<latlongInterface>(coordinates);
    const [currentCenter, setCurrentCenter] =
      useState<latlongInterface>(coordinates);
    const [currentLocation, setCurrentLocation] = useState<latlongInterface>();
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

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

    const handleUpdateGeoLocation = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        if (!isSelectOnly) {
          await updateDataById(
            "maps",
            mapId,
            {
              coordinates: JSON.stringify(addressLocation)
            },
            {
              requestKey: `update-map-coordinates-${mapId}`
            }
          );
        }
        modal.resolve(addressLocation);
        modal.hide();
      } catch (error) {
        errorHandler(error);
      } finally {
        setIsSaving(false);
      }
    };

    const handlePlaceSelect = useCallback(
      (place: google.maps.places.Place | null) => {
        if (place?.location) {
          const lat = place.location.lat();
          const lng = place.location.lng();
          const newLocation = { lat, lng };
          setAddressLocation(newLocation);
          setCurrentCenter(newLocation);
        }
      },
      []
    );

    const onMapClick = useCallback((event: MapMouseEvent) => {
      const eventDetails = event.detail;
      setAddressLocation({
        lat: eventDetails.latLng?.lat as number,
        lng: eventDetails.latLng?.lng as number
      });
    }, []);

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
            {isSelectOnly
              ? t("common.select", "Select")
              : t("common.change", "Change")}{" "}
            {t("address.location", "Location")}
          </Modal.Title>
          <HelpButton link={WIKI_CATEGORIES.CHANGE_ADDRESS_NAME} />
        </Modal.Header>
        <Form onSubmit={handleUpdateGeoLocation}>
          <Modal.Body
            style={{
              height: window.innerHeight < 700 ? "75dvh" : "80dvh"
            }}
          >
            <Map
              mapId="change-address-geolocation"
              clickableIcons={false}
              center={currentCenter}
              onCenterChanged={(center) =>
                setCurrentCenter(center.detail.center)
              }
              defaultZoom={16}
              onClick={onMapClick}
              fullscreenControl={false}
              streetViewControl={false}
              gestureHandling="greedy"
            >
              {currentLocation && (
                <AdvancedMarker position={currentLocation} draggable={false}>
                  <CurrentLocationMarker />
                </AdvancedMarker>
              )}
              {addressLocation && (
                <ControlPanel
                  lat={addressLocation.lat}
                  lng={addressLocation.lng}
                  name={name}
                />
              )}
              <GmapAutocomplete
                origin={origin}
                onPlaceSelect={handlePlaceSelect}
              />
              <MapCurrentTarget onClick={() => setCurrentCenter(coordinates)} />
              {addressLocation && <AdvancedMarker position={addressLocation} />}
            </Map>
          </Modal.Body>
          <Modal.Footer className="justify-content-around">
            <GenericButton
              variant="secondary"
              onClick={() => modal.hide()}
              label={t("common.cancel", "Cancel")}
            />
            <GenericButton
              type="submit"
              variant="primary"
              label={
                <>
                  {isSaving && (
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      aria-hidden="true"
                    />
                  )}{" "}
                  {isSelectOnly
                    ? t("common.select", "Select")
                    : t("common.save", "Save")}
                </>
              }
            />
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
);

export default ChangeMapGeolocation;
