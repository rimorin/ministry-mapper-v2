import React, { lazy, useCallback, useEffect } from "react";
import { ButtonGroup, Button, Spinner, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  UNSUPPORTED_BROWSER_MSG,
  LINK_TYPES,
  USER_ACCESS_LEVELS,
  PB_FIELDS
} from "../../utils/constants";
import { addressDetails } from "../../utils/interface";
import { LinkSession, Policy } from "../../utils/policies";
import errorHandler from "../../utils/helpers/errorhandler";

import assignmentMessage from "../../utils/helpers/assignmentmsg";
import ComponentAuthorizer from "./authorizer";
import addHours from "../../utils/helpers/addhours";
import { RecordModel } from "pocketbase";
import useVisibilityChange from "../utils/visibilitychange";
import {
  getList,
  setupRealtimeListener,
  createData
} from "../../utils/pocketbase";
import modalManagement from "../../hooks/modalManagement";
const ConfirmSlipDetails = lazy(
  () => import("../../components/modal/slipdetails")
);

const GetAssignments = lazy(() => import("../../components/modal/assignments"));

interface PersonalButtonGroupProps {
  addressElement: addressDetails;
  policy: Policy;
  userId: string;
}

const useAssignments = (mapId: string) => {
  const [personalLinks, setPersonalLinks] = React.useState<
    Map<string, LinkSession>
  >(new Map());
  const [normalLinks, setNormalLinks] = React.useState<
    Map<string, LinkSession>
  >(new Map());

  const retrieveAssignments = useCallback(async () => {
    if (!mapId) return;
    const mapAssignments = await getList("assignments", {
      filter: `map='${mapId}'`,
      requestKey: null,
      expand: "map",
      fields: PB_FIELDS.ASSIGNMENTS
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
  }, [mapId]);

  const updateLinks = useCallback(
    (prev: Map<string, LinkSession>, record: RecordModel, action: string) => {
      const updatedSet = new Map(prev);
      if (action === "delete") {
        updatedSet.delete(record.id);
      } else {
        updatedSet.set(record.id, new LinkSession(record));
      }
      return updatedSet;
    },
    []
  );

  useEffect(() => {
    if (!mapId) return;
    retrieveAssignments();
    setupRealtimeListener(
      "assignments",
      (data) => {
        const { action, record } = data;
        const isPersonal = record.type === LINK_TYPES.PERSONAL;

        if (action === "delete" || action === "update" || action === "create") {
          if (isPersonal) {
            setPersonalLinks((prev) => updateLinks(prev, record, action));
          } else {
            setNormalLinks((prev) => updateLinks(prev, record, action));
          }
        }
      },
      {
        filter: `map='${mapId}'`,
        requestKey: null,
        fields: PB_FIELDS.ASSIGNMENTS
      }
    );
  }, [mapId]);

  useVisibilityChange(retrieveAssignments);

  return { personalLinks, normalLinks };
};

const AssignmentButtonGroup: React.FC<PersonalButtonGroupProps> = ({
  addressElement,
  policy,
  userId
}) => {
  const { t } = useTranslation();
  const { showModal } = modalManagement();
  const [isSettingPersonalLink, setIsSettingPersonalLink] =
    React.useState(false);
  const [isSettingNormalLink, setIsSettingNormalLink] = React.useState(false);
  const mapId = addressElement.id;

  const { personalLinks, normalLinks } = useAssignments(mapId);

  const handleButtonClick = useCallback(async (linkType: string) => {
    if (!navigator.share) {
      alert(UNSUPPORTED_BROWSER_MSG);
      return;
    }
    try {
      const linkReturn = await showModal(ConfirmSlipDetails, {
        addressName: addressElement.name,
        userAccessLevel: policy.userRole,
        isPersonalSlip: linkType === LINK_TYPES.PERSONAL
      });

      const linkObject = linkReturn as Record<string, unknown>;
      const expiryHrs = (
        linkType === LINK_TYPES.PERSONAL
          ? linkObject.linkExpiryHrs
          : policy.defaultExpiryHours
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
  }, []);

  const shareTimedLink = useCallback(
    async (
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
        const linkRecord = await createData(
          "assignments",
          {
            map: mapId,
            user: userId,
            type: linktype,
            expiry_date: addHours(hours),
            publisher: publisherName
          },
          {
            requestKey: `create-assignment-${mapId}-${userId}`
          }
        );
        const linkId = linkRecord.id;
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
      }
    },
    []
  );

  const handleAssignmentsButtonClick = (linkType: string) => {
    const assignments =
      linkType === LINK_TYPES.PERSONAL ? personalLinks : normalLinks;
    showModal(GetAssignments, {
      assignments: Array.from(assignments.values()),
      assignmentType: linkType,
      assignmentTerritory: addressElement.name
    });
  };

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
            {t("links.personal", "Personal")}
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
      <ComponentAuthorizer
        requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
        userPermission={policy.userRole}
      >
        <ButtonGroup className="m-1">
          <Button
            key={`assign-personal-${mapId}`}
            size="sm"
            variant="outline-primary"
            onClick={() => handleButtonClick(LINK_TYPES.ASSIGNMENT)}
          >
            {t("links.assignment", "Assign")}
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
        </ButtonGroup>
      </ComponentAuthorizer>
    </>
  );
};

export default AssignmentButtonGroup;
