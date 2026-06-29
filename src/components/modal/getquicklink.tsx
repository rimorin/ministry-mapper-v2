import NiceModal from "@ebay/nice-modal-react";
import * as m from "motion/react-m";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { XIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker } from "react-leaflet";
import {
  UNSUPPORTED_BROWSER_MSG,
  DEFAULT_COORDINATES,
  PREFERRED_TRAVEL_MODE_KEY
} from "../../utils/constants";
import {
  currentLocationIcon,
  destinationIcon
} from "../../utils/helpers/mapicons";
import { latlongInterface, TravelMode } from "../../utils/interface";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import GenericInputField from "../form/input";
import useNotification from "../../hooks/useNotification";
import useAnalytics, { ANALYTICS_EVENTS } from "../../hooks/useAnalytics";
import assignmentMessage from "../../utils/helpers/assignmentmsg";
import TravelModeButtons from "../map/travelmodebtn";
import CustomControl from "../map/customcontrol";
import RoutingService from "../map/routingservice";
import { callFunction, isAbortError } from "../../utils/pocketbase";
import { MapController } from "../map/mapcontroller";
import useGeolocation from "../../hooks/useGeolocation";
import { ThemedTileLayer } from "../map/themedtilelayer";
import { formatDistance, formatDuration } from "../../utils/helpers/maphelpers";

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
    const {
      modal,
      dialogProps,
      contentProps: fullscreenContentProps
    } = useBaseUiDialog({ size: "fullscreen" });
    const compactContentProps = {
      className: "sm:max-w-[425px]"
    };
    const { t } = useTranslation();
    const { notifyError, notifyWarning, runAction } = useNotification();
    const { trackEvent } = useAnalytics();
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
      const saved = localStorage.getItem(PREFERRED_TRAVEL_MODE_KEY);
      return (saved as TravelMode) || "WALKING";
    });
    const [isRouteLoading, setIsRouteLoading] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{
      duration: number;
      distance: number;
    } | null>(null);

    const handleTravelModeChange = (mode: TravelMode) => {
      setTravelMode(mode);
      localStorage.setItem(PREFERRED_TRAVEL_MODE_KEY, mode);
      trackEvent(ANALYTICS_EVENTS.TRAVEL_MODE_CHANGED, { mode });
    };

    const handleSubmitPublisher = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!publisher.trim()) return;

      await runAction(
        async () => {
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
          trackEvent(ANALYTICS_EVENTS.QUICK_LINK_GENERATED);
          setIsInputMode(false);
        },
        { setLoading: setIsLoading }
      );
    };

    const shareTimedLink = async (linkId: string, body: string) => {
      if (!navigator.share) {
        notifyWarning(UNSUPPORTED_BROWSER_MSG);
        return;
      }
      await navigator.share({
        text: `${body}
${new URL(`map/${linkId}`, window.location.href).toString()}`
      });
    };

    const handleAssign = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!mapData || !publisher.trim()) return;

      setIsSharing(true);
      try {
        await shareTimedLink(
          mapData.linkId,
          assignmentMessage(mapData.mapName, publisher)
        );
        trackEvent(ANALYTICS_EVENTS.QUICK_LINK_SHARED);
        modal.remove();
      } catch (error) {
        if (isAbortError(error)) return;
        notifyError(error);
      } finally {
        setIsSharing(false);
      }
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent
          {...(isInputMode ? compactContentProps : fullscreenContentProps)}
          showCloseButton={false}
        >
          {isInputMode ? (
            <>
              <DialogHeader className="items-center">
                <DialogTitle>{t("admin.quickLink")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitPublisher} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
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
                <DialogFooter className="flex-row justify-around">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={modal.hide}
                  >
                    {t("common.cancel", "Cancel")}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Spinner data-icon="inline-start" aria-hidden="true" />
                    )}
                    {t("admin.confirm")}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <>
              <div className="relative flex items-center px-4 pt-4 pb-2 shrink-0">
                <DialogTitle className="absolute inset-x-0 text-center px-12 leading-none font-medium">
                  {mapData?.mapName || t("admin.generatedMap")}
                </DialogTitle>
                <div className="ml-auto z-10">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    type="button"
                    onClick={modal.hide}
                  >
                    <XIcon />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </div>
              <form
                onSubmit={handleAssign}
                className="flex flex-1 flex-col overflow-hidden"
              >
                <m.div
                  className="quicklink-modal-body-container flex-1 relative overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, ease: "linear", delay: 0.2 }}
                >
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
                      >
                        <ThemedTileLayer />
                        <MapController
                          center={currentCenter}
                          onCenterChange={setCurrentCenter}
                          zoomLevel={16}
                        />
                        {mapData.origin && (
                          <>
                            <Marker
                              position={[
                                mapData.origin.lat,
                                mapData.origin.lng
                              ]}
                              icon={currentLocationIcon}
                            />
                            <RoutingService
                              start={mapData.origin}
                              end={mapData.coordinates}
                              travelMode={travelMode}
                              onLoadingChange={setIsRouteLoading}
                              onRouteData={setRouteInfo}
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
                      <div className="bg-background/95 rounded-xl border shadow-lg p-3 quicklink-stats-panel">
                        <p className="text-sm font-semibold text-center mb-2 truncate">
                          {mapData.mapName}
                        </p>
                        <div className="flex justify-center gap-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-amber-500 tabular-nums">
                              {mapData.not_done}
                            </div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                              {t("territory.notDone")}
                            </p>
                          </div>
                          <div className="text-center border-l pl-4">
                            <div className="text-xl font-bold text-sky-500 tabular-nums">
                              {mapData.not_home}
                            </div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                              {t("territory.notHome")}
                            </p>
                          </div>
                          <div className="text-center border-l pl-4">
                            <div className="text-xl font-bold text-emerald-500 tabular-nums">
                              {mapData.progress}%
                            </div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                              {t("territory.completed")}
                            </p>
                          </div>
                        </div>

                        {mapData.assignees.length > 0 && (
                          <div className="border-t pt-2 mt-2">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground text-center mb-1.5">
                              {t("territory.assignees")}
                            </p>
                            <div className="flex flex-wrap justify-center gap-1">
                              {mapData.assignees.map((assignee, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="px-2 py-0.5 text-xs"
                                >
                                  {assignee}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {routeInfo && (
                          <div className="border-t pt-2 mt-2 flex items-center justify-center gap-1.5">
                            <span className="text-sm font-semibold tabular-nums">
                              {travelMode === "DRIVING" ? "🚗" : "🚶"}{" "}
                              {formatDuration(routeInfo.duration)}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              ·
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistance(routeInfo.distance)}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </m.div>
                {mapData && (
                  <DialogFooter className="px-4 py-3 shrink-0 flex-row justify-around">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={modal.hide}
                    >
                      {t("common.cancel", "Cancel")}
                    </Button>
                    <Button type="submit" disabled={isSharing}>
                      {isSharing && (
                        <Spinner data-icon="inline-start" aria-hidden="true" />
                      )}
                      {t("generatedMap.share")}
                    </Button>
                  </DialogFooter>
                )}
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);

export default QuickLinkModal;
