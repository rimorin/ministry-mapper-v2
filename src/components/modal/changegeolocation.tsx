import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, useCallback, useEffect } from "react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
import { pb } from "../../utils/pocketbase";
import { WIKI_CATEGORIES } from "../../utils/constants";
import errorHandler from "../../utils/helpers/errorhandler";
import HelpButton from "../navigation/help";
import {
  ConfigureAddressCoordinatesModalProps,
  latlongInterface
} from "../../utils/interface";
import { AdvancedMarker, Map, MapMouseEvent } from "@vis.gl/react-google-maps";
import { GmapAutocomplete } from "../utils/mapautocomplete";
import { ControlPanel } from "../utils/mapinfopanel";
import { MapCurrentTarget } from "../utils/mapcurrenttarget";
import { usePostHog } from "posthog-js/react";
import CurrentLocationMarker from "../statics/currentlocator";

const ChangeMapGeolocation = NiceModal.create(
  ({
    mapId = "",
    coordinates,
    origin,
    isNew = false
  }: ConfigureAddressCoordinatesModalProps) => {
    const [addressLocation, setAddressLocation] =
      useState<latlongInterface>(coordinates);
    const [currentCenter, setCurrentCenter] =
      useState<latlongInterface>(coordinates);
    const [currentLocation, setCurrentLocation] = useState<latlongInterface>();
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();
    const rollbar = useRollbar();
    const posthog = usePostHog();

    const handleUpdateGeoLocation = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        if (!isNew) {
          await pb.collection("maps").update(
            mapId,
            {
              coordinates: JSON.stringify(addressLocation)
            },
            {
              requestKey: `maps-coordinates-${mapId}`
            }
          );
          posthog?.capture("change_address_geolocation", {
            mapId,
            coordinates: addressLocation
          });
        }
        modal.resolve(addressLocation);
        modal.hide();
      } catch (error) {
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };
    const onMapClick = useCallback((event: MapMouseEvent) => {
      const eventDetails = event.detail;
      setAddressLocation({
        lat: eventDetails.latLng?.lat as number,
        lng: eventDetails.latLng?.lng as number
      });
    }, []);

    useEffect(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) =>
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        );
      }
    }, []);

    return (
      <Modal
        {...bootstrapDialog(modal)}
        fullscreen
        onHide={() => modal.remove()}
      >
        <Modal.Header>
          <Modal.Title>{isNew ? "Select" : "Change"} Location</Modal.Title>
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
                />
              )}
              <GmapAutocomplete
                origin={origin}
                onPlaceSelect={(place) => {
                  if (place && place.geometry && place.geometry.location) {
                    const location = place.geometry.location;
                    const locationLat = location.lat();
                    const locationLng = location.lng();
                    setAddressLocation({
                      lat: locationLat,
                      lng: locationLng
                    });
                    setCurrentCenter({
                      lat: locationLat,
                      lng: locationLng
                    });
                  }
                }}
              />
              <MapCurrentTarget onClick={() => setCurrentCenter(coordinates)} />
              {addressLocation && <AdvancedMarker position={addressLocation} />}
            </Map>
          </Modal.Body>
          <Modal.Footer className="justify-content-around">
            <Button variant="secondary" onClick={() => modal.hide()}>
              Close
            </Button>
            <Button variant="primary" type="submit">
              {isSaving && (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    aria-hidden="true"
                  />{" "}
                </>
              )}
              {isNew ? "Select" : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
);

export default ChangeMapGeolocation;
