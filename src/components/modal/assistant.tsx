import NiceModal from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import {
  FormEvent,
  KeyboardEvent,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ImageOff,
  ImagePlus,
  Eye,
  History,
  MapPin,
  ShieldCheck,
  Square,
  SquarePen,
  X
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { messageEnter } from "@/lib/motion";
import { AssistantIcon } from "@/components/common/assistant-icon";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle
} from "@/components/common/responsive-dialog";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia
} from "@/components/ui/attachment";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea
} from "@/components/ui/input-group";
import { Marker, MarkerContent } from "@/components/ui/marker";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport
} from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import { useNetworkStatusContext } from "../middlewares/networkstatuscontext";
import useNotification from "../../hooks/useNotification";
import type { AssistantPlace } from "./assistant-canvas";
import AssistantReply, { IconAction } from "./assistant-turn";
import AssistantHistory from "./assistant-history";
import { isPhoto, shrinkImage } from "../../utils/shrinkImage";
import { STEADY_HOVER } from "./assistant-shared";
import { pickStarters } from "./assistant-suggestions";
import LinkDateFormatter from "../../utils/helpers/linkdateformatter";
import {
  ACCESS_LEVEL_MAPPING,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import useConfirm from "../../hooks/useConfirm";
import type { CongregationSettings } from "../../utils/assistantActions";
import useAssistant, {
  UNDO_WINDOW_MS,
  type PastConversation,
  type AssistantView
} from "../../hooks/useAssistant";

// Leaflet loads only when a place is first opened.
const AssistantCanvas = lazy(() => import("./assistant-canvas"));

// Mirrors maxAssistantQuestionLength in the backend handler.
const MAX_QUESTION_LENGTH = 1000;

interface AssistantModalProps {
  congregation: string;
  // The asker's role, to offer only the starter questions it may ask.
  role?: string;
  // The congregation's country, to look up new maps' addresses there.
  origin?: string;
  // What the admin has open in the app, used as context unless they remove it.
  view?: AssistantView;
  onSelectTerritory: (territoryId: string) => void;
  // The congregation's settings after a card changed them or undid that.
  onSettingsChange?: (settings: CongregationSettings) => void;
}

// How a view reads on the chip and under a question: the territory's code
// with the map in view, or with the territory's name when no map is.
const viewLabel = (view: AssistantView) =>
  [view.territoryCode, view.mapName ?? view.territoryName]
    .filter(Boolean)
    .join(" · ");

// The whole of it, for the chip's tooltip.
const fullViewLabel = (view: AssistantView) =>
  [view.territoryCode, view.territoryName, view.mapName]
    .filter(Boolean)
    .join(" · ");

interface AssistantChatProps extends AssistantModalProps {
  onClose: () => void;
  // Docked beside the page on desktop; otherwise inside the phone drawer.
  docked?: boolean;
  // The heading, which in the drawer must be the dialog's own title.
  Title?: React.ElementType;
  Header?: React.ElementType;
}

// The conversation itself, shown docked beside the page on desktop and in a
// drawer on phones (AssistantModal below).
export const AssistantChat = ({
  congregation,
  role,
  origin,
  view,
  onSelectTerritory,
  onSettingsChange,
  onClose,
  docked = false,
  Title = "h2",
  Header = "div"
}: AssistantChatProps) => {
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatusContext();
  // A fresh few each time the panel opens or a new conversation starts, from
  // what the role may ask.
  const [starters, setStarters] = useState(() => pickStarters(role));
  // Conductors and administrators can also ask for changes; read-only users
  // can only ask.
  const canChange =
    (ACCESS_LEVEL_MAPPING[role ?? ""] ?? 0) >=
    ACCESS_LEVEL_MAPPING[USER_ACCESS_LEVELS.CONDUCTOR.CODE];
  // The territory whose view the admin removed; opening another brings the
  // view back, since it is a new place.
  const [leftOut, setLeftOut] = useState<string>();
  const activeView = view && leftOut !== view.territoryId ? view : undefined;
  // Questions about what is open come first; the rest stay random.
  const viewStarters = activeView
    ? [
        activeView.mapName
          ? {
              key: "viewMap",
              text: t("assistant.viewSuggestion.map", "Show me {{map}}", {
                map: activeView.mapName
              })
            }
          : {
              key: "viewHowIs",
              text: t(
                "assistant.viewSuggestion.howIs",
                "How is {{code}} doing?",
                {
                  code: activeView.territoryCode
                }
              )
            },
        {
          key: "viewMostNotDone",
          text: t(
            "assistant.viewSuggestion.mostNotDone",
            "Which maps in {{code}} have the most homes not done?",
            { code: activeView.territoryCode }
          )
        }
      ]
    : [];
  const shownStarters = [
    ...viewStarters,
    ...starters.map(({ key, fallback }) => ({
      key,
      text: t(`assistant.suggestion.${key}`, fallback)
    }))
  ].slice(0, starters.length);
  const assistant = useAssistant(congregation, onSettingsChange);
  const {
    turns,
    ask,
    stop,
    shareLocation,
    location,
    updateLocation,
    stopSharingLocation,
    reset,
    continueConversation,
    conversationId,
    busy
  } = assistant;
  const { notifyWarning } = useNotification();
  const { confirm } = useConfirm();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Docked, typing can start at once. In the phone drawer focusing would open
  // the keyboard over the conversation, so it is left to a tap.
  const focusInput = () => {
    if (docked) textareaRef.current?.focus();
  };
  useEffect(() => {
    if (docked) textareaRef.current?.focus();
  }, [docked]);

  // Leaving this conversation, for a new one or an earlier one, loses the Undo
  // of a change it made, so that asks first. True when it is fine to leave.
  const leaveConversation = async () => {
    const undoable = turns.some((turn) =>
      Object.values(turn.actions ?? {}).some(
        (action) =>
          action.status === "done" &&
          !!action.doneAt &&
          Date.now() - action.doneAt < UNDO_WINDOW_MS
      )
    );
    return (
      !undoable ||
      confirm({
        title: t("assistant.newConversation", "New conversation"),
        message: t(
          "assistant.newConversationUndo",
          "A change made in this conversation can still be undone. Starting a new conversation removes its Undo button."
        ),
        confirmText: t("assistant.newConversationConfirm", "Start new"),
        variant: "warning"
      })
    );
  };

  const startOver = async () => {
    if (!(await leaveConversation())) return;
    reset();
    setStarters(pickStarters(role));
    focusInput();
  };

  // Past conversations replace the chat in the panel, as the canvas does; one
  // opened from there comes back into the chat to go on with.
  const [showHistory, setShowHistory] = useState(false);
  const goOn = async (past: PastConversation) => {
    if (!(await leaveConversation())) return;
    continueConversation(past);
    setShowHistory(false);
    focusInput();
  };
  // Deleting the conversation on screen clears the chat as well.
  const forget = (id: string) => {
    if (id === conversationId) reset();
  };

  const shareMyLocation = (turnId: string) =>
    explainLocation(shareLocation(turnId));
  const explainLocation = async (reading: Promise<void>) => {
    try {
      await reading;
    } catch (error) {
      notifyWarning(
        error instanceof Error && error.message === "unsupported"
          ? t(
              "errors.geolocationNotSupported",
              "Geolocation is not supported by your browser"
            )
          : t(
              "errors.unableToGetLocation",
              "Unable to get your current location. Please check your browser settings."
            )
      );
    }
  };
  const [text, setText] = useState("");
  // A photo to send with the next question, already made small, and whether
  // the last one picked could not be used.
  const [photo, setPhoto] = useState<string>();
  const [photoFailed, setPhotoFailed] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const attachPhoto = async (file?: Blob | null) => {
    if (!file) return;
    try {
      setPhoto(await shrinkImage(file));
      setPhotoFailed(false);
    } catch {
      setPhotoFailed(true);
    }
    focusInput();
  };
  // Answers already there when the panel opened are shown as they are; only
  // those arriving while it is open are revealed as they are written.
  const [answeredBeforeOpen] = useState(
    () =>
      new Set(
        turns.filter((turn) => turn.status !== "pending").map((turn) => turn.id)
      )
  );
  const canSend = isOnline && !busy && text.trim().length > 0;
  const lastTurn = turns.at(-1);
  // Errors announce themselves (role="alert" on their bubble).
  const announcement =
    lastTurn?.status === "done" && lastTurn.response
      ? lastTurn.response.grounded
        ? t("assistant.answerReady", "Answer ready. {{answer}}", {
            answer: lastTurn.response.answer
          })
        : t(
            "assistant.ungroundedShort",
            "I could not write an answer that matches your data exactly."
          )
      : "";

  const send = (question: string) => {
    void ask(question, activeView, photo);
    setText("");
    setPhoto(undefined);
    setPhotoFailed(false);
    // Starters and suggestions go once used; keep keyboard users in place.
    focusInput();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSend) send(text);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) send(text);
    }
  };

  const [place, setPlace] = useState<AssistantPlace | null>(null);
  // The canvas replaces the chat, so focus moves into it and comes back to
  // the question box when it closes.
  const placeOpen = place !== null;
  const wasOpen = useRef(false);
  useEffect(() => {
    if (placeOpen) canvasRef.current?.focus();
    else if (wasOpen.current) focusInput();
    wasOpen.current = placeOpen;
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- only when the canvas opens and closes
  }, [placeOpen]);

  // The drawer covers the page on phones, so it closes; the conversation
  // is kept and comes back when the assistant opens again.
  const selectTerritory = (territoryId: string) => {
    onSelectTerritory(territoryId);
    if (!docked) onClose();
  };

  return (
    <div
      className={cn(
        "flex min-h-0 gap-6",
        docked ? "h-full" : "h-[calc(100dvh-10rem)]"
      )}
    >
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col gap-4",
          // The canvas takes the panel's whole width; the chat comes back
          // when it closes.
          (place || showHistory) && "hidden"
        )}
      >
        <Header className="flex flex-row items-center gap-2">
          <Title className="flex min-w-0 flex-1 items-center gap-2 font-heading text-base font-medium">
            <AssistantIcon className="size-4 shrink-0 text-muted-foreground" />
            {t("assistant.title", "Mapper Assistant")}
          </Title>
          <IconAction
            label={t("assistant.history.open", "Past conversations")}
            onClick={() => setShowHistory(true)}
          >
            <History />
          </IconAction>
          {turns.length > 0 && (
            <IconAction
              label={t("assistant.newConversation", "New conversation")}
              onClick={() => void startOver()}
            >
              <SquarePen />
            </IconAction>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={STEADY_HOVER}
            aria-label={t("assistant.closePanel", "Close assistant")}
            onClick={onClose}
          >
            <X />
          </Button>
        </Header>

        {turns.length === 0 ? (
          <Empty className="min-h-0 flex-1">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AssistantIcon />
              </EmptyMedia>
              <EmptyTitle>
                {canChange
                  ? t("assistant.emptyTitleChange", "What can I help with?")
                  : t("assistant.emptyTitle", "What would you like to know?")}
              </EmptyTitle>
              <EmptyDescription>
                {canChange
                  ? t(
                      "assistant.descriptionChange",
                      "Ask about your territories or ask for a change, in your own words. Nothing changes until you confirm."
                    )
                  : t(
                      "assistant.description",
                      "Ask about your territories in your own words. Answers come from your congregation's data."
                    )}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0" />
                {t(
                  "assistant.privacy",
                  "Names of people in your records are hidden from the AI. Other names you type, or that appear in notes or photos, may be sent."
                )}
              </p>
            </EmptyContent>
          </Empty>
        ) : (
          // Follows new content only while the admin is at the bottom,
          // pins each question near the top so a long answer starts in
          // view, and offers a jump back when they have scrolled up.
          // A conversation opens at its last question, with the answer below.
          <MessageScrollerProvider
            autoScroll
            defaultScrollPosition="last-anchor"
          >
            <MessageScroller className="min-h-0 flex-1">
              <MessageScrollerViewport>
                <MessageScrollerContent aria-busy={busy} className="gap-6">
                  {/* New turns rise in; those already there when the panel
                      opens, or brought back from history, are just shown. */}
                  <AnimatePresence initial={false}>
                    {turns.map((turn, index) => (
                      <MessageScrollerItem
                        key={turn.id}
                        messageId={turn.id}
                        scrollAnchor
                        className="group/turn"
                      >
                        <m.div
                          className="flex flex-col gap-3"
                          initial={turn.askedAt ? false : "hidden"}
                          animate="show"
                          variants={messageEnter}
                        >
                          <Message align="end">
                            <MessageContent>
                              {turn.image && (
                                // Dimmed while the photo is being read.
                                <Attachment
                                  orientation="vertical"
                                  state={
                                    turn.status === "pending"
                                      ? "processing"
                                      : "done"
                                  }
                                  className="w-32 self-end"
                                >
                                  <AttachmentMedia variant="image">
                                    <img
                                      src={turn.image}
                                      alt={t(
                                        "assistant.photo.alt",
                                        "The photo you attached"
                                      )}
                                    />
                                  </AttachmentMedia>
                                </Attachment>
                              )}
                              <Bubble align="end" variant="muted">
                                <BubbleContent>{turn.question}</BubbleContent>
                              </Bubble>
                              {turn.view && (
                                <Marker className="justify-end text-xs">
                                  <MarkerContent>
                                    {t(
                                      "assistant.view.askedAbout",
                                      "About {{place}}",
                                      {
                                        place: viewLabel(turn.view)
                                      }
                                    )}
                                  </MarkerContent>
                                </Marker>
                              )}
                              {turn.askedAt && (
                                <Marker className="justify-end text-xs">
                                  <MarkerContent>
                                    {t(
                                      "assistant.history.asked",
                                      "Asked {{date}}",
                                      {
                                        date: LinkDateFormatter.format(
                                          Date.parse(turn.askedAt)
                                        )
                                      }
                                    )}
                                  </MarkerContent>
                                </Marker>
                              )}
                            </MessageContent>
                          </Message>
                          <Message>
                            <MessageContent className="gap-3">
                              <AssistantReply
                                turn={turn}
                                isLast={index === turns.length - 1}
                                live={
                                  !turn.askedAt &&
                                  !answeredBeforeOpen.has(turn.id)
                                }
                                assistant={assistant}
                                origin={origin}
                                onSend={send}
                                onShareLocation={shareMyLocation}
                                onSelectTerritory={selectTerritory}
                                onShowPlace={setPlace}
                              />
                            </MessageContent>
                          </Message>
                        </m.div>
                      </MessageScrollerItem>
                    ))}
                  </AnimatePresence>
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton>
                <ArrowDown />
                <span className="sr-only">
                  {t("assistant.scrollToLatest", "Jump to the latest")}
                </span>
              </MessageScrollerButton>
            </MessageScroller>
          </MessageScrollerProvider>
        )}

        {/* Screen readers hear each answer, or what went wrong, once it
            arrives; the checks streaming in are left out, as they would
            interrupt. */}
        <p role="status" className="sr-only">
          {announcement}
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          {turns.length === 0 && (
            <div
              role="group"
              aria-label={t(
                "assistant.suggestedQuestions",
                "Suggested questions"
              )}
              className={cn(
                "flex gap-2 pb-1",
                // The narrow docked panel stacks them; the drawer scrolls.
                docked ? "flex-wrap" : "overflow-x-auto overscroll-x-contain"
              )}
            >
              {shownStarters.map(({ key, text: starter }) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    STEADY_HOVER,
                    "shrink-0",
                    docked &&
                      "h-auto max-w-full py-1.5 text-left whitespace-normal"
                  )}
                  disabled={!isOnline || busy}
                  onClick={() => send(starter)}
                >
                  {starter}
                </Button>
              ))}
            </div>
          )}
          {view &&
            (activeView ? (
              <div
                className="flex max-w-full items-center gap-1 self-start rounded-full border bg-muted/40 py-0.5 pr-0.5 pl-2.5 text-xs text-muted-foreground"
                title={fullViewLabel(activeView)}
              >
                <Eye className="size-3.5 shrink-0" />
                <span className="min-w-0 truncate">
                  {t("assistant.view.using", "Using {{place}}", {
                    place: viewLabel(activeView)
                  })}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className={cn(STEADY_HOVER, "rounded-full")}
                  aria-label={t(
                    "assistant.view.leaveOut",
                    "Do not use what is open"
                  )}
                  onClick={() => setLeftOut(view.territoryId)}
                >
                  <X />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn(
                  STEADY_HOVER,
                  "self-start text-xs text-muted-foreground"
                )}
                onClick={() => setLeftOut(undefined)}
              >
                <Eye />
                {t("assistant.view.use", "Use {{place}}", {
                  place: viewLabel(view)
                })}
              </Button>
            ))}
          {location && (
            <div className="flex max-w-full items-center gap-1 self-start rounded-full border bg-muted/40 py-0.5 pr-0.5 pl-2.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="min-w-0 truncate">
                {t("assistant.location.using", "Using your location")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn(STEADY_HOVER, "rounded-full")}
                disabled={!isOnline}
                onClick={() => void explainLocation(updateLocation())}
              >
                {t("assistant.location.update", "Update")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className={cn(STEADY_HOVER, "rounded-full")}
                aria-label={t(
                  "assistant.location.stop",
                  "Stop sharing your location"
                )}
                onClick={stopSharingLocation}
              >
                <X />
              </Button>
            </div>
          )}
          {photo && (
            <Attachment orientation="vertical" className="self-start">
              <AttachmentMedia variant="image">
                <img
                  src={photo}
                  alt={t("assistant.photo.alt", "The photo you attached")}
                />
              </AttachmentMedia>
              {/* On the tile's corner, so it does not cover the photo. */}
              <AttachmentActions className="-top-2! -right-2!">
                <AttachmentAction
                  type="button"
                  variant="secondary"
                  className="rounded-full border shadow-sm"
                  aria-label={t("assistant.photo.remove", "Remove the photo")}
                  onClick={() => setPhoto(undefined)}
                >
                  <X />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          )}
          {photoFailed && (
            <Attachment
              state="error"
              size="sm"
              role="alert"
              className="self-start"
            >
              <AttachmentMedia>
                <ImageOff />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentDescription className="whitespace-normal">
                  {t(
                    "assistant.photo.failed",
                    "That photo could not be used. Try a JPEG or PNG."
                  )}
                </AttachmentDescription>
              </AttachmentContent>
            </Attachment>
          )}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              void attachPhoto(event.target.files?.[0]);
              // The same photo can be picked again after it is removed.
              event.target.value = "";
            }}
          />
          <InputGroup>
            <InputGroupTextarea
              ref={textareaRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={onKeyDown}
              onPaste={(event) => {
                const pasted = Array.from(event.clipboardData.files).find(
                  isPhoto
                );
                if (pasted) {
                  event.preventDefault();
                  void attachPhoto(pasted);
                }
              }}
              maxLength={MAX_QUESTION_LENGTH}
              disabled={!isOnline}
              placeholder={t("assistant.placeholder", "Ask a question…")}
              aria-label={t("assistant.placeholder", "Ask a question…")}
              className="min-h-0 p-3"
            />
            <InputGroupAddon align="inline-end" className="self-end">
              <InputGroupButton
                type="button"
                size="icon-sm"
                variant="ghost"
                className={cn(STEADY_HOVER, "rounded-full")}
                disabled={!isOnline || busy}
                onClick={() => photoInputRef.current?.click()}
                aria-label={t("assistant.photo.attach", "Attach a photo")}
              >
                <ImagePlus />
              </InputGroupButton>
              {busy ? (
                <InputGroupButton
                  type="button"
                  size="icon-sm"
                  variant="default"
                  className={cn(STEADY_HOVER, "ml-auto rounded-full")}
                  onClick={stop}
                  aria-label={t("assistant.stop", "Stop")}
                >
                  <Square className="fill-current" />
                </InputGroupButton>
              ) : (
                <InputGroupButton
                  type="submit"
                  size="icon-sm"
                  variant="default"
                  className={cn(STEADY_HOVER, "ml-auto rounded-full")}
                  disabled={!canSend}
                  aria-label={t("assistant.send", "Send")}
                >
                  <ArrowUp />
                </InputGroupButton>
              )}
            </InputGroupAddon>
          </InputGroup>
          <p className="text-xs text-muted-foreground">
            {isOnline
              ? t(
                  "assistant.disclaimer",
                  "Answers can be wrong. Check the data the assistant used."
                )
              : t(
                  "assistant.offline",
                  "The assistant needs an internet connection."
                )}
          </p>
        </form>
      </div>
      {showHistory && !place && (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AssistantHistory
            congregation={congregation}
            onBack={() => setShowHistory(false)}
            onOpen={(past) => void goOn(past)}
            onDeleted={forget}
          />
        </div>
      )}
      {place && (
        <div
          ref={canvasRef}
          tabIndex={-1}
          aria-label={place.title}
          className="flex min-h-0 min-w-0 flex-1 flex-col outline-none"
        >
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center">
                <Spinner />
              </div>
            }
          >
            <AssistantCanvas
              congregation={congregation}
              place={place}
              onSelectPlace={setPlace}
              onClose={() => setPlace(null)}
              onOpenInAdmin={selectTerritory}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};

// The phone drawer around the chat. On desktop the chat is docked beside the
// page instead (AssistantDock).
const AssistantModal = NiceModal.create((props: AssistantModalProps) => {
  const { modal, dialogProps, contentProps } = useBaseUiDialog();
  return (
    <ResponsiveDialog {...dialogProps}>
      <ResponsiveDialogContent {...contentProps}>
        <AssistantChat
          {...props}
          onClose={() => void modal.hide()}
          Title={ResponsiveDialogTitle}
          Header={ResponsiveDialogHeader}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
});

export default AssistantModal;
