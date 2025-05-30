import { useEffect, useState, useCallback, lazy, useContext } from "react";
import { useTranslation } from "react-i18next";

import {
  configureHeader,
  getDataById,
  getList,
  setupRealtimeListener,
  unsubscriber
} from "../utils/pocketbase";
import { Container, Image, Nav, Navbar } from "react-bootstrap";
import { addressDetails, latlongInterface } from "../utils/interface";
import { Policy } from "../utils/policies";
import Legend from "../components/navigation/legend";
import Loader from "../components/statics/loader";
import InvalidPage from "../components/statics/invalidpage";
import MainTable from "../components/table/map";
import errorHandler from "../utils/helpers/errorhandler";
import {
  TERRITORY_TYPES,
  WIKI_CATEGORIES,
  DEFAULT_COORDINATES,
  MESSAGE_TYPES,
  USER_ACCESS_LEVELS,
  PB_SECURITY_HEADER_KEY,
  PB_FIELDS
} from "../utils/constants";
import "../css/slip.css";
import { RecordModel } from "pocketbase";
import useLocalStorage from "../utils/helpers/storage";
import { useParams } from "wouter";
import useVisibilityChange from "../components/utils/visibilitychange";
import { LanguageContext } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import modalManagement from "../hooks/modalManagement";
const GetMapGeolocation = lazy(() => import("../components/modal/getlocation"));
const UpdateMapMessages = lazy(() => import("../components/modal/mapmessages"));
const ShowExpiry = lazy(() => import("../components/modal/slipexpiry"));

const Map = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, languageOptions } =
    useContext(LanguageContext);
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

  const { showModal } = modalManagement();

  const toggleLegend = useCallback(() => {
    setShowLegend((prevShowLegend) => !prevShowLegend);
  }, []);

  const toggleLanguageSelector = useCallback(() => {
    setShowLanguageSelector(
      (prevShowLanguageSelector) => !prevShowLanguageSelector
    );
  }, []);

  const handleMessageClick = useCallback(() => {
    if (hasPinnedMessages) {
      setReadPinnedMessages("true");
    }
    showModal(UpdateMapMessages, {
      name: mapDetails?.name,
      mapId: mapDetails?.id,
      helpLink: WIKI_CATEGORIES.PUBLISHER_ADDRESS_FEEDBACK,
      policy: policy,
      messageType: MESSAGE_TYPES.PUBLISHER,
      assignmentId: id
    });
  }, [
    hasPinnedMessages,
    readPinnedMessages,
    mapDetails?.name,
    mapDetails?.id,
    id
  ]);

  const toggleMapView = useCallback(() => {
    setMapView((prevMapView) => !prevMapView);
  }, []);

  const showLocationModal = useCallback(() => {
    showModal(GetMapGeolocation, {
      coordinates: coordinates,
      name: mapDetails?.name,
      origin: policy.origin
    });
  }, [coordinates, policy.origin, mapDetails?.name]);

  const showExpiryModal = useCallback(() => {
    showModal(ShowExpiry, {
      endtime: tokenEndTime
    });
  }, [tokenEndTime]);

  const handleLanguageSelect = useCallback((language: string) => {
    changeLanguage(language);
    toggleLanguageSelector();
  }, []);

  const checkPinnedMessages = useCallback(
    async (map: string) => {
      if (!map) return;
      if (readPinnedMessages === "true") return;
      const pinnedMessages = await getList("messages", {
        filter: `map = "${map}" && type= "${MESSAGE_TYPES.ADMIN}" && pinned = true`,
        fields: "id",
        requestKey: null
      });
      setHasPinnedMessages(pinnedMessages.length > 0);
    },
    [readPinnedMessages]
  );

  const retrieveLinkData = useCallback(
    async (id: string): Promise<addressDetails | undefined> => {
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
          linkRecord.expand?.map.expand?.congregation.expiry_hours
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
        mapId: linkRecord.expand?.map.code,
        name: linkRecord.expand?.map.description,
        coordinates: linkRecord.expand?.map.coordinates
      } as addressDetails;

      if (localStorage.getItem(`${id}-readPinnedMessages`) === null) {
        checkPinnedMessages(linkRecord.map);
      }
      setMapDetails(details);
      return details;
    },
    []
  );

  const getMapData = useCallback(async (linkId: string | undefined) => {
    if (!linkId) return;
    try {
      const mapDetails = await retrieveLinkData(linkId);
      if (!mapDetails) {
        return;
      }
      const mapId = mapDetails.id;
      setupRealtimeListener(
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
          requestKey: null,
          fields: PB_FIELDS.MAPS,
          headers: {
            [PB_SECURITY_HEADER_KEY]: linkId as string
          }
        },
        mapId
      );
    } catch (error) {
      errorHandler(error, false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    configureHeader(id);
    getMapData(id);
    return () => {
      unsubscriber(["maps", "addresses"]);
    };
  }, [id]);
  useVisibilityChange(() => getMapData(id));

  if (isLoading) return <Loader />;
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
      <Navbar bg="light" expand="sm">
        <Container fluid>
          <Navbar.Brand
            className="brand-wrap d-flex align-items-center"
            style={{ width: "100%", marginRight: 0 }}
          >
            <div style={{ flex: 0, textAlign: "left", marginRight: 10 }}>
              <img
                src="https://assets.ministry-mapper.com/favicon-32x32.png"
                alt=""
                width="32"
                height="32"
                className="d-inline-block align-top"
              />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <Navbar.Text className="fluid-bolding fluid-text">
                {mapDetails?.name}
              </Navbar.Text>
            </div>
            <div style={{ flex: 0, textAlign: "right", marginLeft: 10 }}>
              <Image
                src="https://assets.ministry-mapper.com/information.svg"
                alt="Legend"
                onClick={toggleLegend}
              />
            </div>
          </Navbar.Brand>
        </Container>
      </Navbar>
      {mapDetails && (
        <MainTable
          key={`link-map-${id}`}
          mapView={mapView}
          policy={policy}
          addressDetails={mapDetails}
          assignmentId={id}
        />
      )}
      <Navbar bg="light">
        <Nav className="w-100 justify-content-between mx-4">
          <Nav.Item
            className={`text-center nav-item-hover`}
            onClick={handleMessageClick}
          >
            <Image
              src="https://assets.ministry-mapper.com/feedback.svg"
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
            >
              {mapView ? (
                <>
                  <Image
                    src="https://assets.ministry-mapper.com/gridmode.svg"
                    alt="Grid"
                  />
                  <div className="small">
                    {t("navigation.listView", "List View")}
                  </div>
                </>
              ) : (
                <>
                  <Image
                    src="https://assets.ministry-mapper.com/mapmode.svg"
                    alt="Map"
                  />
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
          >
            <Image
              src="https://assets.ministry-mapper.com/maplocation.svg"
              alt="Location"
            />
            <div className="small">{t("common.Directions", "Directions")}</div>
          </Nav.Item>
          <Nav.Item
            className="text-center nav-item-hover"
            onClick={showExpiryModal}
          >
            <Image
              src="https://assets.ministry-mapper.com/time.svg"
              alt="Expiry"
            />
            <div className="small">{t("common.Expiry", "Expiry")}</div>
          </Nav.Item>
          <Nav.Item
            className="text-center nav-item-hover"
            onClick={toggleLanguageSelector}
          >
            <Image
              src="https://assets.ministry-mapper.com/language.svg"
              alt="Language"
            />
            <div className="small">{currentLanguage}</div>
          </Nav.Item>
        </Nav>
      </Navbar>
    </>
  );
};

export default Map;
