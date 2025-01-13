import { useEffect, useState, useCallback, lazy, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useRollbar } from "@rollbar/react";
import { pb } from "../utils/pocketbase";
import { Container, Image, Nav, Navbar } from "react-bootstrap";
import { addressDetails, latlongInterface } from "../utils/interface";
import { Policy } from "../utils/policies";
import Legend from "../components/navigation/legend";
import Loader from "../components/statics/loader";
import InvalidPage from "../components/statics/invalidpage";
import SuspenseComponent from "../components/utils/suspense";
import MainTable from "../components/table/map";
import ModalManager from "@ebay/nice-modal-react";
import errorHandler from "../utils/helpers/errorhandler";
import {
  TERRITORY_TYPES,
  WIKI_CATEGORIES,
  DEFAULT_COORDINATES,
  MESSAGE_TYPES,
  USER_ACCESS_LEVELS,
  PB_SECURITY_HEADER_KEY
} from "../utils/constants";
import "../css/slip.css";
import { RecordModel } from "pocketbase";
import getDataById from "../utils/helpers/getdatabyid";
import useLocalStorage from "../utils/helpers/storage";
const GetMapGeolocation = lazy(() => import("../components/modal/getlocation"));
const UpdateMapMessages = lazy(() => import("../components/modal/mapmessages"));
const ShowExpiry = lazy(() => import("../components/modal/slipexpiry"));

const Map = () => {
  const { id } = useParams();
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
  const rollbar = useRollbar();

  const toggleLegend = useCallback(() => {
    setShowLegend((prevShowLegend) => !prevShowLegend);
  }, []);

  useEffect(() => {
    if (!id) return;

    // Note: The beforeSend function does not apply to realtime subscriptions, only to REST API requests.
    // Therefore, headers must be set manually for realtime subscriptions.
    pb.beforeSend = (url, options) => {
      options.headers = {
        ...options.headers,
        [PB_SECURITY_HEADER_KEY]: id as string
      };
      return { url, options };
    };

    const checkPinnedMessages = async (map: string) => {
      if (readPinnedMessages === "true") return;
      const pinnedMessages = await pb.collection("messages").getFullList({
        filter: `map = "${map}" && type= "${MESSAGE_TYPES.ADMIN}" && pinned = true`,
        fields: "id, read",
        requestKey: `unread-msg-${mapDetails?.id}`
      });
      setHasPinnedMessages(pinnedMessages.length > 0);
    };
    const getLinkData = async () => {
      try {
        const linkRecord = await getDataById("assignments", id, {
          requestKey: `slip-data-${id}`,
          expand:
            "map, map.congregation, map.congregation.sorted_options_via_congregation"
        });
        if (!linkRecord) {
          setIsLinkExpired(true);
          return;
        }
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
            linkRecord.expand?.map.expand?.congregation.expand?.sorted_options_via_congregation.map(
              (option: RecordModel) => {
                return {
                  id: option.id,
                  code: option.code,
                  description: option.description,
                  isCountable: option.is_countable,
                  isDefault: option.is_default,
                  sequence: option.sequence
                };
              }
            ),
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

        setMapDetails(details);
        if (localStorage.getItem(`${id}-readPinnedMessages`) === null) {
          checkPinnedMessages(linkRecord.map);
        }

        pb.collection("maps").subscribe(
          linkRecord.map,
          (sub) => {
            const data = sub.record;
            setMapDetails({
              ...details,
              aggregates: {
                display: data.progress + "%",
                value: data.progress
              },
              location: data.location,
              name: data.description,
              coordinates: data.coordinates
            });
          },
          {
            requestKey: `slip-sub-${linkRecord.id}`,
            headers: {
              [PB_SECURITY_HEADER_KEY]: id as string
            }
          }
        );
      } catch (error) {
        errorHandler(error, rollbar, false);
      } finally {
        setIsLoading(false);
      }
    };
    getLinkData();

    return () => {
      pb.collection("maps").unsubscribe();
      pb.collection("messages").unsubscribe();
      pb.collection("addresses").unsubscribe();
    };
  }, []);

  const memoizedMapDetails = useMemo(() => mapDetails, [mapDetails]);
  const memoizedPolicy = useMemo(() => policy, [policy]);
  const memoizedCoordinates = useMemo(() => coordinates, [coordinates]);

  if (isLoading) return <Loader />;
  if (isLinkExpired) {
    document.title = "Ministry Mapper";
    return <InvalidPage />;
  }

  return (
    <>
      <Legend showLegend={showLegend} hideFunction={toggleLegend} />
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
                onClick={() => {
                  toggleLegend();
                }}
              />
            </div>
          </Navbar.Brand>
        </Container>
      </Navbar>
      {memoizedMapDetails && (
        <MainTable
          mapView={mapView}
          policy={memoizedPolicy}
          addressDetails={memoizedMapDetails as addressDetails}
          assignmentId={id}
        />
      )}
      <Navbar bg="light">
        <Nav className="w-100 justify-content-between mx-4">
          <Nav.Item
            className={`text-center nav-item-hover`}
            onClick={() => {
              if (hasPinnedMessages) {
                setReadPinnedMessages("true");
              }
              ModalManager.show(SuspenseComponent(UpdateMapMessages), {
                name: mapDetails?.name,
                mapId: mapDetails?.id,
                helpLink: WIKI_CATEGORIES.PUBLISHER_ADDRESS_FEEDBACK,
                policy: memoizedPolicy,
                messageType: MESSAGE_TYPES.PUBLISHER,
                assignmentId: id
              });
            }}
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
            <div className="small">Messages</div>
          </Nav.Item>
          {mapDetails?.type === TERRITORY_TYPES.SINGLE_STORY && (
            <Nav.Item
              className="text-center nav-item-hover"
              onClick={() => {
                setMapView((prevMapView) => !prevMapView);
              }}
            >
              {mapView ? (
                <>
                  <Image
                    src="https://assets.ministry-mapper.com/gridmode.svg"
                    alt="Grid"
                  />
                  <div className="small">Grid View</div>
                </>
              ) : (
                <>
                  <Image
                    src="https://assets.ministry-mapper.com/mapmode.svg"
                    alt="Map"
                  />
                  <div className="small">Map View</div>
                </>
              )}
            </Nav.Item>
          )}
          <Nav.Item
            className="text-center nav-item-hover"
            onClick={() => {
              ModalManager.show(SuspenseComponent(GetMapGeolocation), {
                coordinates: memoizedCoordinates,
                name: mapDetails?.name,
                origin: policy.origin
              });
            }}
          >
            {/* <MapLocationImg /> */}
            <Image
              src="https://assets.ministry-mapper.com/maplocation.svg"
              alt="Location"
            />
            <div className="small">Directions</div>
          </Nav.Item>
          <Nav.Item
            className="text-center nav-item-hover"
            onClick={() => {
              ModalManager.show(SuspenseComponent(ShowExpiry), {
                endtime: tokenEndTime
              });
            }}
          >
            <Image
              src="https://assets.ministry-mapper.com/time.svg"
              alt="Expiry"
            />
            <div>Expiry</div>
          </Nav.Item>
        </Nav>
      </Navbar>
    </>
  );
};

export default Map;
