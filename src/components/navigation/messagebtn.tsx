import React, { lazy, useEffect } from "react";
import { ButtonGroup, Badge } from "react-bootstrap";
import {
  MESSAGE_TYPES,
  REALTIME_DEBOUNCE_MS,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import { addressDetails } from "../../utils/interface";
import { Policy } from "../../utils/policies";
import { useTranslation } from "react-i18next";

import useAnalytics, { ANALYTICS_EVENTS } from "../../hooks/useAnalytics";
import { getList } from "../../utils/pocketbase";
import useRealtimeSubscription from "../../hooks/useRealtime";
import { useModalManagement } from "../../hooks/useModalManagement";
import GenericButton from "./button";
const UpdateMapMessages = lazy(() => import("../modal/mapmessages"));

interface PersonalButtonGroupProps {
  addressElement: addressDetails;
  policy: Policy;
}

const useUnreadMessages = (mapId: string) => {
  const [unreadIds, setUnreadIds] = React.useState<Set<string>>(new Set());

  const fetchUnreadMsgs = async () => {
    const unreadMessages = await getList("messages", {
      filter: `map="${mapId}" && type!="${MESSAGE_TYPES.ADMIN}" && read=false`,
      fields: "id",
      requestKey: null
    });
    setUnreadIds(new Set(unreadMessages.map((r) => r.id)));
  };

  useEffect(() => {
    if (!mapId) return;
    fetchUnreadMsgs();
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- React Compiler memoizes fetchUnreadMsgs
  }, [mapId]);

  useRealtimeSubscription(
    "messages",
    (data) => {
      const { action, record } = data;
      setUnreadIds((prev) => {
        const next = new Set(prev);
        if (action === "create" && !record.read) {
          next.add(record.id);
        } else if (action === "update" && record.read) {
          next.delete(record.id);
        } else if (action === "delete") {
          next.delete(record.id);
        }
        return next;
      });
    },
    {
      filter: `map="${mapId}" && type!="${MESSAGE_TYPES.ADMIN}"`,
      fields: "id, read"
    },
    [mapId],
    !!mapId,
    REALTIME_DEBOUNCE_MS
  );

  return unreadIds.size;
};

const MessageButtonGroup: React.FC<PersonalButtonGroupProps> = ({
  addressElement,
  policy
}) => {
  const mapId = addressElement.id;
  const userRole = policy.userRole;
  const isAdmin = userRole === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE;
  const msgType = isAdmin ? MESSAGE_TYPES.ADMIN : MESSAGE_TYPES.CONDUCTOR;
  const { showModal } = useModalManagement();
  const { trackEvent } = useAnalytics();
  const unreadMsgCount = useUnreadMessages(mapId);
  const { t } = useTranslation();

  const handleMessagesClick = () => {
    trackEvent(ANALYTICS_EVENTS.MESSAGES_OPENED, { role: msgType });
    showModal(UpdateMapMessages, {
      name: addressElement.name,
      mapId: mapId,
      footerSaveAcl: userRole,
      policy: policy,
      messageType: msgType
    });
  };

  return (
    <>
      <ButtonGroup className="m-1">
        <GenericButton
          size="sm"
          variant="outline-primary"
          onClick={handleMessagesClick}
          label={t("messages.messages", "Messages")}
        />
        {isAdmin && unreadMsgCount > 0 && (
          <GenericButton
            size="sm"
            variant="outline-primary"
            label={
              <Badge bg="success" className="me-1 notification-glow">
                {unreadMsgCount}
              </Badge>
            }
          />
        )}
      </ButtonGroup>
    </>
  );
};

export default MessageButtonGroup;
