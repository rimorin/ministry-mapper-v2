import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useState, useEffect } from "react";
import { Modal, Badge, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  USER_ACCESS_LEVELS,
  UNSUPPORTED_BROWSER_MSG,
  LINK_TYPES
} from "../../utils/constants";
import {
  GeneratedMapModalProps,
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
import ModalFooter from "../form/footer";
import GenericInputField from "../form/input";
import errorHandler from "../../utils/helpers/errorhandler";
import assignmentMessage from "../../utils/helpers/assignmentmsg";
import TravelModeButtons from "../map/travelmodebtn";

import { callFunction } from "../../utils/pocketbase";

const QuickLinkModal = NiceModal.create(
  ({
    territoryId,
    linkId,
    mapName,
    progress,
    notDone,
    notHome,
    assignees,
    origin,
    coordinates
  }: GeneratedMapModalProps) => {
    const { t } = useTranslation();
    const modal = useModal();

    // State management
    const [isInputMode, setIsInputMode] = useState(!linkId); // Start in input mode if no linkId
    const [publisher, setPublisher] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [mapData, setMapData] = useState<{
      linkId: string;
      mapName: string;
      progress: number;
      not_done: number;
      not_home: number;
      assignees: string[];
      coordinates: latlongInterface;
      origin: latlongInterface;
    } | null>(
      linkId
        ? {
            linkId,
            mapName: mapName!,
            progress: progress!,
            not_done: notDone!,
            not_home: notHome!,
            assignees: assignees!,
            coordinates: coordinates!,
            origin: origin!
          }
        : null
    );

    // Map-related state
    const [currentCenter, setCurrentCenter] = useState<latlongInterface>(
      coordinates || { lat: 0, lng: 0 }
    );
    const [travelMode, setTravelMode] = useState<google.maps.TravelMode>(
      google.maps.TravelMode.WALKING
    );
    const [isCalculating, setIsCalculating] = useState(true);

    const map = useMap();
    const routesLibrary = useMapsLibrary("routes");
    const [directionsService, setDirectionsService] =
      useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] =
      useState<google.maps.DirectionsRenderer>();

    const handleSubmitPublisher = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!publisher.trim()) return;

      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const linkData = await callFunction("/territory/link", {
              method: "POST",
              body: {
                territory: territoryId,
                publisher: publisher.trim(),
                coordinates: {
                  lat: latitude,
                  lng: longitude
                }
              }
            });

            setMapData({
              linkId: linkData.linkId,
              mapName: linkData.mapName,
              progress: linkData.progress,
              not_done: linkData.not_done,
              not_home: linkData.not_home,
              assignees: linkData.assignees,
              coordinates: linkData.coordinates,
              origin: { lat: latitude, lng: longitude }
            });
            setCurrentCenter(linkData.coordinates);
            setIsInputMode(false);
          } catch (error) {
            errorHandler(error, false);
          } finally {
            setIsLoading(false);
          }
        },
        () => {
          alert(t("errors.unableToGetLocation"));
          setIsLoading(false);
        }
      );
    };

    const shareTimedLink = async (
      linktype: string,
      title: string,
      body: string
    ) => {
      if (!navigator.share) {
        alert(UNSUPPORTED_BROWSER_MSG);
        return;
      }
      try {
        const url = `map/${linkId}`;
        const absoluteUrl = new URL(url, window.location.href);
        await navigator.share({
          title: title,
          text: body,
          url: absoluteUrl.toString()
        });
      } catch (error) {
        if (error instanceof Error) {
          // Ignore the error if the user aborts the share
          if (error.name === "AbortError") {
            return;
          }
        }
        errorHandler(error, false);
        throw error; // Re-throw to be caught by handleAssign
      }
    };

    const handleAssign = async (e: React.FormEvent<HTMLFormElement>) => {
      // disable default behavior
      e.preventDefault();
      if (!mapData || !publisher.trim()) return;

      setIsSharing(true);
      try {
        await shareTimedLink(
          LINK_TYPES.ASSIGNMENT,
          mapData.mapName,
          assignmentMessage(mapData.mapName)
        );
        modal.remove(); // Close modal only on successful share
      } catch (error) {
        errorHandler(error, false);
      } finally {
        setIsSharing(false);
      }
    };

    useEffect(() => {
      if (!routesLibrary || !map || isInputMode || !mapData) return;
      setDirectionsService(new routesLibrary.DirectionsService());
      setDirectionsRenderer(
        new routesLibrary.DirectionsRenderer({
          map
        })
      );
    }, [routesLibrary, map, travelMode, isInputMode, mapData]);

    useEffect(() => {
      if (!directionsService || !directionsRenderer || isInputMode || !mapData)
        return;

      const initDirections = async () => {
        try {
          const direction = await directionsService.route({
            origin: mapData.origin,
            destination: mapData.coordinates,
            travelMode: travelMode,
            provideRouteAlternatives: false
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
    }, [
      directionsService,
      directionsRenderer,
      travelMode,
      isInputMode,
      mapData
    ]);

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
              <Modal.Body
                style={{
                  height: window.innerHeight < 700 ? "75dvh" : "80dvh"
                }}
              >
                {mapData ? (
                  <Map
                    mapId="generated-territory-map"
                    clickableIcons={false}
                    center={currentCenter}
                    onCenterChanged={(center) =>
                      setCurrentCenter(center.detail.center)
                    }
                    defaultZoom={16}
                    fullscreenControl={false}
                    streetViewControl={false}
                    gestureHandling="greedy"
                    mapTypeControl={false}
                  >
                    <MapCurrentTarget
                      isLocating={isCalculating}
                      onClick={() => setCurrentCenter(mapData.coordinates)}
                    />
                    <MapControl position={ControlPosition.TOP_CENTER}>
                      <div
                        className="bg-white rounded-3 shadow-lg border p-3 mt-1"
                        style={{ minWidth: "280px" }}
                      >
                        {/* Statistics Row */}
                        <div className="d-flex justify-content-center gap-3">
                          <div className="text-center">
                            <div className="fw-bold text-warning fs-5">
                              {mapData.not_done}
                            </div>
                            <small className="text-muted">
                              {t("territory.notDone")}
                            </small>
                          </div>
                          <div className="text-center border-start ps-4">
                            <div className="fw-bold text-info fs-5">
                              {mapData.not_home}
                            </div>
                            <small className="text-muted">
                              {t("territory.notHome")}
                            </small>
                          </div>
                          <div className="text-center border-start ps-4">
                            <div className="fw-bold text-success fs-5">
                              {mapData.progress}%
                            </div>
                            <small className="text-muted">
                              {t("territory.completed")}
                            </small>
                          </div>
                        </div>

                        {/* Assignees Row */}
                        {mapData.assignees && mapData.assignees.length > 0 && (
                          <div className="border-top pt-2 mt-2">
                            <div className="text-center">
                              <small className="text-muted fw-medium mb-2 d-block">
                                {t("territory.assignees")}
                              </small>
                              <div className="d-flex flex-wrap justify-content-center gap-1">
                                {mapData.assignees.map((assignee, index) => (
                                  <Badge
                                    key={index}
                                    bg="light"
                                    text="dark"
                                    className="px-2 py-1"
                                    style={{ fontSize: "0.875rem" }}
                                  >
                                    {assignee}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </MapControl>
                    <MapControl
                      position={ControlPosition.INLINE_START_BLOCK_END}
                    >
                      <TravelModeButtons
                        travelMode={travelMode}
                        onTravelModeChange={setTravelMode}
                      />
                    </MapControl>
                  </Map>
                ) : null}
              </Modal.Body>
              {mapData && (
                <ModalFooter
                  handleClick={() => modal.hide()}
                  submitLabel={t("generatedMap.share")}
                  isSaving={isSharing}
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
