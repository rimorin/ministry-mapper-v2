import React, { lazy, useEffect, useCallback } from "react";
import { ButtonGroup, Button, Badge } from "react-bootstrap";
import {
  MESSAGE_TYPES,
  USER_ACCESS_LEVELS,
  WIKI_CATEGORIES
} from "../../utils/constants";
import { addressDetails } from "../../utils/interface";
import { Policy } from "../../utils/policies";
import { useTranslation } from "react-i18next";

import useVisibilityChange from "../utils/visibilitychange";
import { getList, setupRealtimeListener } from "../../utils/pocketbase";
import modalManagement from "../../hooks/modalManagement";
const UpdateMapMessages = lazy(() => import("../modal/mapmessages"));

interface PersonalButtonGroupProps {
  addressElement: addressDetails;
  policy: Policy;
}

const useUnreadMessages = (mapId: string) => {
  const [unreadMsgCount, setUnreadMsgCount] = React.useState(0);

  const fetchUnreadMsgs = useCallback(async () => {
    const unreadMessages = await getList("messages", {
      filter: `map = "${mapId}" && type!= "${MESSAGE_TYPES.ADMIN}" && read = false`,
      fields: "id",
      requestKey: null
    });
    setUnreadMsgCount(unreadMessages.length);
  }, [mapId]);

  useEffect(() => {
    if (!mapId) return;
    fetchUnreadMsgs();

    setupRealtimeListener(
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
        filter: `map = "${mapId}" && type!= "${MESSAGE_TYPES.ADMIN}"`,
        fields: "id",
        requestKey: null
      }
    );
  }, []);

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
  const { showModal } = modalManagement();
  const unreadMsgCount = useUnreadMessages(mapId);
  const { t } = useTranslation();

  const handleMessagesClick = useCallback(() => {
    showModal(UpdateMapMessages, {
      name: addressElement.name,
      mapId: mapId,
      helpLink: WIKI_CATEGORIES.PUBLISHER_ADDRESS_FEEDBACK,
      footerSaveAcl: userRole,
      policy: policy,
      messageType: msgType
    });
  }, [mapId, userRole]);

  return (
    <>
      <ButtonGroup className="m-1">
        <Button
          key={`assign-personal-${mapId}`}
          size="sm"
          variant="outline-primary"
          onClick={handleMessagesClick}
        >
          {t("messages.messages", "Messages")}
        </Button>
        {isAdmin && unreadMsgCount > 0 && (
          <Button size="sm" variant="outline-primary">
            <Badge bg="success" className="me-1 notification-glow">
              {unreadMsgCount}
            </Badge>
          </Button>
        )}
      </ButtonGroup>
    </>
  );
};

export default MessageButtonGroup;
