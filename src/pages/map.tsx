import { useEffect, useState, lazy, use } from "react";
import { useTranslation } from "react-i18next";

import { configureHeader } from "../utils/pocketbase";
import { Image, Nav, Navbar } from "react-bootstrap";
import { getAssetUrl } from "../utils/helpers/assetpath";
import { handleKeyboardActivation } from "../utils/helpers/keyboard";
import Legend from "../components/navigation/legend";
import InvalidPage from "../components/statics/invalidpage";
import MainTable from "../components/table/map";
import MapPlaceholder from "../components/statics/placeholder";
import TopNavbar from "../components/navigation/topnavbar";
import {
  TERRITORY_TYPES,
  MESSAGE_TYPES,
  PB_SECURITY_HEADER_KEY,
  PB_FIELDS
} from "../utils/constants";
import "../css/slip.css";
import useLocalStorage from "../hooks/useLocalStorage";
import { useParams } from "wouter";
import useVisibilityChange from "../hooks/useVisibilityManagement";
import { LanguageContext } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import { useModalManagement } from "../hooks/useModalManagement";
import useRealtimeSubscription from "../hooks/useRealtime";
import useMapLink from "../hooks/useMapLink";
const GetMapGeolocation = lazy(() => import("../components/modal/getlocation"));
const UpdateMapMessages = lazy(() => import("../components/modal/mapmessages"));
const ShowExpiry = lazy(() => import("../components/modal/slipexpiry"));
const ThemeSettingsModal = lazy(
  () => import("../components/modal/themesettings")
);

const Map = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, languageOptions } =
    use(LanguageContext);
  const [showLegend, setShowLegend] = useState(false);
  const [mapView, setMapView] = useState(false);
  const [readPinnedMessages, setReadPinnedMessages] = useLocalStorage(
    `${id}-readPinnedMessages`,
    "false"
  );
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const { showModal } = useModalManagement();
  const {
    isLinkExpired,
    tokenEndTime,
    isLoading,
    coordinates,
    policy,
    mapDetails,
    setMapDetails,
    hasPinnedMessages,
    setHasPinnedMessages,
    getMapData
  } = useMapLink();

  const toggleLegend = () => {
    setShowLegend((prevShowLegend) => !prevShowLegend);
  };

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
    showModal(UpdateMapMessages, {
      name: mapDetails?.name,
      mapId: mapDetails?.id,
      policy: policy,
      messageType: MESSAGE_TYPES.PUBLISHER,
      assignmentId: id
    });
  };

  const toggleMapView = () => {
    setMapView((prevMapView) => !prevMapView);
  };

  const showLocationModal = () => {
    showModal(GetMapGeolocation, {
      coordinates: coordinates,
      name: mapDetails?.name,
      origin: policy.origin
    });
  };

  const showExpiryModal = () => {
    showModal(ShowExpiry, {
      endtime: tokenEndTime
    });
  };

  const handleLanguageSelect = (language: string) => {
    changeLanguage(language);
    toggleLanguageSelector();
  };

  const handleOpenThemeSettings = () => {
    showModal(ThemeSettingsModal, {});
  };

  const [mapId, setMapId] = useState<string | undefined>();

  useEffect(() => {
    if (!id) return;
    const init = async (linkId: string) => {
      configureHeader(linkId);
      const resolvedMapId = await getMapData(linkId, readPinnedMessages);
      setMapId(resolvedMapId);
    };
    init(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- React Compiler memoizes getMapData and readPinnedMessages
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
            notDone: mapData.aggregates?.not_done,
            notHome: mapData.aggregates?.not_home
          },
          location: mapData.location,
          name: mapData.description,
          coordinates: mapData.coordinates
        };
      });
    },
    {
      filter: `id="${mapId}"`,
      fields: PB_FIELDS.MAPS,
      headers: {
        [PB_SECURITY_HEADER_KEY]: id as string
      }
    },
    [mapId, id],
    !!mapId && !!id
  );
  useVisibilityChange(() => {
    if (id) getMapData(id, readPinnedMessages);
  });

  useEffect(() => {
    if (isLinkExpired) document.title = "Ministry Mapper";
  }, [isLinkExpired]);

  if (isLinkExpired) {
    return <InvalidPage />;
  }
  if (isLoading) {
    return (
      <>
        <TopNavbar
          title={t("common.Loading", "Loading...")}
          onLegendClick={toggleLegend}
        />
        <MapPlaceholder policy={policy} />
      </>
    );
  }

  return (
    <>
      <Legend showLegend={showLegend} hideFunction={toggleLegend} />
      <LanguageSelector
        showListing={showLanguageSelector}
        hideFunction={toggleLanguageSelector}
        handleSelect={handleLanguageSelect}
        currentLanguage={currentLanguage}
        languageOptions={languageOptions}
      />
      <div className="map-content">
        <TopNavbar
          title={mapDetails?.name || ""}
          onLegendClick={toggleLegend}
        />
        {mapDetails && (
          <MainTable
            key={`link-map-${id}`}
            mapView={mapView}
            policy={policy}
            addressDetails={mapDetails}
            assignmentId={id}
          />
        )}
        <Navbar>
          <Nav className="w-100 justify-content-between mx-4">
            <Nav.Item
              className={`text-center nav-item-hover`}
              onClick={handleMessageClick}
              tabIndex={0}
              onKeyDown={(e) => handleKeyboardActivation(e, handleMessageClick)}
              role="button"
              aria-label={t("common.Messages", "Messages")}
            >
              <Image
                src={getAssetUrl("feedback.svg")}
                alt="Feedback"
                className={
                  hasPinnedMessages && readPinnedMessages === "false"
                    ? "highlighted"
                    : ""
                }
              />
              <div className="small">{t("common.Messages", "Messages")}</div>
            </Nav.Item>
            {mapDetails?.type === TERRITORY_TYPES.SINGLE_STORY && (
              <Nav.Item
                className="text-center nav-item-hover"
                onClick={toggleMapView}
                tabIndex={0}
                onKeyDown={(e) => handleKeyboardActivation(e, toggleMapView)}
                role="button"
                aria-label={
                  mapView
                    ? t("navigation.listView", "List View")
                    : t("navigation.mapView", "Map View")
                }
              >
                {mapView ? (
                  <>
                    <Image src={getAssetUrl("gridmode.svg")} alt="Grid" />
                    <div className="small">
                      {t("navigation.listView", "List View")}
                    </div>
                  </>
                ) : (
                  <>
                    <Image src={getAssetUrl("mapmode.svg")} alt="Map" />
                    <div className="small">
                      {t("navigation.mapView", "Map View")}
                    </div>
                  </>
                )}
              </Nav.Item>
            )}
            <Nav.Item
              className="text-center nav-item-hover"
              onClick={showLocationModal}
              tabIndex={0}
              onKeyDown={(e) => handleKeyboardActivation(e, showLocationModal)}
              role="button"
              aria-label={t("common.Directions", "Directions")}
            >
              <Image src={getAssetUrl("maplocation.svg")} alt="Location" />
              <div className="small">
                {t("common.Directions", "Directions")}
              </div>
            </Nav.Item>
            <Nav.Item
              className="text-center nav-item-hover"
              onClick={showExpiryModal}
              tabIndex={0}
              onKeyDown={(e) => handleKeyboardActivation(e, showExpiryModal)}
              role="button"
              aria-label={t("common.Expiry", "Expiry")}
            >
              <Image src={getAssetUrl("time.svg")} alt="Expiry" />
              <div className="small">{t("common.Expiry", "Expiry")}</div>
            </Nav.Item>
            <Nav.Item
              className="text-center nav-item-hover"
              onClick={toggleLanguageSelector}
              tabIndex={0}
              onKeyDown={(e) =>
                handleKeyboardActivation(e, toggleLanguageSelector)
              }
              role="button"
              aria-label={t("common.Language", "Language")}
            >
              <Image
                src={getAssetUrl("language.svg")}
                alt="Language"
                className="language-icon"
              />
              <div className="small">{currentLanguage}</div>
            </Nav.Item>
            <Nav.Item
              className="text-center nav-item-hover"
              onClick={handleOpenThemeSettings}
              tabIndex={0}
              onKeyDown={(e) =>
                handleKeyboardActivation(e, handleOpenThemeSettings)
              }
              role="button"
              aria-label={t("theme.settings", "Theme Settings")}
            >
              <Image
                src={getAssetUrl("dark-theme.svg")}
                alt="Theme"
                className="theme-icon"
              />
              <div className="small">{t("theme.theme", "Theme")}</div>
            </Nav.Item>
          </Nav>
        </Navbar>
      </div>
    </>
  );
};

export default Map;
