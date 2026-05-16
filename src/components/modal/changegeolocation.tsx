import NiceModal from "@ebay/nice-modal-react";
import { useState, SubmitEvent, useRef, useEffect } from "react";
import * as m from "motion/react-m";
import { Button } from "@/components/ui/button";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { XIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, useMapEvents } from "react-leaflet";
import {
  currentLocationIcon,
  addressMarkerIcon
} from "../../utils/helpers/mapicons";
import useNotification from "../../hooks/useNotification";
import useAnalytics, { ANALYTICS_EVENTS } from "../../hooks/useAnalytics";
import {
  ConfigureAddressCoordinatesModalProps,
  latlongInterface
} from "../../utils/interface";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import { updateDataById } from "../../utils/pocketbase";
import { MapController } from "../map/mapcontroller";
import CustomControl from "../map/customcontrol";
import { SearchControl } from "../map/searchcontrol";
import useGeolocation from "../../hooks/useGeolocation";
import { ThemedTileLayer } from "../map/themedtilelayer";

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
    const { modal, dialogProps, contentProps } = useBaseUiDialog({
      size: "fullscreen"
    });
    const { t } = useTranslation();
    const { runAction } = useNotification();
    const { trackEvent } = useAnalytics();
    const [addressLocation, setAddressLocation] =
      useState<latlongInterface>(coordinates);
    const [isSaving, setIsSaving] = useState(false);
    const [searchCenter, setSearchCenter] = useState<latlongInterface | null>(
      null
    );
    const [recenterTrigger, setRecenterTrigger] = useState(0);
    const hasInitiallyRecentered = useRef(false);

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
      await runAction(
        async () => {
          if (!isSelectOnly) {
            await updateDataById(
              "maps",
              mapId,
              { coordinates: JSON.stringify(addressLocation) },
              { requestKey: `update-map-coordinates-${mapId}` }
            );
            trackEvent(ANALYTICS_EVENTS.ADDRESS_GEOLOCATION_UPDATED);
          }
          modal.resolve(addressLocation);
          modal.hide();
        },
        { setLoading: setIsSaving }
      );
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <DialogHeader className="flex-row items-center justify-between px-4 pt-4 pb-3 shrink-0 border-b gap-2">
            <DialogTitle className="truncate">
              {isSelectOnly
                ? t("common.select", "Select")
                : t("common.change", "Change")}{" "}
              {t("address.location", "Location")}
            </DialogTitle>
            <DialogClose
              render={
                <Button variant="ghost" size="icon-sm" className="shrink-0" />
              }
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          <form
            onSubmit={handleUpdateGeoLocation}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <m.div
              className="flex-1 relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, ease: "linear", delay: 0.2 }}
            >
              <MapContainer
                center={[initialCenter.lat, initialCenter.lng]}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
                zoomControl
                scrollWheelZoom
              >
                <ThemedTileLayer />
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
                    <CustomControl position="bottomright">
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
                    <div className="max-w-80 rounded-lg border border-border bg-card text-[0.9rem] text-card-foreground shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                      <div className="flex items-center gap-2 p-3">
                        <i
                          className="bi bi-geo-alt-fill text-primary"
                          style={{ fontSize: "1.1rem" }}
                        ></i>
                        <span className="font-medium truncate">{name}</span>
                      </div>
                    </div>
                  </CustomControl>
                )}
              </MapContainer>
            </m.div>
            <DialogFooter className="px-4 py-3 shrink-0 flex-row justify-around">
              <Button variant="secondary" type="button" onClick={modal.hide}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && (
                  <Spinner data-icon="inline-start" aria-hidden="true" />
                )}
                {isSelectOnly
                  ? t("common.select", "Select")
                  : t("common.save", "Save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default ChangeMapGeolocation;
