import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { Modal, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import useNotification from "../../hooks/useNotification";
import ModalFooter from "../form/footer";
import GenericTextAreaField from "../form/textarea";
import HelpButton from "../navigation/help";
import {
  Message,
  UpdateAddressFeedbackModalProps
} from "../../utils/interface";
import FeedbackList from "../navigation/feedbacklist";
import {
  PB_FIELDS,
  PB_SECURITY_HEADER_KEY,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import { RecordModel, RecordSubscribeOptions } from "pocketbase";
import useVisibilityChange from "../../hooks/useVisibilityManagement";
import {
  createData,
  deleteDataById,
  getList,
  setupRealtimeListener,
  updateDataById
} from "../../utils/pocketbase";

const useMessages = (mapId: string, assignmentId?: string) => {
  const [messages, setMessages] = useState<Array<Message>>([]);

  const processRecord = (record: RecordModel) => {
    return {
      id: record.id,
      message: record.message,
      created_by: record.created_by,
      read: record.read,
      pinned: record.pinned,
      created: new Date(record.created),
      type: record.type
    };
  };

  const fetchFeedbacks = useCallback(async () => {
    if (!mapId) return;
    const feedbacks = await getList("messages", {
      filter: `map="${mapId}"`,
      sort: "pinned, created",
      requestKey: null,
      fields: PB_FIELDS.MESSAGES
    });

    setMessages(feedbacks.map((fb) => processRecord(fb)));
  }, [mapId]);

  useEffect(() => {
    if (!mapId) return;
    fetchFeedbacks();

    const msgSubheader = {
      filter: `map="${mapId}"`,
      requestKey: null,
      fields: PB_FIELDS.MESSAGES
    } as RecordSubscribeOptions;

    if (assignmentId) {
      msgSubheader.headers = {
        [PB_SECURITY_HEADER_KEY]: assignmentId as string
      };
    }

    setupRealtimeListener(
      "messages",
      (data) => {
        const { action, record: msgData } = data;
        setMessages((prev) => {
          switch (action) {
            case "update":
              return prev.map((msg) =>
                msg.id === msgData.id ? processRecord(msgData) : msg
              );
            case "delete":
              return prev.filter((msg) => msg.id !== msgData.id);
            case "create":
              return [...prev, processRecord(msgData)];
            default:
              return prev;
          }
        });
      },
      msgSubheader
    );
  }, [mapId, assignmentId]);

  useVisibilityChange(fetchFeedbacks);

  return { messages };
};

const UpdateMapMessages = NiceModal.create(
  ({
    name,
    mapId,
    helpLink,
    policy,
    messageType,
    assignmentId
  }: UpdateAddressFeedbackModalProps) => {
    const { t } = useTranslation();
    const { notifyError } = useNotification();
    const [feedback, setFeedback] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const modal = useModal();

    const isAdmin =
      policy.userRole === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE;
    const { messages } = useMessages(mapId, assignmentId);

    const handleSubmitFeedback = useCallback(
      async (event: FormEvent<HTMLElement>) => {
        event.preventDefault();
        setIsSaving(true);
        try {
          await createData(
            "messages",
            {
              map: mapId,
              message: feedback,
              read: isAdmin,
              created_by: policy.userName,
              type: messageType
            },
            {
              requestKey: `create-msg-${mapId}`
            }
          );
          setFeedback("");
        } catch (error) {
          notifyError(error);
        } finally {
          setIsSaving(false);
        }
      },
      [feedback]
    );

    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>
            {t("messages.messagesOn", "Messages on {{name}}", { name })}
          </Modal.Title>
          <HelpButton link={helpLink} />
        </Modal.Header>
        <Form onSubmit={handleSubmitFeedback}>
          <Modal.Body>
            {messages.length > 0 && (
              <FeedbackList
                feedbacks={messages}
                policy={policy}
                handleDelete={async (id: string) => {
                  await deleteDataById("messages", id, {
                    requestKey: `msg-del-${id}`
                  });
                }}
                handlePin={async (id: string, pinned: boolean) => {
                  await updateDataById(
                    "messages",
                    id,
                    { pinned: pinned },
                    {
                      requestKey: `msg-pin-${id}`
                    }
                  );
                }}
                handleRead={async (id: string) => {
                  await updateDataById(
                    "messages",
                    id,
                    { read: true },
                    {
                      requestKey: `msg-read-${id}`
                    }
                  );
                }}
              />
            )}
            <GenericTextAreaField
              name="feedback"
              label={t("messages.enterMessage", "Enter message")}
              handleChange={(event) => {
                const { value } = event.target as HTMLInputElement;
                setFeedback(value);
              }}
              changeValue={feedback}
            />
          </Modal.Body>
          <ModalFooter
            handleClick={modal.hide}
            userAccessLevel={policy.userRole}
            requiredAcLForSave={USER_ACCESS_LEVELS.READ_ONLY.CODE}
            isSaving={isSaving}
            disableSubmitBtn={feedback.length === 0}
            submitLabel={t("common.submit", "Submit")}
          />
        </Form>
      </Modal>
    );
  }
);

export default UpdateMapMessages;
