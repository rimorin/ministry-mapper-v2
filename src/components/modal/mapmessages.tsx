import NiceModal from "@ebay/nice-modal-react";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { MessageSquare, SendHorizontal } from "lucide-react";
import useNotification from "../../hooks/useNotification";
import useAnalytics, { ANALYTICS_EVENTS } from "../../hooks/useAnalytics";
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
import {
  createData,
  deleteDataById,
  getList,
  ignoreAbort,
  updateDataById
} from "../../utils/pocketbase";
import useRealtimeSubscription from "../../hooks/useRealtime";
import ComponentAuthorizer from "../navigation/authorizer";
import { useIsMobile } from "../../hooks/use-mobile";

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

  const fetchFeedbacks = async () => {
    if (!mapId) return;
    const feedbacks = await getList("messages", {
      filter: `map="${mapId}"`,
      sort: "pinned, created",
      requestKey: null,
      fields: PB_FIELDS.MESSAGES
    });

    setMessages(feedbacks.map((fb) => processRecord(fb)));
  };

  useEffect(() => {
    if (!mapId) return;
    ignoreAbort(fetchFeedbacks)();
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- React Compiler memoizes fetchFeedbacks
  }, [mapId]);

  const msgSubheader = {
    filter: `map="${mapId}"`,
    fields: PB_FIELDS.MESSAGES,
    ...(assignmentId && {
      headers: {
        [PB_SECURITY_HEADER_KEY]: assignmentId as string
      }
    })
  } as RecordSubscribeOptions;

  useRealtimeSubscription(
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
    msgSubheader,
    [mapId, assignmentId],
    !!mapId
  );

  return { messages };
};

const UpdateMapMessages = NiceModal.create(
  ({
    name,
    mapId,
    policy,
    messageType,
    assignmentId
  }: UpdateAddressFeedbackModalProps) => {
    const { modal, dialogProps, contentProps } = useBaseUiDialog();
    const { t } = useTranslation();
    const { runAction } = useNotification();
    const { trackEvent } = useAnalytics();
    const [feedback, setFeedback] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const isAdmin =
      policy.userRole === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE;
    const isMobile = useIsMobile();
    const { messages } = useMessages(mapId, assignmentId);

    const handleSubmitFeedback = async () => {
      await runAction(
        async () => {
          await createData(
            "messages",
            {
              map: mapId,
              message: feedback,
              read: isAdmin,
              created_by: policy.userName,
              type: messageType,
              congregation: policy.congregation
            },
            {
              requestKey: `create-msg-${mapId}`
            }
          );
          trackEvent(ANALYTICS_EVENTS.MESSAGE_SENT, { role: messageType });
          setFeedback("");
        },
        { setLoading: setIsSaving }
      );
    };

    return (
      <Dialog {...dialogProps}>
        <DialogContent {...contentProps}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmitFeedback();
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {t("messages.messagesOn", "Messages on {{name}}", { name })}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t(
                  "messages.messagesDescription",
                  "View and send messages for this territory map."
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {messages.length > 0 ? (
                <FeedbackList
                  feedbacks={messages}
                  policy={policy}
                  handleDelete={(id) =>
                    runAction(async () => {
                      await deleteDataById("messages", id, {
                        requestKey: `msg-del-${id}`
                      });
                      trackEvent(ANALYTICS_EVENTS.MESSAGE_DELETED);
                    })
                  }
                  handlePin={(id, pinned) =>
                    runAction(async () => {
                      await updateDataById(
                        "messages",
                        id,
                        { pinned },
                        {
                          requestKey: `msg-pin-${id}`
                        }
                      );
                      trackEvent(ANALYTICS_EVENTS.MESSAGE_PINNED, { pinned });
                    })
                  }
                  handleRead={(id) =>
                    runAction(async () => {
                      await updateDataById(
                        "messages",
                        id,
                        { read: true },
                        {
                          requestKey: `msg-read-${id}`
                        }
                      );
                    })
                  }
                />
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-6 text-muted-foreground">
                  <MessageSquare className="size-6 opacity-40" />
                  <p className="text-sm">
                    {t("messages.noMessages", "No messages yet")}
                  </p>
                </div>
              )}

              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.READ_ONLY.CODE}
                userPermission={policy.userRole}
              >
                <div className="space-y-1.5">
                  <div className="relative">
                    <Textarea
                      autoFocus
                      name="feedback"
                      placeholder={t(
                        "messages.enterMessage",
                        "Write a message…"
                      )}
                      value={feedback}
                      rows={3}
                      className="resize-none pr-12"
                      onChange={(e) => setFeedback(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          (e.metaKey || e.ctrlKey) &&
                          feedback.trim().length > 0 &&
                          !isSaving
                        ) {
                          e.preventDefault();
                          void handleSubmitFeedback();
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isSaving || feedback.trim().length === 0}
                      className="absolute bottom-2 right-2 size-8"
                      aria-label={t("common.submit", "Submit")}
                    >
                      {isSaving ? (
                        <Spinner aria-hidden="true" />
                      ) : (
                        <SendHorizontal className="size-4" />
                      )}
                    </Button>
                  </div>
                  {!isMobile && (
                    <p className="text-right text-xs text-muted-foreground">
                      {t("messages.keyboardHint", "⌘ Return to send")}
                    </p>
                  )}
                </div>
              </ComponentAuthorizer>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={modal.hide}>
                {t("common.close", "Close")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default UpdateMapMessages;
