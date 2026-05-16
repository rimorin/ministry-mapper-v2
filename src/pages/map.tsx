import { useEffect, useState, use, lazy } from "react";
import { useTranslation } from "react-i18next";
import {
  MessageSquareDot,
  Navigation,
  Languages,
  Palette,
  LayoutGrid,
  Map as MapIcon
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { tapFeedback, enterTransition } from "@/lib/motion";
import useAnimatedCounter from "../hooks/useAnimatedCounter";
import { configureHeader, clearHeader } from "../utils/pocketbase";
import { ReleaseNotifier } from "../components/statics/releasenotifier";
import { cn } from "@/lib/utils";
import { resolveLocalized } from "../utils/resolveLocalized";
import InvalidPage from "../components/statics/invalidpage";
import MainTable from "../components/table/map";
import MapPlaceholder from "../components/statics/placeholder";
import TopNavbar from "../components/navigation/topnavbar";
import { mapAddressResponse } from "../utils/interface";
import {
  TERRITORY_TYPES,
  MESSAGE_TYPES,
  PB_SECURITY_HEADER_KEY,
  PB_FIELDS,
  ENDGAME_PROGRESS_THRESHOLD
} from "../utils/constants";
import useLocalStorage from "../hooks/useLocalStorage";
import { useParams } from "wouter";
import { LanguageContext } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import { useModalManagement } from "../hooks/useModalManagement";
import useRealtimeSubscription from "../hooks/useRealtime";
import useMapLink from "../hooks/useMapLink";
import useAnalytics, { ANALYTICS_EVENTS } from "../hooks/useAnalytics";
import { useSmartSync, SmartSyncProvider } from "../hooks/useSmartSync";
import { Progress } from "@/components/ui/progress";
const GetMapGeolocation = lazy(() => import("../components/modal/getlocation"));
const UpdateMapMessages = lazy(() => import("../components/modal/mapmessages"));
const ThemeSettingsModal = lazy(
  () => import("../components/modal/themesettings")
);

const Map = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { currentLanguage, changeLanguage, languageOptions } =
    use(LanguageContext);
  const [mapView, setMapView] = useState(false);
  const [readPinnedMessages, setReadPinnedMessages] = useLocalStorage(
    `${id}-readPinnedMessages`,
    "false"
  );
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const { showModal } = useModalManagement();
  const { trackEvent } = useAnalytics();
  const {
    isLinkExpired,
    tokenEndTime,
    isLoading,
    coordinates,
    policy,
    mapDetails,
    setMapDetails,
    territoryId,
    hasPinnedMessages,
    setHasPinnedMessages,
    getMapData,
    markLinkExpired
  } = useMapLink();

  const toggleLanguageSelector = () => {
    setShowLanguageSelector(
      (prevShowLanguageSelector) => !prevShowLanguageSelector
    );
  };

  const handleMessageClick = () => {
    if (hasPinnedMessages) {
      setReadPinnedMessages("true");
      setHasPinnedMessages(false);
    }
    trackEvent(ANALYTICS_EVENTS.MESSAGES_OPENED, {
      role: MESSAGE_TYPES.PUBLISHER
    });
    showModal(UpdateMapMessages, {
      name: mapDetails?.name,
      mapId: mapDetails?.id,
      policy,
      messageType: MESSAGE_TYPES.PUBLISHER,
      assignmentId: id
    });
  };

  const toggleMapView = () => {
    setMapView((prevMapView) => {
      trackEvent(ANALYTICS_EVENTS.MAP_VIEW_TOGGLED, {
        view: prevMapView ? "list" : "map"
      });
      return !prevMapView;
    });
  };

  const showLocationModal = () => {
    trackEvent(ANALYTICS_EVENTS.ADDRESS_DIRECTIONS_OPENED);
    showModal(GetMapGeolocation, {
      coordinates,
      name: mapDetails?.name,
      origin: policy.origin
    });
  };

  const handleLanguageSelect = (language: string) => {
    changeLanguage(language);
    trackEvent(ANALYTICS_EVENTS.LANGUAGE_CHANGED, { language });
    toggleLanguageSelector();
  };

  const handleOpenThemeSettings = () => {
    showModal(ThemeSettingsModal, {});
  };

  const [mapId, setMapId] = useState<string | undefined>();
  const [preloadedAddresses, setPreloadedAddresses] = useState<
    mapAddressResponse[] | undefined
  >();
  const smartSync = useSmartSync(mapId ? { mapId } : undefined);
  const { isOnline, displayPendingCount } = smartSync;

  useEffect(() => {
    if (!id) return;
    const init = async (linkId: string) => {
      configureHeader(linkId);
      const result = await getMapData(linkId);
      if (result) {
        setMapId(result.mapId);
        setPreloadedAddresses(result.preloadedAddresses);
      }
    };
    init(id);
    return () => clearHeader();
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- React Compiler memoizes getMapData
  }, [id]);

  useRealtimeSubscription(
    "maps",
    (data) => {
      const mapData = data.record;
      setMapDetails((prevDetails) => {
        if (!prevDetails) return prevDetails;
        return {
          ...prevDetails,
          aggregates: {
            display: mapData.progress + "%",
            value: mapData.progress,
            notDone: mapData.aggregates?.notDone,
            notHome: mapData.aggregates?.notHome
          },
          name: resolveLocalized(mapData.description, i18n.language),
          coordinates: mapData.coordinates
        };
      });
    },
    {
      fields: PB_FIELDS.MAPS,
      headers: {
        [PB_SECURITY_HEADER_KEY]: id as string
      }
    },
    [id],
    !!mapId && !!id,
    0,
    mapId
  );
  useEffect(() => {
    if (isLinkExpired) document.title = "Ministry Mapper";
  }, [isLinkExpired]);

  const animatedProgress = useAnimatedCounter(
    mapDetails?.aggregates.value ?? 0
  );

  if (isLinkExpired) {
    return <InvalidPage />;
  }
  if (isLoading) {
    return (
      <>
        <TopNavbar title={t("common.Loading", "Loading...")} />
        <MapPlaceholder policy={policy} />
      </>
    );
  }

  const navItemClass =
    "flex min-w-0 flex-1 cursor-pointer select-none flex-col items-center gap-1.5 px-2 py-3 text-center text-xs transition-[background-color,box-shadow,border-radius] duration-200 ease-in motion-reduce:transition-none hover:rounded-[5px] hover:bg-[var(--mm-success-light)] hover:shadow-[0_0_0_5px_var(--mm-success-light-alpha-50)] focus-visible:rounded-[5px]";

  const isSingleStory = mapDetails?.type === TERRITORY_TYPES.SINGLE_STORY;

  const notDoneCount = mapDetails?.aggregates.notDone ?? 0;
  const notHomeCount = mapDetails?.aggregates.notHome ?? 0;
  // Surface the breakdown once the map enters its endgame, matching the cell
  // highlighting threshold (processAvailableColour in policies.ts).
  const showBreakdown =
    (mapDetails?.aggregates.value ?? 0) >= ENDGAME_PROGRESS_THRESHOLD;

  const currentLanguageLabel =
    languageOptions.find((opt) => currentLanguage.startsWith(opt.value))
      ?.label ?? t("common.Language", "Language");

  return (
    <>
      <ReleaseNotifier />
      <LanguageSelector
        showListing={showLanguageSelector}
        hideFunction={toggleLanguageSelector}
        handleSelect={handleLanguageSelect}
        currentLanguage={currentLanguage}
        languageOptions={languageOptions}
      />
      <div className="map-content flex h-dvh flex-col">
        <TopNavbar
          title={mapDetails?.name || ""}
          tokenEndTime={tokenEndTime}
          pendingCount={displayPendingCount}
          onTokenExpired={markLinkExpired}
        />
        <div className="flex-1 overflow-hidden relative">
          {mapDetails && (
            <SmartSyncProvider value={smartSync}>
              <MainTable
                key={`link-map-${id}`}
                mapView={mapView}
                policy={policy}
                addressDetails={mapDetails}
                assignmentId={id}
                territoryId={territoryId}
                preloadedAddresses={preloadedAddresses}
              />
            </SmartSyncProvider>
          )}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-background to-transparent" />
        </div>
        <m.nav
          className="shrink-0 border-t bg-background"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Map actions"
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={enterTransition}
        >
          {mapDetails && (
            <div className="flex flex-col gap-1.5 px-4 pt-2.5 pb-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {t("navigation.progress", "Progress")}
                </span>
                <span className="text-xs font-semibold tabular-nums">
                  {`${animatedProgress}%`}
                </span>
              </div>
              <Progress value={mapDetails.aggregates.value} className="h-1.5" />
              {showBreakdown && (notDoneCount > 0 || notHomeCount > 0) && (
                <span className="text-xs text-muted-foreground">
                  {[
                    notDoneCount > 0 &&
                      t("navigation.countNotDone", "{{count}} not done", {
                        count: notDoneCount
                      }),
                    notHomeCount > 0 &&
                      t("navigation.countNotHome", "{{count}} not home", {
                        count: notHomeCount
                      })
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              )}
            </div>
          )}
          <div
            className={cn(
              "flex items-stretch justify-between px-2",
              !isOnline && "pointer-events-none opacity-50"
            )}
          >
            <m.button
              type="button"
              className={navItemClass}
              onClick={handleMessageClick}
              aria-label={t("common.Messages", "Messages")}
              whileTap={tapFeedback}
            >
              <MessageSquareDot
                className={cn(
                  "size-5",
                  hasPinnedMessages &&
                    readPinnedMessages === "false" &&
                    "text-primary"
                )}
              />
              <span className="text-xs leading-none">
                {t("common.Messages", "Messages")}
              </span>
            </m.button>
            {isSingleStory && (
              <m.button
                type="button"
                className={navItemClass}
                onClick={toggleMapView}
                aria-label={
                  mapView
                    ? t("navigation.listView", "List View")
                    : t("navigation.mapView", "Map View")
                }
                whileTap={tapFeedback}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mapView ? (
                    <m.span
                      key="grid"
                      className="flex flex-col items-center gap-1.5"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.12 }}
                    >
                      <LayoutGrid className="size-5" />
                      <span className="text-xs leading-none">
                        {t("navigation.listView", "List View")}
                      </span>
                    </m.span>
                  ) : (
                    <m.span
                      key="map"
                      className="flex flex-col items-center gap-1.5"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.12 }}
                    >
                      <MapIcon className="size-5" />
                      <span className="text-xs leading-none">
                        {t("navigation.mapView", "Map View")}
                      </span>
                    </m.span>
                  )}
                </AnimatePresence>
              </m.button>
            )}
            <m.button
              type="button"
              className={navItemClass}
              onClick={showLocationModal}
              aria-label={t("common.Directions", "Directions")}
              whileTap={tapFeedback}
            >
              <Navigation className="size-5" />
              <span className="text-xs leading-none">
                {t("common.Directions", "Directions")}
              </span>
            </m.button>
            <m.button
              type="button"
              className={navItemClass}
              onClick={toggleLanguageSelector}
              aria-label={t("common.Language", "Language")}
              whileTap={tapFeedback}
            >
              <Languages className="size-5" />
              <span className="text-xs leading-none">
                {currentLanguageLabel}
              </span>
            </m.button>
            <m.button
              type="button"
              className={navItemClass}
              onClick={handleOpenThemeSettings}
              aria-label={t("theme.settings", "Theme Settings")}
              whileTap={tapFeedback}
            >
              <Palette className="size-5" />
              <span className="text-xs leading-none">
                {t("theme.theme", "Theme")}
              </span>
            </m.button>
          </div>
        </m.nav>
      </div>
    </>
  );
};

export default Map;
