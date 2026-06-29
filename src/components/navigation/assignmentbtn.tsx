import { lazy, useEffect, useState, FC } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import CountBadge from "./countbadge";
import { useTranslation } from "react-i18next";
import {
  UNSUPPORTED_BROWSER_MSG,
  LINK_TYPES,
  USER_ACCESS_LEVELS,
  PB_FIELDS,
  REALTIME_DEBOUNCE_MS
} from "../../utils/constants";
import { addressDetails } from "../../utils/interface";
import { LinkSession, Policy } from "../../utils/policies";
import useNotification from "../../hooks/useNotification";

import assignmentMessage from "../../utils/helpers/assignmentmsg";
import ComponentAuthorizer from "./authorizer";
import addHours from "../../utils/helpers/addhours";
import { RecordModel } from "pocketbase";
import { getList, createData, isAbortError } from "../../utils/pocketbase";
import useRealtimeSubscription from "../../hooks/useRealtime";
import { useModalManagement } from "../../hooks/useModalManagement";
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
  const [personalLinks, setPersonalLinks] = useState<Map<string, LinkSession>>(
    new Map()
  );
  const [normalLinks, setNormalLinks] = useState<Map<string, LinkSession>>(
    new Map()
  );
  const { runAction } = useNotification();

  const retrieveAssignments = async () => {
    if (!mapId) return;
    const mapAssignments = await getList("assignments", {
      filter: `map='${mapId}'`,
      requestKey: null,
      expand: "map,user",
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
  };

  const updateLinks = (
    prev: Map<string, LinkSession>,
    record: RecordModel,
    action: string
  ) => {
    if (action === "delete") {
      if (!prev.has(record.id)) return prev;
      const updated = new Map(prev);
      updated.delete(record.id);
      return updated;
    }
    const updated = new Map(prev);
    updated.set(record.id, new LinkSession(record));
    return updated;
  };

  useEffect(() => {
    if (!mapId) return;
    runAction(retrieveAssignments);
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- React Compiler memoizes retrieveAssignments
  }, [mapId]);

  useRealtimeSubscription(
    "assignments",
    (data) => {
      const { action, record } = data;
      const isPersonal = record.type === LINK_TYPES.PERSONAL;

      if (action === "delete") {
        setPersonalLinks((prev) => updateLinks(prev, record, "delete"));
        setNormalLinks((prev) => updateLinks(prev, record, "delete"));
      } else if (action === "create" || action === "update") {
        if (isPersonal) {
          setPersonalLinks((prev) => updateLinks(prev, record, "upsert"));
          setNormalLinks((prev) => updateLinks(prev, record, "delete"));
        } else {
          setNormalLinks((prev) => updateLinks(prev, record, "upsert"));
          setPersonalLinks((prev) => updateLinks(prev, record, "delete"));
        }
      }
    },
    {
      filter: `map='${mapId}'`,
      fields: PB_FIELDS.ASSIGNMENTS,
      expand: "map,user"
    },
    [mapId],
    !!mapId,
    REALTIME_DEBOUNCE_MS
  );

  return { personalLinks, normalLinks };
};

const AssignmentButtonGroup: FC<PersonalButtonGroupProps> = ({
  addressElement,
  policy,
  userId
}) => {
  const { t } = useTranslation();
  const { notifyError, notifyWarning } = useNotification();
  const { showModal } = useModalManagement();
  const [isSettingPersonalLink, setIsSettingPersonalLink] = useState(false);
  const [isSettingNormalLink, setIsSettingNormalLink] = useState(false);
  const mapId = addressElement.id;

  const { personalLinks, normalLinks } = useAssignments(mapId);

  const handleButtonClick = async (linkType: string) => {
    if (!navigator.share) {
      notifyWarning(UNSUPPORTED_BROWSER_MSG);
      return;
    }
    try {
      const linkReturn = await showModal(ConfirmSlipDetails, {
        addressName: addressElement.name,
        userAccessLevel: policy.userRole,
        isPersonalSlip: linkType === LINK_TYPES.PERSONAL
      });

      const linkObject = linkReturn as Record<string, unknown>;
      if (!linkObject) return;
      const expiryHrs = (
        linkType === LINK_TYPES.PERSONAL
          ? linkObject.linkExpiryHrs
          : policy.defaultExpiryHours
      ) as number;
      await shareTimedLink(
        linkType,
        assignmentMessage(
          addressElement.name,
          linkObject.publisherName as string,
          expiryHrs,
          linkType
        ),
        expiryHrs,
        linkObject.publisherName as string
      );
    } catch (error) {
      notifyError(error);
    } finally {
      setIsSettingNormalLink(false);
      setIsSettingPersonalLink(false);
    }
  };

  const shareTimedLink = async (
    linktype: string,
    body: string,
    hours: number,
    publisherName = ""
  ) => {
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
          publisher: publisherName,
          congregation: policy.congregation
        },
        {
          requestKey: `create-assignment-${mapId}-${userId}`
        }
      );
      const linkId = linkRecord.id;
      const absoluteUrl = new URL(`map/${linkId}`, window.location.href);
      await navigator.share({
        text: `${body}\n${absoluteUrl.toString()}`
      });
    } catch (error) {
      if (isAbortError(error)) return;
      notifyError(error, true);
    }
  };

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
        <div className="m-1 flex items-center gap-0">
          <Button
            key={`assign-personal-${mapId}`}
            size="sm"
            variant={personalLinks.size > 0 ? "default" : "outline"}
            onClick={() => handleButtonClick(LINK_TYPES.PERSONAL)}
            className={
              personalLinks.size > 0 || isSettingPersonalLink
                ? "rounded-r-none"
                : undefined
            }
          >
            {t("links.personal", "Personal")}
          </Button>
          {isSettingPersonalLink ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-l-none px-3"
              disabled
              aria-label={t("links.personal", "Personal")}
            >
              <Spinner data-icon="inline-start" aria-hidden="true" />
            </Button>
          ) : (
            personalLinks.size > 0 && (
              <CountBadge
                tone="active"
                count={personalLinks.size}
                onClick={() =>
                  handleAssignmentsButtonClick(LINK_TYPES.PERSONAL)
                }
                ariaLabel={t("assignments.assignments", "Assignments")}
              />
            )
          )}
        </div>
      </ComponentAuthorizer>
      <ComponentAuthorizer
        requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
        userPermission={policy.userRole}
      >
        <div className="m-1 flex items-center gap-0">
          <Button
            key={`assign-normal-${mapId}`}
            size="sm"
            variant={normalLinks.size > 0 ? "default" : "outline"}
            onClick={() => handleButtonClick(LINK_TYPES.ASSIGNMENT)}
            className={
              normalLinks.size > 0 || isSettingNormalLink
                ? "rounded-r-none"
                : undefined
            }
          >
            {t("links.assignment", "Assign")}
          </Button>
          {isSettingNormalLink ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-l-none px-3"
              disabled
              aria-label={t("links.assignment", "Assign")}
            >
              <Spinner data-icon="inline-start" aria-hidden="true" />
            </Button>
          ) : (
            normalLinks.size > 0 && (
              <CountBadge
                tone="active"
                count={normalLinks.size}
                onClick={() =>
                  handleAssignmentsButtonClick(LINK_TYPES.ASSIGNMENT)
                }
                ariaLabel={t("assignments.assignments", "Assignments")}
              />
            )
          )}
        </div>
      </ComponentAuthorizer>
    </>
  );
};

export default AssignmentButtonGroup;
