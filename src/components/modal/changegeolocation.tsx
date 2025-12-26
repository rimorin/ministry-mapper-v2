import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState, FormEvent, useEffect } from "react";
import { Modal, Form, Spinner, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents
} from "react-leaflet";
import { GeoSearchControl, LocationIQProvider } from "leaflet-geosearch";
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

const SearchControl = ({
  onLocationSelect,
  origin
}: {
  onLocationSelect: (location: latlongInterface) => void;
  origin: string;
}) => {
  const map = useMap();

  useEffect(() => {
    const providerParams: Record<string, string | number> = {
      key: import.meta.env.VITE_LOCATIONIQ_API_KEY,
      limit: 5,
      addressdetails: 1
    };

    if (origin) {
      providerParams.countrycodes = origin.toLowerCase();
    }

    const provider = new LocationIQProvider({ params: providerParams });

    const searchControl = GeoSearchControl({
      provider,
      style: "bar",
      showMarker: false,
      maxSuggestions: 5,
      autoComplete: true,
      autoCompleteDelay: 300,
      autoClose: true,
      retainZoomLevel: true
    });

    map.addControl(searchControl);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleLocationSelect = (event: any) => {
      onLocationSelect({ lat: event.location.y, lng: event.location.x });
    };

    map.on("geosearch/showlocation", handleLocationSelect);

    return () => {
      map.off("geosearch/showlocation", handleLocationSelect);
      map.removeControl(searchControl);
    };
  }, [map, onLocationSelect, origin]);

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
    const { notifyError, notifyWarning } = useNotification();
    const [addressLocation, setAddressLocation] =
      useState<latlongInterface>(coordinates);
    const [center, setCenter] = useState<latlongInterface>(coordinates);
    const [currentLocation, setCurrentLocation] = useState<latlongInterface>();
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const handleUpdateGeoLocation = async (event: FormEvent<HTMLElement>) => {
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

    useEffect(() => {
      if (!navigator.geolocation) {
        notifyWarning(
          t(
            "errors.geolocationNotSupported",
            "Geolocation is not supported by your browser"
          )
        );
        modal.hide();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCurrentLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }),
        () => {
          notifyWarning(
            t(
              "errors.unableToGetLocation",
              "Unable to get your current location. Please check your browser settings."
            )
          );
          modal.hide();
        }
      );
    }, [modal, notifyWarning, t]);

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
              center={[coordinates.lat, coordinates.lng]}
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
                  setCenter(location);
                }}
                origin={origin}
              />
              <MapController center={center} />
              <MapClickHandler onMapClick={setAddressLocation} />
              {currentLocation && (
                <>
                  <Marker
                    position={[currentLocation.lat, currentLocation.lng]}
                    icon={currentLocationIcon}
                  />
                  <CustomControl position="topright">
                    <MapCurrentTarget
                      onClick={() => {
                        setCenter({ ...currentLocation });
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
