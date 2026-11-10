import NiceModal from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import {
  ComponentProps,
  FormEvent,
  KeyboardEvent,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState
} from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Ban,
  Building2,
  Calculator,
  CalendarRange,
  Check,
  Copy,
  DoorClosed,
  Download,
  Eye,
  History,
  Link,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  Navigation,
  RefreshCcw,
  ShieldCheck,
  Search,
  Settings,
  Square,
  SquarePen,
  Tags,
  ThumbsDown,
  ThumbsUp,
  UserCog,
  Users,
  Wrench,
  X,
  type LucideIcon
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { fadeIn, messageEnter } from "@/lib/motion";
import { AssistantIcon } from "@/components/common/assistant-icon";
import { useBaseUiDialog } from "@/components/common/base-ui-dialog";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle
} from "@/components/common/responsive-dialog";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea
} from "@/components/ui/input-group";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import {
  Message,
  MessageContent,
  MessageFooter
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport
} from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle
} from "@/components/ui/trace";
import { useNetworkStatusContext } from "../middlewares/networkstatuscontext";
import useNotification from "../../hooks/useNotification";
import type { AssistantPlace } from "./assistant-canvas";
import AssistantProposalCard from "./assistant-proposal";
import AssistantHistory from "./assistant-history";
import AssistantMapDetail from "./assistant-map-detail";
import { AnswerReveal } from "./assistant-reveal";
import { downloadCsv, toCsv, toTsv } from "../../utils/tableExport";
import AssistantChart from "./assistant-chart";
import {
  KIND_ICONS,
  STEADY_HOVER,
  useValueLabel,
  weekdayName
} from "./assistant-shared";
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
  type RatingReason,
  type AssistantView,
  type AssistantProposal,
  type AssistantResult,
  type AssistantStep,
  type AssistantTurn
} from "../../hooks/useAssistant";

// Leaflet loads only when a place is first opened.
const AssistantCanvas = lazy(() => import("./assistant-canvas"));

// Mirrors maxAssistantQuestionLength in the backend handler.
const MAX_QUESTION_LENGTH = 500;

// Rows shown before a table's "Show all" button.
const TABLE_PREVIEW_ROWS = 10;

// Place names and short type labels stay on one line; the table scrolls
// sideways.
// Names, codes and dates read wrong when they break across lines.
const ONE_LINE_COLUMNS = new Set([
  "map",
  "territory",
  "type",
  "map_type",
  "date",
  "day",
  "week",
  "month",
  "started",
  "work_began",
  "completed",
  "open_since",
  "last_completed",
  "last_worked",
  "round_open_since"
]);

// The check whose rows open by themselves under an answer: the last that found
// any and is not drawn as a chart below it.
const openStepIndex = (steps: AssistantStep[]) =>
  steps.findLastIndex((step) => (step.result?.total ?? 0) > 0 && !step.chart);

// A check the assistant retried shows once, as the retry; one that still
// failed stays, marked as not working.
const settledSteps = (steps: AssistantStep[]) =>
  steps.filter(
    (step, index) =>
      !step.error ||
      !steps.slice(index + 1).some((later) => later.tool === step.tool)
  );

// A ghost icon button whose label is also its tooltip.
const IconAction = ({
  label,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "aria-label"> & { label: string }) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={STEADY_HOVER}
          aria-label={label}
          {...props}
        />
      }
    >
      {children}
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const TOOL_ICONS: Record<string, LucideIcon> = {
  find_places: Search,
  territory_overview: MapPin,
  map_overview: MapIcon,
  map_details: Building2,
  maps_near: Navigation,
  activity: Activity,
  who_worked: Users,
  assignments: Link,
  not_home_backlog: DoorClosed,
  do_not_call_review: Ban,
  feedback: MessageSquare,
  data_quality: Wrench,
  change_history: History,
  people_and_roles: UserCog,
  household_types: Tags,
  congregation_settings: Settings,
  calculate: Calculator,
  territory_rounds: CalendarRange
};

const humanize = (key: string) =>
  key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ");

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

// Why an answer got a thumbs down; "wrong change" only when it had cards.
const reasonLabels: Record<RatingReason, string> = {
  wrong_figures: "Wrong numbers",
  misunderstood: "Misunderstood me",
  incomplete: "Left something out",
  wrong_change: "Wrong change",
  other: "Something else"
};
const downReasons = (hadCards: boolean): RatingReason[] =>
  (Object.keys(reasonLabels) as RatingReason[]).filter(
    (reason) => hadCards || reason !== "wrong_change"
  );

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
  const { t, i18n } = useTranslation();
  const valueLabel = useValueLabel();
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
  const {
    turns,
    ask,
    stop,
    retry,
    shareLocation,
    location,
    updateLocation,
    stopSharingLocation,
    setAction,
    confirmProposal,
    undoProposal,
    rate,
    explainRating,
    reset,
    continueConversation,
    conversationId,
    busy
  } = useAssistant(congregation, onSettingsChange);
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
  const [fullTables, setFullTables] = useState<Set<string>>(new Set());
  // Answers already there when the panel opened are shown as they are; only
  // those arriving while it is open are revealed as they are written.
  const [answeredBeforeOpen] = useState(
    () =>
      new Set(
        turns.filter((turn) => turn.status !== "pending").map((turn) => turn.id)
      )
  );
  // The answer or table just copied, to say so on its button for a moment.
  const [copied, setCopied] = useState<string>();
  const locale = i18n.resolvedLanguage ?? i18n.language;
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
    void ask(question, activeView);
    setText("");
    // Starters and suggestions go once used; keep keyboard users in place.
    focusInput();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSend) send(text);
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(undefined), 2000);
    } catch {
      // Clipboard access can be refused; the text is still on screen.
    }
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

  // One map in the canvas: where it is, with directions, or its homes floor
  // by floor.
  const showMap = (kind: "map" | "building", row: Record<string, unknown>) =>
    setPlace({
      kind,
      id: String(row.map_id),
      title: String(row.map),
      territoryId: String(row.territory_id)
    });

  // The drawer covers the page on phones, so it closes; the conversation
  // is kept and comes back when the assistant opens again.
  const selectTerritory = (territoryId: string) => {
    onSelectTerritory(territoryId);
    if (!docked) onClose();
  };

  const columnLabel = (column: string) =>
    t(`assistant.column.${column}`, humanize(column));

  const formatValue = (column: string, value: unknown) => {
    if (typeof value === "boolean") {
      return value ? (
        <>
          <Check aria-hidden="true" className="size-3.5" />
          <span className="sr-only">{t("assistant.yes", "Yes")}</span>
        </>
      ) : (
        <span aria-label={t("assistant.no", "No")}>–</span>
      );
    }
    if (typeof value === "number") return value.toLocaleString(locale);
    return cellText(column, value);
  };

  const renderCell = (row: Record<string, unknown>, column: string) => {
    const value = formatValue(column, row[column]);
    const territoryId = row.territory_id;
    if (
      (column === "territory" || column === "map") &&
      typeof territoryId === "string" &&
      territoryId !== "" &&
      value !== ""
    ) {
      return (
        <button
          type="button"
          className="text-left text-primary underline-offset-2 hover:underline"
          // Links in answers open the territory in the page itself; docked,
          // the conversation stays open beside it.
          onClick={() => selectTerritory(String(row.territory_id))}
        >
          {value}
        </button>
      );
    }
    return value;
  };

  // A cell as text, also for a spreadsheet: numbers as numbers, codes as words.
  const cellText = (column: string, value: unknown) => {
    if (typeof value === "boolean") {
      return value ? t("assistant.yes", "Yes") : t("assistant.no", "No");
    }
    if (typeof value === "number") return String(value);
    if (typeof value !== "string") return "";
    return (
      (column === "weekday" && weekdayName(value, locale)) || valueLabel(value)
    );
  };

  // Every row the check returned, not only those shown, with the headings.
  const tableText = (result: AssistantResult) => [
    result.columns.map(columnLabel),
    ...result.rows.map((row) =>
      result.columns.map((column) => cellText(column, row[column]))
    )
  ];

  // Tables scroll sideways only; a second vertical scroll area inside the chat
  // traps the wheel. Long tables start short and expand in place.
  const renderTable = (
    result: AssistantResult,
    tableKey: string,
    title: string
  ) => {
    const showAll = fullTables.has(tableKey);
    const rows = showAll
      ? result.rows
      : result.rows.slice(0, TABLE_PREVIEW_ROWS);
    // Rows that carry a location (maps near a place) can be shown together
    // on the canvas, numbered as in the table.
    const located = result.rows.filter(
      (row) => typeof row.lat === "number" && typeof row.lng === "number"
    );
    return (
      <div className="flex flex-col gap-1">
        {located.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(STEADY_HOVER, "self-start")}
            onClick={() =>
              setPlace({
                kind: "nearby",
                title: t("assistant.canvas.nearbyTitle", "Nearby maps"),
                origin: location,
                points: located.map((row) => ({
                  mapId: String(row.map_id),
                  territoryId: String(row.territory_id),
                  title: String(row.map),
                  lat: row.lat as number,
                  lng: row.lng as number,
                  distance: Number(row.distance_m ?? 0)
                }))
              })
            }
          >
            <MapPin />
            {t("assistant.showOnMap", "Show on map")}
          </Button>
        )}
        {/* The edges fade while there are more columns to scroll to; a
            cut-off column alone does not say the table scrolls. */}
        <div className="overflow-hidden rounded-md border">
          <div className="overflow-x-auto scroll-fade-x not-supports-[animation-timeline:scroll()]:scroll-fade-none">
            <table className="w-full text-xs">
              <thead className="bg-muted text-foreground">
                <tr>
                  {result.columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-2 py-1 text-left font-medium whitespace-nowrap"
                    >
                      {columnLabel(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-t">
                    {result.columns.map((column) => (
                      <td
                        key={column}
                        className={cn(
                          "px-2 py-1 align-top",
                          ONE_LINE_COLUMNS.has(column) && "whitespace-nowrap"
                        )}
                      >
                        {renderCell(row, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {result.rows.length > TABLE_PREVIEW_ROWS && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className={cn(STEADY_HOVER, "h-auto p-0 text-xs")}
              onClick={() =>
                setFullTables((previous) => {
                  const next = new Set(previous);
                  if (showAll) next.delete(tableKey);
                  else next.add(tableKey);
                  return next;
                })
              }
            >
              {showAll
                ? t("assistant.showFewer", "Show fewer")
                : t("assistant.showMore", "Show {{count}} more", {
                    count: result.rows.length - TABLE_PREVIEW_ROWS
                  })}
            </Button>
          )}
          {/* For reports: paste into a spreadsheet, or keep as a file. */}
          <span className="ml-auto flex">
            <IconAction
              label={
                copied === tableKey
                  ? t("assistant.copied", "Copied")
                  : t("assistant.copyTable", "Copy table")
              }
              onClick={() => void copy(toTsv(tableText(result)), tableKey)}
            >
              {copied === tableKey ? <Check /> : <Copy />}
            </IconAction>
            <IconAction
              label={t("assistant.downloadCsv", "Download as CSV")}
              onClick={() => downloadCsv(title, toCsv(tableText(result)))}
            >
              <Download />
            </IconAction>
          </span>
        </div>
        {result.rows.length < result.total && (
          <p className="text-xs">
            {t("assistant.rowsShown", "First {{shown}} of {{total}} found", {
              shown: result.rows.length,
              total: result.total
            })}
          </p>
        )}
      </div>
    );
  };

  // openIndex is the step whose table starts open: an answer's last check
  // with rows, so a list-type answer shows its list without a click. While
  // streaming it is -1; the keys then change, so the tables remount and the
  // finished answer's table does open.
  const renderStep =
    (turnId: string, openIndex = -1, streaming = false) =>
    (step: AssistantStep, index: number) => {
      // Checks are remade once, when they take their final form (rows open),
      // and keep that form until the answer is done.
      const key = streaming ? `live-${index}` : `final-${index}`;
      const Icon =
        TOOL_ICONS[step.tool] ??
        KIND_ICONS[
          step.tool.replace(/^propose_/, "") as AssistantProposal["kind"]
        ] ??
        Search;
      const title = t(`assistant.tool.${step.tool}`, humanize(step.tool));
      const line = (
        <TraceLine status={step.error ? "error" : undefined}>
          <TraceIcon>
            <Icon />
          </TraceIcon>
          <TraceTitle>{title}</TraceTitle>
          {step.error && (
            <TraceDescription>
              {t("assistant.stepFailed", "didn't work")}
            </TraceDescription>
          )}
          {step.result && (
            <TraceDescription>
              {step.result.total === 0
                ? t("assistant.noRows", "nothing found")
                : t("assistant.rowCount", "{{count}} found", {
                    count: step.result.total
                  })}
            </TraceDescription>
          )}
        </TraceLine>
      );
      // Checks fade in as they stream; a finished answer's are already there.
      const enter = streaming
        ? ({ initial: "hidden", animate: "show", variants: fadeIn } as const)
        : {};
      return (
        <m.div key={key} {...enter}>
          {!step.result || step.result.total === 0 ? (
            line
          ) : (
            <TraceCollapsible defaultOpen={index === openIndex}>
              <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
              <TraceCollapsibleContent>
                {step.tool === "map_details" && step.result.rows[0] ? (
                  <AssistantMapDetail
                    row={step.result.rows[0]}
                    onShowHomes={() =>
                      showMap("building", step.result!.rows[0])
                    }
                    onShowOnMap={() => showMap("map", step.result!.rows[0])}
                  />
                ) : (
                  renderTable(step.result, `${turnId}-${index}`, title)
                )}
              </TraceCollapsibleContent>
            </TraceCollapsible>
          )}
        </m.div>
      );
    };

  const renderReply = (turn: AssistantTurn, isLast: boolean) => {
    const retryButton = isLast && !busy && (
      <MessageFooter className="px-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={STEADY_HOVER}
          onClick={() => retry(turn.id)}
        >
          <RefreshCcw />
          {t("assistant.retry", "Try again")}
        </Button>
      </MessageFooter>
    );
    if (turn.status === "pending" || turn.status === "stopped") {
      // Checks stream in as they finish; the last line says what is still
      // happening, or that the admin stopped it, until the answer itself
      // starts to appear in its place. The answer keeps the place and element
      // the finished reply uses, so nothing moves or fades twice when it ends.
      const steps = settledSteps(turn.progress);
      const writing = turn.status === "pending" && !!turn.draft;
      return (
        <>
          {(steps.length > 0 || !writing) && (
            <Trace>
              {/* Once the answer is being written, its checks take their
                  final form, rows open, so the text is written below them
                  and nothing moves when it is done. */}
              {steps.map(
                writing
                  ? renderStep(turn.id, openStepIndex(steps))
                  : renderStep(turn.id, -1, true)
              )}
              {writing ? null : turn.status === "pending" ? (
                <TraceLine status="running">
                  <TraceIcon>
                    <Spinner />
                  </TraceIcon>
                  <TraceTitle>
                    {turn.progress.length === 0
                      ? t("assistant.reading", "Reading your question…")
                      : t("assistant.thinking", "Thinking…")}
                  </TraceTitle>
                </TraceLine>
              ) : (
                <TraceLine>
                  <TraceIcon>
                    <Square />
                  </TraceIcon>
                  <TraceTitle>{t("assistant.stopped", "Stopped")}</TraceTitle>
                </TraceLine>
              )}
            </Trace>
          )}
          {writing && (
            <m.div className="flex flex-col gap-3">
              <AnswerReveal text={turn.draft ?? ""} animate />
            </m.div>
          )}
          {turn.status === "stopped" && retryButton}
        </>
      );
    }
    if (turn.status === "error") {
      return (
        <>
          <Bubble variant="destructive" role="alert">
            <BubbleContent>{turn.error}</BubbleContent>
          </Bubble>
          {retryButton}
        </>
      );
    }
    const response = turn.response;
    if (!response) return null;
    const steps = settledSteps(response.steps);
    const answerCopied = copied === turn.id;
    const live = !turn.askedAt && !answeredBeforeOpen.has(turn.id);
    // Checks the answer asked to draw; their tables stay above as the data.
    const charts = steps.map(
      (step, index) =>
        step.chart &&
        step.result && (
          <AssistantChart
            key={index}
            rows={step.result.rows}
            chart={step.chart}
            columnLabel={columnLabel}
            valueLabel={valueLabel}
            locale={locale}
            animate={live}
          />
        )
    );
    return (
      <>
        {steps.length > 0 && (
          <Trace>{steps.map(renderStep(turn.id, openStepIndex(steps)))}</Trace>
        )}
        <m.div
          className="flex flex-col gap-3"
          initial={live ? "hidden" : false}
          animate="show"
          variants={fadeIn}
        >
          {response.grounded ? (
            <AnswerReveal text={response.answer} animate={live}>
              {charts}
              {/* Only the latest answer's actions always show; earlier ones
                appear on hover or focus, and always on touch screens. */}
              <MessageFooter
                className={cn(
                  "px-0",
                  !isLast &&
                    "transition-opacity focus-within:opacity-100 group-hover/turn:opacity-100 [@media(hover:hover)]:opacity-0"
                )}
              >
                <IconAction
                  label={
                    answerCopied
                      ? t("assistant.copied", "Copied")
                      : t("assistant.copy", "Copy answer")
                  }
                  onClick={() => void copy(response.answer, turn.id)}
                >
                  {answerCopied ? <Check /> : <Copy />}
                </IconAction>
                {response.questionId &&
                  ([1, -1] as const).map((rating) => {
                    const Thumb = rating === 1 ? ThumbsUp : ThumbsDown;
                    const pressed = turn.rating === rating;
                    return (
                      <IconAction
                        key={rating}
                        label={
                          rating === 1
                            ? t("assistant.goodAnswer", "Good answer")
                            : t("assistant.badAnswer", "Bad answer")
                        }
                        aria-pressed={pressed}
                        onClick={() => rate(turn.id, rating)}
                      >
                        <Thumb className={cn(pressed && "fill-current")} />
                      </IconAction>
                    );
                  })}
                {/* An answer from an earlier day may be out of date; asking
                  again answers from today's data. */}
                {turn.askedAt && (
                  <IconAction
                    label={t("assistant.action.askAgain", "Ask again")}
                    disabled={!isOnline || busy}
                    onClick={() => void ask(turn.question, turn.view)}
                  >
                    <RefreshCcw />
                  </IconAction>
                )}
              </MessageFooter>
              {turn.rating === -1 && (
                <div className="flex flex-col gap-2">
                  {turn.ratingReason ? (
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "assistant.feedbackThanks",
                        "Thanks. Your feedback helps improve the assistant."
                      )}
                    </p>
                  ) : (
                    <div
                      role="group"
                      aria-label={t(
                        "assistant.feedbackWhy",
                        "What went wrong?"
                      )}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <span className="text-xs text-muted-foreground">
                        {t("assistant.feedbackWhy", "What went wrong?")}
                      </span>
                      {downReasons((response.proposals?.length ?? 0) > 0).map(
                        (reason) => (
                          <Button
                            key={reason}
                            type="button"
                            variant="outline"
                            size="xs"
                            className={STEADY_HOVER}
                            onClick={() => explainRating(turn.id, reason)}
                          >
                            {t(
                              `assistant.feedbackReason.${reason}`,
                              reasonLabels[reason]
                            )}
                          </Button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
              {(response.proposals ?? []).map((proposal) => {
                const state = turn.actions?.[proposal.id];
                return (
                  <AssistantProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    state={state}
                    // Any card not yet decided can be confirmed, not only the
                    // latest answer's: each re-checks its record first, so one
                    // gone out of date changes nothing. Not while an answer is
                    // being written.
                    actionable={isOnline && !busy}
                    online={isOnline}
                    onStatus={(patch) => setAction(turn.id, proposal.id, patch)}
                    onConfirm={(candidate) =>
                      void confirmProposal(turn.id, proposal, candidate)
                    }
                    onUndo={() =>
                      state && void undoProposal(turn.id, proposal, state)
                    }
                    onAskAgain={
                      isOnline && !busy
                        ? () => void ask(turn.question, turn.view)
                        : undefined
                    }
                    onShareLocation={
                      (proposal.kind === "map_location" ||
                        proposal.kind === "quick_link") &&
                      !location &&
                      isLast &&
                      isOnline &&
                      !busy
                        ? () => void shareMyLocation(turn.id)
                        : undefined
                    }
                    origin={origin}
                  />
                );
              })}
              {isLast && !busy && response.needsLocation && (
                <Button
                  type="button"
                  size="sm"
                  className={cn(STEADY_HOVER, "self-start")}
                  disabled={!isOnline}
                  onClick={() => void shareMyLocation(turn.id)}
                >
                  <MapPin />
                  {t("assistant.useLocation", "Use my location")}
                </Button>
              )}
              {/* Only the latest answer's follow-ups are offered; older ones
                  would ask about a conversation that has moved on. */}
              {isLast && !busy && (response.suggestions?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2">
                  {response.suggestions?.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        STEADY_HOVER,
                        "h-auto py-1.5 text-left whitespace-normal"
                      )}
                      disabled={!isOnline}
                      onClick={() => send(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </AnswerReveal>
          ) : (
            <>
              {charts}
              <p className="text-muted-foreground">
                {response.steps.length > 0
                  ? t(
                      "assistant.ungrounded",
                      "I could not write an answer that matches your data exactly. Open the checks above to see what I found."
                    )
                  : t(
                      "assistant.ungroundedNoChecks",
                      "I could not write an answer that matches your data exactly. Try asking again, perhaps in other words."
                    )}
              </p>
              {retryButton}
            </>
          )}
        </m.div>
      </>
    );
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
                  "Names in your records are hidden from the AI."
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
                              <Bubble align="end" variant="muted">
                                <BubbleContent>{turn.question}</BubbleContent>
                              </Bubble>
                              {turn.view && (
                                <span className="text-xs text-muted-foreground">
                                  {t(
                                    "assistant.view.askedAbout",
                                    "About {{place}}",
                                    {
                                      place: viewLabel(turn.view)
                                    }
                                  )}
                                </span>
                              )}
                              {turn.askedAt && (
                                <span className="text-xs text-muted-foreground">
                                  {t(
                                    "assistant.history.asked",
                                    "Asked {{date}}",
                                    {
                                      date: LinkDateFormatter.format(
                                        Date.parse(turn.askedAt)
                                      )
                                    }
                                  )}
                                </span>
                              )}
                            </MessageContent>
                          </Message>
                          <Message>
                            <MessageContent className="gap-3">
                              {renderReply(turn, index === turns.length - 1)}
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
          <InputGroup>
            <InputGroupTextarea
              ref={textareaRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={onKeyDown}
              maxLength={MAX_QUESTION_LENGTH}
              disabled={!isOnline}
              placeholder={t("assistant.placeholder", "Ask a question…")}
              aria-label={t("assistant.placeholder", "Ask a question…")}
              className="min-h-0 p-3"
            />
            <InputGroupAddon align="inline-end" className="self-end">
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
