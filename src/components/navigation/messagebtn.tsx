import React, { lazy, useEffect } from "react";
import { ButtonGroup, Badge } from "react-bootstrap";
import { MESSAGE_TYPES, USER_ACCESS_LEVELS } from "../../utils/constants";
import { addressDetails } from "../../utils/interface";
import { Policy } from "../../utils/policies";
import { useTranslation } from "react-i18next";

import useVisibilityChange from "../../hooks/useVisibilityManagement";
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
  const [unreadMsgCount, setUnreadMsgCount] = React.useState(0);

  const fetchUnreadMsgs = async () => {
    const unreadMessages = await getList("messages", {
      filter: `map="${mapId}" && type!="${MESSAGE_TYPES.ADMIN}" && read=false`,
      fields: "id",
      requestKey: null
    });
    setUnreadMsgCount(unreadMessages.length);
  };

  useEffect(() => {
    if (!mapId) return;
    fetchUnreadMsgs();
  }, [mapId]);

  useRealtimeSubscription(
    "messages",
    (data) => {
      const { action } = data;
      if (action === "create") {
        setUnreadMsgCount((prevCount) => prevCount + 1);
      } else if (action === "update") {
        setUnreadMsgCount((prevCount) => prevCount - 1);
      }
    },
    {
      filter: `map="${mapId}" && type!="${MESSAGE_TYPES.ADMIN}"`,
      fields: "id"
    },
    [mapId],
    !!mapId
  );

  useVisibilityChange(fetchUnreadMsgs);

  return unreadMsgCount;
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
  const unreadMsgCount = useUnreadMessages(mapId);
  const { t } = useTranslation();

  const handleMessagesClick = () => {
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
