import { useEffect, useState, useCallback, lazy } from "react";
import { useParams } from "react-router-dom";
import { usePostHog } from "posthog-js/react";
import { useRollbar } from "@rollbar/react";
import { pb } from "../pocketbase";
import { Container, Nav, Navbar } from "react-bootstrap";
import { addressDetails, latlongInterface } from "../utils/interface";
import { Policy } from "../utils/policies";
import Legend from "../components/navigation/legend";
import Loader from "../components/statics/loader";
import InvalidPage from "../components/statics/invalidpage";
import SuspenseComponent from "../components/utils/suspense";
import MainTable from "../components/table/admin";
import ModalManager from "@ebay/nice-modal-react";
import GetDirection from "../utils/helpers/directiongenerator";
import errorHandler from "../utils/helpers/errorhandler";
import {
  TERRITORY_TYPES,
  WIKI_CATEGORIES,
  DEFAULT_COORDINATES,
  MESSAGE_TYPES
} from "../utils/constants";
import "../css/slip.css";
import InfoImg from "../assets/information.svg?react";
import FeedbackImg from "../assets/feedback.svg?react";
import MapLocationImg from "../assets/maplocation.svg?react";
import TimeImg from "../assets/time.svg?react";
import MapMode from "../assets/mapmode.svg?react";
import GridMode from "../assets/gridmode.svg?react";
import { RecordModel } from "pocketbase";
import getDataById from "../utils/helpers/getdatabyid";

const UpdateMapMessages = lazy(() => import("../components/modal/mapmessages"));
const ShowExpiry = lazy(() => import("../components/modal/slipexpiry"));

const Map = () => {
  const { id } = useParams();
  const [isLinkExpired, setIsLinkExpired] = useState<boolean>(false);
  const [tokenEndTime, setTokenEndTime] = useState<number>(0);
  const [mapId, setMapId] = useState<string>("");

  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mapName, setMapName] = useState<string>();
  const [coordinates, setCoordinates] = useState<latlongInterface>(
    DEFAULT_COORDINATES.Singapore
  );
  const [policy, setPolicy] = useState<Policy>(new Policy());
  const [mapDetails, setMapDetails] = useState<addressDetails>();
  const [mapView, setMapView] = useState<boolean>(false);
  const posthog = usePostHog();
  const rollbar = useRollbar();

  const toggleLegend = useCallback(() => {
    setShowLegend(!showLegend);
  }, [showLegend]);

  useEffect(() => {
    if (!id) return;

    pb.beforeSend = (url, options) => {
      options.headers = {
        ...options.headers,
        "link-id": id
      };
      return { url, options };
    };
    const getLinkData = async () => {
      try {
        const linkRecord = await getDataById("assignments", id, {
          requestKey: `link-${id}`,
          expand:
            "map, map.congregation, map.congregation.sorted_options_via_congregation"
        });
        if (!linkRecord) {
          setIsLinkExpired(true);
          return;
        }
        setMapId(linkRecord.map);
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
        setMapName(linkRecord.expand?.map.description);
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
            linkRecord.expand?.map.expand?.congregation.origin
          )
        );
        posthog?.identify(linkRecord.expand?.map.expand?.congregation.id);

        const details = {
          id: linkRecord.expand?.map.id,
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
            requestKey: `slip-map-${linkRecord.id}`
          }
        );

        setMapDetails(details);
      } catch (error: any) {
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
  }, [id]);

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
                alt=""
                src="/favicon-32x32.png"
                width="32"
                height="32"
                className="d-inline-block align-top"
              />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <Navbar.Text className="fluid-bolding fluid-text">
                {mapName}
              </Navbar.Text>
            </div>
            <div style={{ flex: 0, textAlign: "right", marginLeft: 10 }}>
              <InfoImg
                onClick={() => {
                  posthog?.capture("info_button_clicked", {
                    mapId: mapId
                  });
                  toggleLegend();
                }}
              />
            </div>
          </Navbar.Brand>
        </Container>
      </Navbar>
      <MainTable
        mapView={mapView}
        policy={policy}
        addressDetails={mapDetails as addressDetails}
      />
      <Navbar bg="light">
        <Nav className="w-100 justify-content-between mx-4">
          <Nav.Item
            className="text-center nav-item-hover"
            onClick={() =>
              ModalManager.show(SuspenseComponent(UpdateMapMessages), {
                name: mapName,
                mapId: mapId,
                helpLink: WIKI_CATEGORIES.PUBLISHER_ADDRESS_FEEDBACK,
                policy: policy,
                messageType: MESSAGE_TYPES.PUBLISHER
              })
            }
          >
            <FeedbackImg />
            <div className="small">Messages</div>
          </Nav.Item>
          {mapDetails?.type === TERRITORY_TYPES.SINGLE_STORY && (
            <Nav.Item
              className="text-center nav-item-hover"
              onClick={() => setMapView(!mapView)}
            >
              {mapView ? (
                <>
                  <GridMode />
                  <div className="small">Grid View</div>
                </>
              ) : (
                <>
                  <MapMode />
                  <div className="small">Map View</div>
                </>
              )}
            </Nav.Item>
          )}
          <Nav.Item
            className="text-center nav-item-hover"
            onClick={() => {
              posthog?.capture("directions_button_clicked", {
                mapId: mapId
              });
              window.open(GetDirection(coordinates), "_blank");
            }}
          >
            <MapLocationImg />
            <div className="small">Directions</div>
          </Nav.Item>
          <Nav.Item
            className="text-center nav-item-hover"
            onClick={() => {
              posthog?.capture("expiry_button_clicked", {
                mapId: mapId
              });
              ModalManager.show(SuspenseComponent(ShowExpiry), {
                endtime: tokenEndTime
              });
            }}
          >
            <TimeImg />
            <div>Expiry</div>
          </Nav.Item>
        </Nav>
      </Navbar>
    </>
  );
};

export default Map;
