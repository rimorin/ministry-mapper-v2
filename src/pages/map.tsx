import { useEffect, useState, lazy, use } from "react";
import { useTranslation } from "react-i18next";

import { configureHeader, getDataById, getList } from "../utils/pocketbase";
import { Image, Nav, Navbar } from "react-bootstrap";
import { addressDetails, latlongInterface } from "../utils/interface";
import { Policy } from "../utils/policies";
import { getAssetUrl } from "../utils/helpers/assetpath";
import { handleKeyboardActivation } from "../utils/helpers/keyboard";
import Legend from "../components/navigation/legend";
import InvalidPage from "../components/statics/invalidpage";
import MainTable from "../components/table/map";
import MapPlaceholder from "../components/statics/placeholder";
import TopNavbar from "../components/navigation/topnavbar";
import useNotification from "../hooks/useNotification";
import {
  TERRITORY_TYPES,
  DEFAULT_COORDINATES,
  MESSAGE_TYPES,
  USER_ACCESS_LEVELS,
  PB_SECURITY_HEADER_KEY,
  PB_FIELDS
} from "../utils/constants";
import "../css/slip.css";
import { RecordModel } from "pocketbase";
import useLocalStorage from "../hooks/useLocalStorage";
import { useParams } from "wouter";
import useVisibilityChange from "../hooks/useVisibilityManagement";
import { LanguageContext } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import { useModalManagement } from "../hooks/useModalManagement";
import useRealtimeSubscription from "../hooks/useRealtime";
const GetMapGeolocation = lazy(() => import("../components/modal/getlocation"));
const UpdateMapMessages = lazy(() => import("../components/modal/mapmessages"));
const ShowExpiry = lazy(() => import("../components/modal/slipexpiry"));
const ThemeSettingsModal = lazy(
  () => import("../components/modal/themesettings")
);

const Map = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { notifyError } = useNotification();
  const { currentLanguage, changeLanguage, languageOptions } =
    use(LanguageContext);
  const [isLinkExpired, setIsLinkExpired] = useState(false);
  const [tokenEndTime, setTokenEndTime] = useState(0);
  const [showLegend, setShowLegend] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [coordinates, setCoordinates] = useState<latlongInterface>(
    DEFAULT_COORDINATES.Singapore
  );
  const [policy, setPolicy] = useState<Policy>(new Policy());
  const [mapDetails, setMapDetails] = useState<addressDetails>();
  const [mapView, setMapView] = useState(false);
  const [hasPinnedMessages, setHasPinnedMessages] = useState(false);
  const [readPinnedMessages, setReadPinnedMessages] = useLocalStorage(
    `${id}-readPinnedMessages`,
    "false"
  );
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const { showModal } = useModalManagement();

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

  const checkPinnedMessages = async (map: string) => {
    if (!map) return;
    if (readPinnedMessages === "true") return;
    const pinnedMessages = await getList("messages", {
      filter: `map = "${map}" && type= "${MESSAGE_TYPES.ADMIN}" && pinned = true`,
      fields: "id",
      requestKey: null
    });
    setHasPinnedMessages(pinnedMessages.length > 0);
  };

  const retrieveLinkData = async (
    id: string
  ): Promise<addressDetails | undefined> => {
    const linkRecord = await getDataById("assignments", id, {
      requestKey: null,
      expand: "map, map.congregation",
      fields: PB_FIELDS.ASSIGNMENT_LINKS
    });
    if (!linkRecord) {
      setIsLinkExpired(true);
      return;
    }
    const congId = linkRecord.expand?.map.expand?.congregation.id;
    const congOptions = await getList("options", {
      filter: `congregation="${congId}"`,
      requestKey: null,
      fields: PB_FIELDS.CONGREGATION_OPTIONS,
      sort: "sequence"
    });
    const expiryTimestamp = new Date(linkRecord.expiry_date).getTime();
    setTokenEndTime(expiryTimestamp);
    const currentTimestamp = new Date().getTime();
    const isLinkExpired = currentTimestamp > expiryTimestamp;
    setIsLinkExpired(isLinkExpired);
    if (isLinkExpired) {
      return;
    }
    setCoordinates(
      linkRecord.expand?.map.coordinates || DEFAULT_COORDINATES.Singapore
    );
    setPolicy(
      new Policy(
        linkRecord.publisher,
        congOptions.map((option: RecordModel) => {
          return {
            id: option.id,
            code: option.code,
            description: option.description,
            isCountable: option.is_countable,
            isDefault: option.is_default,
            sequence: option.sequence
          };
        }),
        linkRecord.expand?.map.expand?.congregation.max_tries,
        linkRecord.expand?.map.expand?.congregation.origin,
        USER_ACCESS_LEVELS.PUBLISHER.CODE,
        linkRecord.expand?.map.expand?.congregation.expiry_hours,
        congId
      )
    );

    const details = {
      id: linkRecord.map,
      type: linkRecord.expand?.map.type || TERRITORY_TYPES.MULTIPLE_STORIES,
      location: linkRecord.expand?.map.location || "",
      aggregates: {
        display: linkRecord.expand?.map.progress + "%",
        value: linkRecord.expand?.map.progress
      },
      name: linkRecord.expand?.map.description,
      coordinates: linkRecord.expand?.map.coordinates
    } as addressDetails;

    if (localStorage.getItem(`${id}-readPinnedMessages`) === null) {
      checkPinnedMessages(linkRecord.map);
    }
    setMapDetails(details);
    return details;
  };

  const getMapData = async (linkId: string | undefined) => {
    if (!linkId) return;
    try {
      const mapDetails = await retrieveLinkData(linkId);
      if (!mapDetails) {
        return;
      }
      return mapDetails.id;
    } catch (error) {
      notifyError(error, true);
    } finally {
      setIsLoading(false);
    }
  };

  const [mapId, setMapId] = useState<string | undefined>();

  useEffect(() => {
    if (!id) return;
    const init = async (linkId: string) => {
      configureHeader(linkId);
      const resolvedMapId = await getMapData(linkId);
      setMapId(resolvedMapId);
    };
    init(id);
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
  useVisibilityChange(() => getMapData(id));

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
  if (isLinkExpired) {
    document.title = "Ministry Mapper";
    return <InvalidPage />;
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
