import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { useRollbar } from "@rollbar/react";
import { useState, FormEvent, useEffect } from "react";
import { Modal, Form } from "react-bootstrap";
import { pb } from "../../utils/pocketbase";
import errorHandler from "../../utils/helpers/errorhandler";
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
import { RecordSubscribeOptions } from "pocketbase";

const UpdateMapMessages = NiceModal.create(
  ({
    name,
    mapId,
    helpLink,
    policy,
    messageType,
    assignmentId
  }: UpdateAddressFeedbackModalProps) => {
    const [feedback, setFeedback] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [messages, setMessages] = useState<Array<Message>>([]);
    const modal = useModal();
    const rollbar = useRollbar();
    const isAdmin =
      policy.userRole === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE;

    const handleSubmitFeedback = async (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setIsSaving(true);
      try {
        await pb.collection("messages").create(
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
        errorHandler(error, rollbar);
      } finally {
        setIsSaving(false);
      }
    };

    useEffect(() => {
      const fetchFeedbacks = async () => {
        const feedbacks = await pb.collection("messages").getFullList({
          filter: `map="${mapId}"`,
          sort: "pinned, created",
          requestKey: `msg-${mapId}`,
          fields: PB_FIELDS.MESSAGES
        });

        setMessages(
          feedbacks.map((fb) => ({
            id: fb.id,
            message: fb.message,
            created_by: fb.created_by,
            read: fb.read,
            pinned: fb.pinned,
            created: new Date(fb.created),
            type: fb.type
          }))
        );
      };
      fetchFeedbacks();

      const msgSubheader = {
        filter: `map="${mapId}"`,
        requestKey: `msg-sub-${mapId}`,
        fields: PB_FIELDS.MESSAGES
      } as RecordSubscribeOptions;

      if (assignmentId) {
        msgSubheader.headers = {
          [PB_SECURITY_HEADER_KEY]: assignmentId as string
        };
      }

      pb.collection("messages").subscribe(
        "*",
        () => {
          fetchFeedbacks();
        },
        msgSubheader
      );
    }, []);

    return (
      <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
        <Modal.Header>
          <Modal.Title>{`Messages on ${name}`}</Modal.Title>
          <HelpButton link={helpLink} />
        </Modal.Header>
        <Form onSubmit={handleSubmitFeedback}>
          <Modal.Body>
            {messages.length > 0 && (
              <FeedbackList
                feedbacks={messages}
                policy={policy}
                handleDelete={async (id: string) => {
                  await pb.collection("messages").delete(id, {
                    requestKey: `msg-del-${id}`
                  });
                }}
                handlePin={async (id: string, pinned: boolean) => {
                  await pb.collection("messages").update(
                    id,
                    { pinned: pinned },
                    {
                      requestKey: `msg-pin-${id}`
                    }
                  );
                }}
                handleRead={async (id: string) => {
                  await pb.collection("messages").update(
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
            submitLabel="Submit"
          />
        </Form>
      </Modal>
    );
  }
);

export default UpdateMapMessages;
