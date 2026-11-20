import { useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  Ban,
  Building2,
  Calculator,
  Camera,
  CalendarRange,
  Check,
  Copy,
  DoorClosed,
  Download,
  History,
  House,
  Link,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  Navigation,
  RefreshCcw,
  Search,
  Settings,
  Square,
  Tags,
  ThumbsDown,
  ThumbsUp,
  UserCog,
  Users,
  Wrench,
  type LucideIcon
} from "lucide-react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/lib/motion";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { MessageFooter } from "@/components/ui/message";
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
import type { AssistantPlace } from "./assistant-canvas";
import AssistantProposalCard from "./assistant-proposal";
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
import { usesLocation } from "../../utils/assistantActions";
import { isLinkProposal } from "../../hooks/useAssistant";
import type useAssistant from "../../hooks/useAssistant";
import type {
  RatingReason,
  AssistantProposal,
  AssistantResult,
  AssistantStep,
  AssistantTurn
} from "../../hooks/useAssistant";

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
export const IconAction = ({
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
  homes: House,
  read_image: Camera,
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

interface AssistantReplyProps {
  turn: AssistantTurn;
  // The latest turn: only it offers Try again, follow-ups and location.
  isLast: boolean;
  // The answer arrived while the panel was open, so it is revealed as written.
  live: boolean;
  assistant: Pick<
    ReturnType<typeof useAssistant>,
    | "ask"
    | "retry"
    | "busy"
    | "location"
    | "members"
    | "rate"
    | "explainRating"
    | "setAction"
    | "confirmProposal"
    | "undoProposal"
  >;
  // The congregation's country, to look up new maps' addresses there.
  origin?: string;
  onSend: (question: string) => void;
  onShareLocation: (turnId: string) => void | Promise<void>;
  onSelectTerritory: (territoryId: string) => void;
  onShowPlace: (place: AssistantPlace) => void;
}

// One turn's reply: the checks it made with their tables, the answer, its
// charts and cards, and what can be done with it.
const AssistantReply = ({
  turn,
  isLast,
  live,
  assistant,
  origin,
  onSend,
  onShareLocation,
  onSelectTerritory,
  onShowPlace
}: AssistantReplyProps) => {
  const { t, i18n } = useTranslation();
  const valueLabel = useValueLabel();
  const { isOnline } = useNetworkStatusContext();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const {
    ask,
    retry,
    busy,
    location,
    members,
    rate,
    explainRating,
    setAction,
    confirmProposal,
    undoProposal
  } = assistant;
  const [fullTables, setFullTables] = useState<Set<string>>(new Set());
  // The answer or table just copied, to say so on its button for a moment.
  const [copied, setCopied] = useState<string>();
  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(undefined), 2000);
    } catch {
      // Clipboard access can be refused; the text is still on screen.
    }
  };

  // One after another, never together: each quick link is given the map with
  // the fewest people on it, so it has to see the links made before it.
  const [confirmingAll, setConfirmingAll] = useState(false);
  const confirmAll = async (proposals: AssistantProposal[]) => {
    setConfirmingAll(true);
    try {
      for (const proposal of proposals) {
        await confirmProposal(turn.id, proposal);
      }
    } finally {
      setConfirmingAll(false);
    }
  };

  // One map in the canvas: where it is, with directions, or its homes floor
  // by floor.
  const showMap = (kind: "map" | "building", row: Record<string, unknown>) =>
    onShowPlace({
      kind,
      id: String(row.map_id),
      title: String(row.map),
      territoryId: String(row.territory_id)
    });

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
          onClick={() => onSelectTerritory(String(row.territory_id))}
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
              onShowPlace({
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
                {/* What a photo's reading holds besides its homes, and what
                  the reader could not make out. */}
                {step.tool === "read_image" && step.result.note && (
                  <p className="mt-2 text-xs whitespace-pre-line text-muted-foreground">
                    {step.result.note}
                  </p>
                )}
              </TraceCollapsibleContent>
            </TraceCollapsible>
          )}
        </m.div>
      );
    };

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
  // The answer's link cards nobody has decided yet: a group's maps are given
  // out with one press.
  const waitingLinks = (response.proposals ?? []).filter(
    (proposal) =>
      isLinkProposal(proposal) &&
      (turn.actions?.[proposal.id]?.status ?? "idle") === "idle"
  );
  const steps = settledSteps(response.steps);
  const answerCopied = copied === turn.id;
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
                  onClick={() => void ask(turn.question, turn.view, turn.image)}
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
                    aria-label={t("assistant.feedbackWhy", "What went wrong?")}
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
            {waitingLinks.length > 1 && (
              <Button
                type="button"
                size="sm"
                className={cn(STEADY_HOVER, "self-start")}
                disabled={!isOnline || busy || confirmingAll}
                onClick={() => void confirmAll(waitingLinks)}
              >
                {confirmingAll ? <Spinner /> : <Check />}
                {t("assistant.action.confirmAll", "Confirm all {{count}}", {
                  count: waitingLinks.length
                })}
              </Button>
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
                  members={members}
                  onStatus={(patch) => setAction(turn.id, proposal.id, patch)}
                  onConfirm={(candidate) =>
                    void confirmProposal(turn.id, proposal, candidate)
                  }
                  onUndo={() =>
                    state && void undoProposal(turn.id, proposal, state)
                  }
                  onAskAgain={
                    isOnline && !busy
                      ? () => void ask(turn.question, turn.view, turn.image)
                      : undefined
                  }
                  onShareLocation={
                    usesLocation(proposal) &&
                    !location &&
                    isLast &&
                    isOnline &&
                    !busy
                      ? () => void onShareLocation(turn.id)
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
                onClick={() => void onShareLocation(turn.id)}
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
                    onClick={() => onSend(suggestion)}
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

export default AssistantReply;
