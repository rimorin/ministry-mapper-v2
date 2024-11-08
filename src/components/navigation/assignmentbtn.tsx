import React, { lazy, useEffect } from "react";
import { ButtonGroup, Button, Spinner, Badge } from "react-bootstrap";
import ModalManager from "@ebay/nice-modal-react";
import {
  UNSUPPORTED_BROWSER_MSG,
  LINK_TYPES,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import SuspenseComponent from "../utils/suspense";
import { addressDetails } from "../../utils/interface";
import { LinkSession, Policy } from "../../utils/policies";
import { pb } from "../../pocketbase";
import errorHandler from "../../utils/helpers/errorhandler";
import { usePostHog } from "posthog-js/react";
import { useRollbar } from "@rollbar/react";
import assignmentMessage from "../../utils/helpers/assignmentmsg";
import ComponentAuthorizer from "./authorizer";
import addHours from "../../utils/helpers/addhours";
const ConfirmSlipDetails = lazy(
  () => import("../../components/modal/slipdetails")
);

const GetAssignments = lazy(() => import("../../components/modal/assignments"));

interface PersonalButtonGroupProps {
  addressElement: addressDetails;
  policy: Policy;
  userId: string;
}

const AssignmentButtonGroup: React.FC<PersonalButtonGroupProps> = ({
  addressElement,
  policy,
  userId
}) => {
  const [isSettingPersonalLink, setIsSettingPersonalLink] =
    React.useState(false);
  const [isSettingNormalLink, setIsSettingNormalLink] = React.useState(false);
  // use a set to store the personal links
  const [personalLinks, setPersonalLinks] = React.useState<
    Map<string, LinkSession>
  >(new Map());
  const [normalLinks, setNormalLinks] = React.useState<
    Map<string, LinkSession>
  >(new Map());
  const mapId = addressElement.id;
  const rollbar = useRollbar();
  const posthog = usePostHog();

  const handleButtonClick = async (linkType: string) => {
    if (!navigator.share) {
      alert(UNSUPPORTED_BROWSER_MSG);
      return;
    }
    try {
      const linkReturn = await ModalManager.show(
        SuspenseComponent(ConfirmSlipDetails),
        {
          addressName: addressElement.name,
          userAccessLevel: policy.userRole,
          isPersonalSlip: linkType === LINK_TYPES.PERSONAL
        }
      );

      const linkObject = linkReturn as Record<string, unknown>;
      const expiryHrs = (
        linkType === LINK_TYPES.PERSONAL ? linkObject.linkExpiryHrs : 24
      ) as number;
      await shareTimedLink(
        linkType,
        addressElement.name,
        assignmentMessage(addressElement.name),
        expiryHrs,
        linkObject.publisherName as string
      );
    } finally {
      setIsSettingNormalLink(false);
      setIsSettingPersonalLink(false);
    }
  };

  const shareTimedLink = async (
    linktype: string,
    title: string,
    body: string,
    hours: number,
    publisherName = ""
  ) => {
    if (!navigator.share) {
      alert(UNSUPPORTED_BROWSER_MSG);
      return;
    }
    try {
      if (linktype === LINK_TYPES.ASSIGNMENT) setIsSettingNormalLink(true);
      if (linktype === LINK_TYPES.PERSONAL) setIsSettingPersonalLink(true);
      const linkRecord = await pb.collection("assignments").create({
        map: mapId,
        user: userId,
        type: linktype,
        expiry_date: addHours(hours),
        publisher: publisherName
      });
      const linkId = linkRecord.id;
      const url = `map/${linkId}`;
      posthog?.capture("assign_link", {
        mapId: mapId,
        linkId: linkId,
        type: linktype,
        publisherName
      });
      const absoluteUrl = new URL(url, window.location.href);
      await navigator.share({
        title: title,
        text: body,
        url: absoluteUrl.toString()
      });
    } catch (error) {
      errorHandler(error, rollbar, false);
    }
  };

  const handleAssignmentsButtonClick = (linkType: string) => {
    // get list of linksession from normallinks
    const assignments =
      linkType === LINK_TYPES.PERSONAL ? personalLinks : normalLinks;
    ModalManager.show(SuspenseComponent(GetAssignments), {
      assignments: Array.from(assignments.values()),
      assignmentType: linkType,
      assignmentTerritory: addressElement.name
    });
  };

  useEffect(() => {
    // Add your logic to fetch the personal count here
    const getAssignments = async () => {
      const mapAssignments = await pb.collection("assignments").getFullList({
        filter: `map='${mapId}'`,
        requestKey: `map-assignments-${mapId}`
      });
      const personalLinks = new Map<string, LinkSession>();
      const normalLinks = new Map<string, LinkSession>();
      for (const assignment of mapAssignments) {
        if (assignment.type === LINK_TYPES.PERSONAL) {
          personalLinks.set(assignment.id, new LinkSession(assignment));
        } else {
          normalLinks.set(assignment.id, new LinkSession(assignment));
        }
      }
      setPersonalLinks(personalLinks);
      setNormalLinks(normalLinks);
    };

    pb.collection("assignments").subscribe(
      "*",
      (data) => {
        if (data.action === "delete") {
          if (data.record.type === LINK_TYPES.PERSONAL) {
            setPersonalLinks((prev) => {
              const updatedSet = new Map(prev);
              updatedSet.delete(data.record.id);
              return updatedSet;
            });
          } else {
            setNormalLinks((prev) => {
              const updatedSet = new Map(prev);
              updatedSet.delete(data.record.id);
              return updatedSet;
            });
          }
        }
        if (data.action === "update" || data.action === "create") {
          setPersonalLinks((prev) => {
            const updatedSet = new Map(prev);
            updatedSet.delete(data.record.id);
            return updatedSet;
          });

          setNormalLinks((prev) => {
            const updatedSet = new Map(prev);
            updatedSet.delete(data.record.id);
            return updatedSet;
          });

          if (data.record.type === LINK_TYPES.PERSONAL) {
            setPersonalLinks((prev) => {
              const updatedSet = new Map(prev);
              updatedSet.set(data.record.id, new LinkSession(data.record));
              return updatedSet;
            });
          } else {
            setNormalLinks((prev) => {
              const updatedSet = new Map(prev);
              updatedSet.set(data.record.id, new LinkSession(data.record));
              return updatedSet;
            });
          }
        }
      },
      {
        filter: `map='${mapId}'`,
        requestKey: `map-assignments-${mapId}`
      }
    );
    getAssignments();
  }, []);

  return (
    <>
      <ComponentAuthorizer
        requiredPermission={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
        userPermission={policy.userRole}
      >
        <ButtonGroup className="m-1">
          <Button
            key={`assign-personal-${mapId}`}
            size="sm"
            variant="outline-primary"
            onClick={() => handleButtonClick(LINK_TYPES.PERSONAL)}
          >
            Personal
          </Button>
          {(isSettingPersonalLink && (
            <Button size="sm" variant="outline-primary">
              <Spinner
                as="span"
                animation="border"
                size="sm"
                aria-hidden="true"
              />{" "}
            </Button>
          )) ||
            (personalLinks.size > 0 && (
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() =>
                  handleAssignmentsButtonClick(LINK_TYPES.PERSONAL)
                }
              >
                <Badge bg="danger" className="me-1">
                  {personalLinks.size}
                </Badge>
              </Button>
            ))}
        </ButtonGroup>
      </ComponentAuthorizer>
      <ButtonGroup className="m-1">
        <Button
          key={`assign-personal-${mapId}`}
          size="sm"
          variant="outline-primary"
          onClick={() => handleButtonClick(LINK_TYPES.ASSIGNMENT)}
        >
          Assign
        </Button>
        {(isSettingNormalLink && (
          <Button size="sm" variant="outline-primary">
            <Spinner
              as="span"
              animation="border"
              size="sm"
              aria-hidden="true"
            />{" "}
          </Button>
        )) ||
          (normalLinks.size > 0 && (
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() =>
                handleAssignmentsButtonClick(LINK_TYPES.ASSIGNMENT)
              }
            >
              <Badge bg="danger" className="me-1">
                {normalLinks.size}
              </Badge>
            </Button>
          ))}
      </ButtonGroup>{" "}
    </>
  );
};

export default AssignmentButtonGroup;
