import { lazy, useEffect, useState, FC } from "react";
import { Button } from "@/components/ui/button";
import CountBadge from "./countbadge";
import { useTranslation } from "react-i18next";
import {
  LINK_TYPES,
  USER_ACCESS_LEVELS,
  PB_FIELDS,
  REALTIME_DEBOUNCE_MS
} from "../../utils/constants";
import { addressDetails } from "../../utils/interface";
import { LinkSession, Policy } from "../../utils/policies";
import useNotification from "../../hooks/useNotification";

import ComponentAuthorizer from "./authorizer";
import { RecordModel } from "pocketbase";
import { getList } from "../../utils/pocketbase";
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
  territoryName?: string;
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
      requestKey: `assignments-${mapId}`,
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
  userId,
  territoryName
}) => {
  const { t } = useTranslation();
  const { showModal } = useModalManagement();
  const mapId = addressElement.id;

  const { personalLinks, normalLinks } = useAssignments(mapId);

  const handleButtonClick = (linkType: string) => {
    showModal(ConfirmSlipDetails, {
      addressElement,
      policy,
      userId,
      isPersonalSlip: linkType === LINK_TYPES.PERSONAL,
      territoryName,
      existingLinks: [...personalLinks.values(), ...normalLinks.values()]
    });
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
            className={personalLinks.size > 0 ? "rounded-r-none" : undefined}
          >
            {t("links.personal", "Personal")}
          </Button>
          {personalLinks.size > 0 && (
            <CountBadge
              tone="active"
              count={personalLinks.size}
              onClick={() => handleAssignmentsButtonClick(LINK_TYPES.PERSONAL)}
              ariaLabel={t("assignments.assignments", "Assignments")}
            />
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
            className={normalLinks.size > 0 ? "rounded-r-none" : undefined}
          >
            {t("links.assignment", "Assign")}
          </Button>
          {normalLinks.size > 0 && (
            <CountBadge
              tone="active"
              count={normalLinks.size}
              onClick={() =>
                handleAssignmentsButtonClick(LINK_TYPES.ASSIGNMENT)
              }
              ariaLabel={t("assignments.assignments", "Assignments")}
            />
          )}
        </div>
      </ComponentAuthorizer>
    </>
  );
};

export default AssignmentButtonGroup;
