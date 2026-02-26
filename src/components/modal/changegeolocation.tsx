import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState, SubmitEvent, useRef, useEffect } from "react";
import { Modal, Form, Card, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import {
  currentLocationIcon,
  addressMarkerIcon
} from "../../utils/helpers/mapicons";
import useNotification from "../../hooks/useNotification";
import {
  ConfigureAddressCoordinatesModalProps,
  latlongInterface
} from "../../utils/interface";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import { updateDataById } from "../../utils/pocketbase";
import GenericButton from "../navigation/button";
import { MapController } from "../map/mapcontroller";
import CustomControl from "../map/customcontrol";
import { SearchControl } from "../map/searchcontrol";
import useGeolocation from "../../hooks/useGeolocation";
import "leaflet-geosearch/dist/geosearch.css";
import "../../css/geosearch.css";

const MapClickHandler = ({
  onMapClick
}: {
  onMapClick: (latlng: latlongInterface) => void;
}) => {
  useMapEvents({
    click: (e) => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
  });
  return null;
};

const ChangeMapGeolocation = NiceModal.create(
  ({
    mapId = "",
    name = "",
    coordinates,
    origin,
    isSelectOnly = false
  }: ConfigureAddressCoordinatesModalProps) => {
    const { t } = useTranslation();
    const { notifyError } = useNotification();
    const [addressLocation, setAddressLocation] =
      useState<latlongInterface>(coordinates);
    const [isSaving, setIsSaving] = useState(false);
    const [searchCenter, setSearchCenter] = useState<latlongInterface | null>(
      null
    );
    const [recenterTrigger, setRecenterTrigger] = useState(0);
    const hasInitiallyRecentered = useRef(false);
    const modal = useModal();

    // Use universal map centering hook to get device location
    const { currentLocation: deviceLocation, center: initialCenter } =
      useGeolocation({
        coordinates,
        skipGeolocation: false
      });

    useEffect(() => {
      if (!coordinates && deviceLocation && !hasInitiallyRecentered.current) {
        setSearchCenter(deviceLocation);
        setRecenterTrigger((prev) => prev + 1);
        hasInitiallyRecentered.current = true;
      }
    }, [deviceLocation, coordinates]);

    const mapCenter = searchCenter;

    const handleUpdateGeoLocation = async (event: SubmitEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        if (!isSelectOnly) {
          await updateDataById(
            "maps",
            mapId,
            { coordinates: JSON.stringify(addressLocation) },
            { requestKey: `update-map-coordinates-${mapId}` }
          );
        }
        modal.resolve(addressLocation);
        modal.hide();
      } catch (error) {
        notifyError(error);
      } finally {
        setIsSaving(false);
      }
    };

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
        </Modal.Header>
        <Form onSubmit={handleUpdateGeoLocation}>
          <Modal.Body
            style={{
              height: window.innerHeight < 700 ? "75dvh" : "80dvh"
            }}
          >
            <MapContainer
              center={[initialCenter.lat, initialCenter.lng]}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
              zoomControl
              scrollWheelZoom
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <SearchControl
                onLocationSelect={(location) => {
                  setAddressLocation(location);
                  setSearchCenter(location);
                  setRecenterTrigger((prev) => prev + 1);
                }}
                origin={origin}
              />
              <MapController
                center={mapCenter}
                trigger={recenterTrigger}
                zoomLevel={16}
              />
              <MapClickHandler onMapClick={setAddressLocation} />
              {deviceLocation && (
                <>
                  <Marker
                    position={[deviceLocation.lat, deviceLocation.lng]}
                    icon={currentLocationIcon}
                  />
                  <CustomControl position="topright">
                    <MapCurrentTarget
                      onClick={() => {
                        setSearchCenter(deviceLocation);
                        setRecenterTrigger((prev) => prev + 1);
                      }}
                    />
                  </CustomControl>
                </>
              )}
              {addressLocation && (
                <Marker
                  position={[addressLocation.lat, addressLocation.lng]}
                  icon={addressMarkerIcon}
                />
              )}
              {addressLocation && name && (
                <CustomControl position="bottomleft">
                  <Card className="map-control-panel">
                    <Card.Body className="d-flex align-items-center">
                      <i
                        className="bi bi-geo-alt-fill text-primary"
                        style={{ fontSize: "1.1rem" }}
                      ></i>
                      <span className="map-control-panel-name">{name}</span>
                    </Card.Body>
                  </Card>
                </CustomControl>
              )}
            </MapContainer>
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
