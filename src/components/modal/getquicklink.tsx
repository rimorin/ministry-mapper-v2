import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState } from "react";
import { Modal, Badge, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import {
  USER_ACCESS_LEVELS,
  UNSUPPORTED_BROWSER_MSG,
  DEFAULT_COORDINATES
} from "../../utils/constants";
import {
  currentLocationIcon,
  destinationIcon
} from "../../utils/helpers/mapicons";
import { latlongInterface, TravelMode } from "../../utils/interface";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import useNotification from "../../hooks/useNotification";
import assignmentMessage from "../../utils/helpers/assignmentmsg";
import TravelModeButtons from "../map/travelmodebtn";
import CustomControl from "../map/customcontrol";
import RoutingService from "../map/routingservice";
import { callFunction } from "../../utils/pocketbase";
import { MapController } from "../map/mapcontroller";
import useGeolocation from "../../hooks/useGeolocation";

interface QuickLinkModalProps {
  territoryId: string;
}

interface MapDataType {
  linkId: string;
  mapName: string;
  progress: number;
  not_done: number;
  not_home: number;
  assignees: string[];
  coordinates: latlongInterface;
  origin: latlongInterface;
}

const QuickLinkModal = NiceModal.create(
  ({ territoryId }: QuickLinkModalProps) => {
    const { t } = useTranslation();
    const { notifyError, notifyWarning } = useNotification();
    const modal = useModal();
    const { requestLocation } = useGeolocation({
      skipGeolocation: true
    });

    const [isInputMode, setIsInputMode] = useState(true);
    const [publisher, setPublisher] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [mapData, setMapData] = useState<MapDataType | null>(null);

    const [currentCenter, setCurrentCenter] = useState<latlongInterface>(
      DEFAULT_COORDINATES.Singapore
    );
    const [travelMode, setTravelMode] = useState<TravelMode>(() => {
      const saved = localStorage.getItem("preferredTravelMode");
      return (saved as TravelMode) || "WALKING";
    });
    const [isRouteLoading, setIsRouteLoading] = useState(false);

    const handleTravelModeChange = (mode: TravelMode) => {
      setTravelMode(mode);
      localStorage.setItem("preferredTravelMode", mode);
    };

    const handleSubmitPublisher = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!publisher.trim()) return;

      setIsLoading(true);
      try {
        const origin = await requestLocation();
        if (!origin) {
          notifyWarning(t("errors.unableToGetLocation"));
          return;
        }

        const linkData = await callFunction("/territory/link", {
          method: "POST",
          body: {
            territory: territoryId,
            publisher: publisher.trim(),
            coordinates: origin
          }
        });

        setMapData({ ...linkData, origin });
        setCurrentCenter(linkData.coordinates);
        setIsInputMode(false);
      } catch (error) {
        notifyError(error);
      } finally {
        setIsLoading(false);
      }
    };

    const shareTimedLink = async (
      linkId: string,
      title: string,
      body: string
    ) => {
      if (!navigator.share) {
        notifyWarning(UNSUPPORTED_BROWSER_MSG);
        return;
      }
      await navigator.share({
        title,
        text: body,
        url: new URL(`map/${linkId}`, window.location.href).toString()
      });
    };

    const handleAssign = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!mapData || !publisher.trim()) return;

      setIsSharing(true);
      try {
        await shareTimedLink(
          mapData.linkId,
          mapData.mapName,
          assignmentMessage(mapData.mapName)
        );
        modal.remove();
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        notifyError(error);
      } finally {
        setIsSharing(false);
      }
    };

    return (
      <Modal
        {...bootstrapDialog(modal)}
        fullscreen={!isInputMode || undefined}
        onHide={() => modal.remove()}
      >
        {isInputMode ? (
          <>
            <Modal.Header className="justify-content-center">
              <Modal.Title>{t("admin.quickLink")}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmitPublisher}>
              <Modal.Body>
                <p className="mb-0 text-muted text-center">
                  {t("generatedMap.info")}
                </p>
                <GenericInputField
                  name="publisher"
                  inputType="text"
                  changeValue={publisher}
                  handleChange={(e) =>
                    setPublisher((e.target as HTMLInputElement).value)
                  }
                  required
                  placeholder={t("territory.publisherPlaceholder")}
                />
              </Modal.Body>
              <ModalFooter
                handleClick={() => modal.hide()}
                userAccessLevel={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                isSaving={isLoading}
                submitLabel={t("admin.confirm")}
              />
            </Form>
          </>
        ) : (
          <>
            <Modal.Header className="justify-content-center border-0">
              <Modal.Title className="text-center fw-bold w-100">
                {mapData?.mapName || t("admin.generatedMap")}
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleAssign}>
              <Modal.Body className="quicklink-modal-body-container">
                {mapData && (
                  <>
                    <MapContainer
                      center={[
                        mapData.coordinates.lat,
                        mapData.coordinates.lng
                      ]}
                      zoom={16}
                      style={{ height: "100%", width: "100%" }}
                      zoomControl={true}
                      scrollWheelZoom={true}
                      attributionControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapController
                        center={currentCenter}
                        onCenterChange={setCurrentCenter}
                        zoomLevel={16}
                      />
                      {mapData.origin && (
                        <>
                          <Marker
                            position={[mapData.origin.lat, mapData.origin.lng]}
                            icon={currentLocationIcon}
                          />
                          <RoutingService
                            start={mapData.origin}
                            end={mapData.coordinates}
                            travelMode={travelMode}
                            onLoadingChange={setIsRouteLoading}
                          />
                          <CustomControl position="topright">
                            <MapCurrentTarget
                              onClick={() =>
                                setCurrentCenter({ ...mapData.origin })
                              }
                            />
                          </CustomControl>
                        </>
                      )}
                      <Marker
                        position={[
                          mapData.coordinates.lat,
                          mapData.coordinates.lng
                        ]}
                        icon={destinationIcon}
                      />
                      <CustomControl position="bottomleft">
                        <TravelModeButtons
                          travelMode={travelMode}
                          onTravelModeChange={handleTravelModeChange}
                          isLoading={isRouteLoading}
                        />
                      </CustomControl>
                    </MapContainer>
                    <div className="bg-body rounded-3 shadow-lg border p-3 quicklink-stats-panel">
                      <div className="d-flex justify-content-center gap-3">
                        <div className="text-center">
                          <div className="fw-bold text-warning fs-5">
                            {mapData.not_done}
                          </div>
                          <small className="text-body-secondary">
                            {t("territory.notDone")}
                          </small>
                        </div>
                        <div className="text-center border-start ps-4">
                          <div className="fw-bold text-info fs-5">
                            {mapData.not_home}
                          </div>
                          <small className="text-body-secondary">
                            {t("territory.notHome")}
                          </small>
                        </div>
                        <div className="text-center border-start ps-4">
                          <div className="fw-bold text-success fs-5">
                            {mapData.progress}%
                          </div>
                          <small className="text-body-secondary">
                            {t("territory.completed")}
                          </small>
                        </div>
                      </div>

                      {mapData.assignees.length > 0 && (
                        <div className="border-top pt-2 mt-2">
                          <div className="text-center">
                            <small className="text-body-secondary fw-medium mb-2 d-block">
                              {t("territory.assignees")}
                            </small>
                            <div className="d-flex flex-wrap justify-content-center gap-1">
                              {mapData.assignees.map((assignee, index) => (
                                <Badge
                                  key={index}
                                  bg="secondary"
                                  className="px-2 py-1 quicklink-assignee-badge"
                                >
                                  {assignee}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Modal.Body>
              {mapData && (
                <ModalFooter
                  handleClick={() => modal.hide()}
                  submitLabel={t("generatedMap.share")}
                  isSaving={isSharing}
                  disableSubmitBtn={false}
                  requiredAcLForSave={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                />
              )}
            </Form>
          </>
        )}
      </Modal>
    );
  }
);

export default QuickLinkModal;
