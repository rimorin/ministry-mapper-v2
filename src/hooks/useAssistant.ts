import { useEffect, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react";
import { ClientResponseError } from "pocketbase";
import {
  callFunction,
  createData,
  deleteDataById,
  getFirstItemOfList,
  isAbortError,
  pb,
  updateDataById
} from "../utils/pocketbase";
import { ANALYTICS_EVENTS, trackEvent } from "../utils/analytics";
import { sendFeedback } from "../utils/assistantFeedback";
import { generateRecordId } from "../utils/recordId";
import { safeStorage } from "../utils/safeStorage";
import {
  parseSettings,
  runRecordProposal,
  undoRecordProposal,
  type CongregationSettings
} from "../utils/assistantActions";

export interface AssistantResult {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  total: number;
  note?: string;
}

// How an answer asked for a check's rows to be drawn: x along the axis, up to
// three numeric columns in y.
export interface AssistantChartSpec {
  type: "line" | "bar";
  x: string;
  y: string[];
}

export interface AssistantStep {
  tool: string;
  result?: AssistantResult;
  error?: string;
  chart?: AssistantChartSpec;
}

interface AssistantAnswer {
  answer: string;
  grounded: boolean;
  steps: AssistantStep[];
  // The answer as the model wrote it, with people as tokens; sent back as
  // history so names never reach the model.
  context: string;
  people: Record<string, string>;
  // Follow-up questions to offer as one-tap suggestions.
  suggestions?: string[];
  // Set when the question needs the admin's location and none was shared.
  needsLocation?: boolean;
  // Changes prepared for the admin to confirm on a card.
  proposals?: AssistantProposal[];
  // The logged question, to rate the answer and report its cards' outcomes.
  questionId?: string;
  // The conversation it was logged in, sent with the next question.
  conversationId?: string;
}

// A past conversation in the list, and one opened from it (routes in
// assistant_history.go). Titles are empty until the admin renames them.
export interface ConversationSummary {
  id: string;
  title: string;
  firstQuestion: string;
  questions: number;
  lastQuestion: string;
}

// A change card as history keeps it: the card as it was prepared, and what
// became of it ("" when it was never acted on).
interface PastCard {
  proposal: AssistantProposal;
  outcome: string;
  person?: string;
  // The link a link card created, sent only while it still works, and the map
  // a quick link picked.
  record?: string;
  label?: string;
}

export interface PastTurn {
  id: string;
  question: string;
  // Names put back, to show; context keeps people as tokens, for the model.
  answer: string;
  context: string;
  asked: string;
  cards: PastCard[];
  // The lookups and what they found, names included.
  steps: AssistantStep[];
  // "" when it was answered.
  status: "" | "failed" | "stopped";
  view: AssistantView | null;
  rating: number;
  reason: string;
}

export interface PastConversation {
  conversation: { id: string };
  turns: PastTurn[];
  people: Record<string, string>;
}

// The admin's past conversations in a congregation, through one route.
const historyCall = <T>(
  congregation: string,
  body: Record<string, unknown>,
  key: string
) =>
  callFunction("/assistant/history", {
    method: "POST",
    body: { congregation, ...body },
    requestKey: key
  }) as Promise<T>;

export const listConversations = (congregation: string, offset = 0) =>
  historyCall<{ conversations: ConversationSummary[]; more: boolean }>(
    congregation,
    { action: "list", offset },
    `assistant-history-list-${congregation}`
  );

export const openConversation = (congregation: string, id: string) =>
  historyCall<PastConversation>(
    congregation,
    { action: "open", conversation: id },
    `assistant-history-open-${id}`
  );

export const renameConversation = (
  congregation: string,
  id: string,
  title: string
) =>
  historyCall<void>(
    congregation,
    { action: "rename", conversation: id, title },
    `assistant-history-rename-${id}`
  );

export const deleteConversation = (congregation: string, id: string) =>
  historyCall<void>(
    congregation,
    { action: "delete", conversation: id },
    `assistant-history-delete-${id}`
  );

export interface ProposalCandidate {
  userId: string;
  roleId?: string;
  name: string;
  email: string;
  // For a role change: the person's current role, and the warnings and block
  // that apply to them, since same-named people can differ.
  role?: string;
  warnings?: string[];
  blocked?: string;
}

interface ProposalTarget {
  id: string;
  name: string;
}

export interface AssistantProposal {
  id: string;
  kind:
    | "role_change"
    | "role_revoke"
    | "role_grant"
    | "map_rename"
    | "territory_rename"
    | "share_link"
    | "pin_message"
    | "report_email"
    | "mark_read"
    | "unpin_message"
    | "map_location"
    | "link_revoke"
    | "quick_link"
    | "home_update"
    | "map_reset"
    | "territory_reset"
    | "tries_reset"
    | "homes_status"
    | "dnc_return"
    | "settings"
    | "map_move"
    | "floor_add"
    | "unit_add"
    | "territory_create"
    | "maps_create";
  candidates: ProposalCandidate[];
  from: string;
  to: string;
  warnings: string[];
  blocked?: string;
  // Changes to a map or territory: what they apply to, what will be stored
  // (a name, a publisher, an instruction) and what was stored before.
  target?: ProposalTarget;
  value?: string;
  previous?: string;
  // Share links: normal or personal, lasting this many hours.
  linkType?: "normal" | "personal";
  hours?: number;
  // The records a change touches: messages, links or homes.
  items?: ProposalItem[];
  // What the card shows for structural and many-home changes: how many
  // homes a reset touches, the floor and units added, the do-not-call
  // cut-off.
  data?: Record<string, unknown>;
}

export interface ProposalItem {
  id: string;
  map: string;
  label: string;
  detail?: string;
}

export const isRoleProposal = (proposal: AssistantProposal) =>
  proposal.kind === "role_change" ||
  proposal.kind === "role_revoke" ||
  proposal.kind === "role_grant";

export const isLinkProposal = (proposal: AssistantProposal) =>
  proposal.kind === "share_link" || proposal.kind === "quick_link";

// A role change as it applies to the picked person; before a pick, as the
// proposal states it.
export const roleChangeFor = (
  proposal: AssistantProposal,
  candidate?: ProposalCandidate
) => ({
  from: candidate?.role ?? proposal.from,
  warnings: candidate?.warnings ?? proposal.warnings,
  blocked: candidate?.blocked ?? proposal.blocked
});

// Where a proposal's card stands. Kept with the turn, so it survives the panel
// closing and the next question can say what the admin decided.
export interface ProposalState {
  status:
    | "idle"
    | "confirming"
    | "running"
    | "done"
    | "failed"
    | "stale"
    | "cancelled"
    | "undoing"
    | "undone";
  // The person the change applied to, and the role record it left, for Undo.
  candidate?: ProposalCandidate;
  roleId?: string;
  // The link or instruction the change created, for Undo.
  recordId?: string;
  // The messages or links the change touched.
  recordIds?: string[];
  // What the change stored where Undo must check it is still there.
  applied?: string;
  // The map a quick link picked.
  label?: string;
  // Homes left alone because they changed since the proposal.
  skipped?: number;
  // Records of a change to many that could not be changed.
  failed?: number;
  // New maps: where each one is, by its place in the proposal's list, set on
  // the card before confirming.
  locations?: Record<string, SharedLocation>;
  doneAt?: number;
  error?: string;
}

// Why an answer got a thumbs down; mirrors downReasons in the backend.
export type RatingReason =
  "wrong_figures" | "misunderstood" | "incomplete" | "wrong_change" | "other";

export interface SharedLocation {
  lat: number;
  lng: number;
}

// What the admin has open in the app when asking: a territory and the map
// scrolled to in it. Only the ids go to the backend, which reads the names
// itself; the codes and names here are for the panel to show.
export interface AssistantView {
  territoryId: string;
  territoryCode: string;
  territoryName?: string;
  mapId?: string;
  mapName?: string;
}

export interface AssistantTurn {
  id: string;
  question: string;
  // The view the question was asked with, so a retry asks about the same.
  view?: AssistantView;
  // stopped: the admin pressed Stop before the answer arrived.
  status: "pending" | "done" | "error" | "stopped";
  // Checks that finished while the answer is still being written.
  progress: AssistantStep[];
  // The answer as it is written, until the response replaces it.
  draft?: string;
  response?: AssistantAnswer;
  error?: string;
  actions?: Record<string, ProposalState>;
  // When it was asked, for turns brought back from an earlier conversation.
  askedAt?: string;
  // The admin's thumbs up (1) or down (-1) on the answer, and why for a down.
  rating?: 1 | -1;
  ratingReason?: RatingReason;
}

// Mirrors MaxHistory in the backend's assistant package.
const MAX_HISTORY = 8;

// Conversations live outside the panel, keyed by congregation, so closing the
// panel (for example to open a territory from an answer) keeps them, and an
// answer still arriving lands where the reopened panel can show it.
const conversations = new Map<string, AssistantTurn[]>();
// A location the admin chose to share, kept for the rest of the conversation
// and sent with each question; a new conversation asks again.
const sharedLocations = new Map<string, SharedLocation>();
// The conversation the questions are logged in. The panel names it at the first
// question and keeps the name in the browser, so a reload brings it back.
const conversationIds = new Map<string, string>();
const storedConversation = (congregation: string) =>
  `assistant-conversation-${congregation}`;
const readStoredConversation = (congregation: string) =>
  safeStorage.get(storedConversation(congregation)) ?? undefined;
// Storage blocked: the conversation lasts until the page reloads.
const setConversationId = (congregation: string, id: string | undefined) => {
  if (id) {
    conversationIds.set(congregation, id);
    safeStorage.set(storedConversation(congregation), id);
  } else {
    conversationIds.delete(congregation);
    safeStorage.remove(storedConversation(congregation));
  }
  notify();
};
// Congregations whose stored conversation is being, or was, brought back.
const restoring = new Set<string>();
const listeners = new Set<() => void>();
const NO_TURNS: AssistantTurn[] = [];

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notify = () => listeners.forEach((listener) => listener());

// Shares a location for the congregation's conversation, or stops sharing it.
const setSharedLocation = (
  congregation: string,
  location: SharedLocation | undefined
) => {
  if (location) sharedLocations.set(congregation, location);
  else sharedLocations.delete(congregation);
  notify();
};

// Reads the device's position. Rejects when the admin refuses or the device
// cannot tell, so the panel can explain.
const readPosition = async (): Promise<SharedLocation> => {
  if (!navigator.geolocation) throw new Error("unsupported");
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    })
  );
  return { lat: position.coords.latitude, lng: position.coords.longitude };
};

const update = (
  congregation: string,
  change: (turns: AssistantTurn[]) => AssistantTurn[]
) => {
  conversations.set(
    congregation,
    change(conversations.get(congregation) ?? NO_TURNS)
  );
  notify();
};

const updateTurn = (
  congregation: string,
  id: string,
  change: (turn: AssistantTurn) => AssistantTurn
) =>
  update(congregation, (turns) =>
    turns.map((turn) => (turn.id === id ? change(turn) : turn))
  );

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });

interface StreamHandlers {
  onStep: (step: AssistantStep) => void;
  onText: (text: string) => void;
  onReset: () => void;
}

// The backend streams its answer as newline-delimited JSON: a "step" event per
// finished check, "delta" events as the answer is written ("reset" withdraws
// them), then "done" with the full answer, or "error". PocketBase's send()
// still builds the request (URL, auth, abort); this only reads the stream as it
// arrives and hands send() a plain JSON response at the end.
const streamingFetch =
  ({ onStep, onText, onReset }: StreamHandlers) =>
  async (url: RequestInfo | URL, config?: RequestInit) => {
    const response = await fetch(url, config);
    const isStream = response.headers
      .get("Content-Type")
      ?.includes("application/x-ndjson");
    if (!response.ok || !response.body || !isStream) return response;

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();
    let buffered = "";
    let result: Response | undefined;
    for (;;) {
      const { done, value } = await reader.read();
      if (value) buffered += value;
      let newline = buffered.indexOf("\n");
      while (newline >= 0) {
        const line = buffered.slice(0, newline).trim();
        buffered = buffered.slice(newline + 1);
        newline = buffered.indexOf("\n");
        if (!line) continue;
        const event = JSON.parse(line);
        switch (event.type) {
          case "step":
            onStep(event.step);
            break;
          case "delta":
            onText(event.text);
            break;
          case "reset":
            onReset();
            break;
          case "done":
            result = jsonResponse(200, event.response);
            break;
          case "error":
            result = failure(event.message);
        }
      }
      if (done) break;
    }
    return result ?? failure("The answer stopped before it finished.");
  };

// A failed answer as PocketBase's send() expects an error response.
const failure = (message: string) =>
  jsonResponse(500, { status: 500, message, data: {} });

let turnCounter = 0;

// How long after a change its card offers Undo.
export const UNDO_WINDOW_MS = 5 * 60 * 1000;

// What the next question tells the model about each card's outcome.
const OUTCOMES: Partial<Record<ProposalState["status"], string>> = {
  done: "The admin confirmed this change.",
  cancelled: "The admin cancelled this change.",
  undone: "The admin confirmed this change, then undid it.",
  failed: "The change failed and was not made.",
  stale:
    "The change was not made because the record had changed since it was prepared."
};

const requestKey = (turnId: string) => `assistant-ask-${turnId}`;

// A card as history kept it, back where it was: one never acted on can still
// be confirmed; a link that still works can be shared again. Undo is not
// offered again, as its time has passed.
const restoredAction = (card: PastCard): ProposalState => ({
  status: card.outcome as ProposalState["status"],
  // Cards logged before the account id was kept hold the name.
  candidate: card.proposal.candidates.find(
    (candidate) =>
      candidate.userId === card.person || candidate.name === card.person
  ),
  recordId: card.record,
  label: card.label
});

// A turn from history, shown as it was when asked.
const restoredTurn = (
  turn: PastTurn,
  people: Record<string, string>,
  failedMessage: string
): AssistantTurn => {
  const base = {
    id: `turn-${++turnCounter}`,
    question: turn.question,
    view: turn.view ?? undefined,
    askedAt: turn.asked,
    progress: []
  };
  if (turn.status === "failed") {
    return { ...base, status: "error", error: failedMessage };
  }
  if (turn.status === "stopped") {
    return { ...base, status: "stopped", progress: turn.steps };
  }
  const acted = turn.cards.filter((card) => card.outcome);
  return {
    ...base,
    status: "done",
    response: {
      answer: turn.answer,
      // An answer that was dropped was logged empty.
      grounded: turn.context !== "",
      steps: turn.steps,
      context: turn.context,
      people,
      proposals: turn.cards.map((card) => card.proposal),
      questionId: turn.id
    },
    actions: acted.length
      ? Object.fromEntries(
          acted.map((card) => [card.proposal.id, restoredAction(card)])
        )
      : undefined,
    rating: turn.rating === 1 || turn.rating === -1 ? turn.rating : undefined,
    ratingReason: (turn.reason || undefined) as RatingReason | undefined
  };
};

// onSettingsChange hears the congregation's settings as a card left them, so the
// page can use them without a reload.
export default function useAssistant(
  congregation: string,
  onSettingsChange?: (settings: CongregationSettings) => void
) {
  const { t, i18n } = useTranslation();
  const turns = useSyncExternalStore(
    subscribe,
    () => conversations.get(congregation) ?? NO_TURNS
  );
  const busy = turns.some((turn) => turn.status === "pending");

  const errorMessage = (error: unknown) => {
    if (error instanceof ClientResponseError) {
      if (error.status === 403 && error.message.includes("not enabled")) {
        return t(
          "assistant.error.disabled",
          "The assistant is not turned on for your congregation."
        );
      }
      if (error.status === 429) {
        return t(
          "assistant.error.limit",
          "Your congregation has reached today's question limit. Try again tomorrow."
        );
      }
      if (error.status === 503) {
        return t(
          "assistant.error.unavailable",
          "The assistant is not available right now."
        );
      }
    }
    Sentry.captureException(error);
    return t(
      "assistant.error.generic",
      "Something went wrong. Please try again."
    );
  };

  const ask = async (question: string, view?: AssistantView) => {
    const trimmed = question.trim();
    if (!trimmed || busy) return;

    const id = `turn-${++turnCounter}`;
    // From the store, not this render: a conversation brought back from history
    // and asked about in the same click is already there.
    const answered = (conversations.get(congregation) ?? NO_TURNS).filter(
      (turn) => turn.status === "done" && turn.response?.grounded
    );
    const history = answered.slice(-MAX_HISTORY).map((turn) => ({
      question: turn.question,
      answer: [
        turn.response?.context ?? "",
        ...Object.values(turn.actions ?? {}).map(
          (action) => OUTCOMES[action.status] ?? ""
        )
      ]
        .filter(Boolean)
        .join(" ")
    }));
    const people = Object.assign(
      {},
      ...answered.map((turn) => turn.response?.people ?? {})
    );

    update(congregation, (previous) => [
      ...previous,
      { id, question: trimmed, view, status: "pending", progress: [] }
    ]);
    // A record id, as conversationIDPattern in the backend expects.
    let conversation = conversationIds.get(congregation);
    if (!conversation) {
      conversation = generateRecordId();
      setConversationId(congregation, conversation);
    }
    // The answer arrives a few characters at a time; the panel takes it in
    // once a frame, as fast as it can be revealed.
    let unread = "";
    let frame = 0;
    const takeText = () => {
      frame = 0;
      const text = unread;
      unread = "";
      updateTurn(congregation, id, (turn) => ({
        ...turn,
        draft: (turn.draft ?? "") + text
      }));
    };
    try {
      const response = (await callFunction("/assistant/ask", {
        method: "POST",
        body: {
          congregation,
          question: trimmed,
          history,
          locale: i18n.resolvedLanguage ?? i18n.language,
          people,
          location: sharedLocations.get(congregation),
          conversation,
          view: view && { territory: view.territoryId, map: view.mapId ?? "" }
        },
        requestKey: requestKey(id),
        fetch: streamingFetch({
          onStep: (step) =>
            updateTurn(congregation, id, (turn) => ({
              ...turn,
              progress: [...turn.progress, step]
            })),
          onText: (text) => {
            unread += text;
            frame ||= requestAnimationFrame(takeText);
          },
          onReset: () => {
            cancelAnimationFrame(frame);
            frame = 0;
            unread = "";
            updateTurn(congregation, id, (turn) => ({
              ...turn,
              draft: undefined
            }));
          }
        })
      })) as AssistantAnswer;
      // Another id when the panel's could not be used, such as one taken.
      if (
        response.conversationId &&
        response.conversationId !== conversationIds.get(congregation)
      ) {
        setConversationId(congregation, response.conversationId);
      }
      updateTurn(congregation, id, (turn) => ({
        ...turn,
        status: "done",
        draft: undefined,
        response
      }));
    } catch (error) {
      if (isAbortError(error)) {
        updateTurn(congregation, id, (turn) => ({
          ...turn,
          status: "stopped",
          draft: undefined
        }));
        return;
      }
      const message = errorMessage(error);
      updateTurn(congregation, id, (turn) => ({
        ...turn,
        status: "error",
        draft: undefined,
        error: message
      }));
    } finally {
      // Text still waiting for a frame is replaced by the answer or dropped.
      cancelAnimationFrame(frame);
    }
  };

  const stop = () => {
    const pending = turns.find((turn) => turn.status === "pending");
    if (pending) pb.cancelRequest(requestKey(pending.id));
  };

  // Asks a failed or stopped question again, in its place at the end.
  const retry = (turnId: string) => {
    const turn = turns.find((candidate) => candidate.id === turnId);
    if (!turn || busy) return;
    update(congregation, (previous) =>
      previous.filter((candidate) => candidate.id !== turnId)
    );
    void ask(turn.question, turn.view);
  };

  // Records a rating or a card's outcome on the logged question, for history
  // and to find wrong answers later.
  const report = (
    response: AssistantAnswer | undefined,
    body: Record<string, unknown>,
    key: string
  ) => {
    if (!response?.questionId) return;
    sendFeedback(key, { question: response.questionId, ...body });
  };

  const setAction = (
    turnId: string,
    proposalId: string,
    patch: Partial<ProposalState>
  ) => {
    updateTurn(congregation, turnId, (turn) => ({
      ...turn,
      actions: {
        ...turn.actions,
        [proposalId]: {
          status: "idle",
          ...turn.actions?.[proposalId],
          ...patch
        }
      }
    }));
    // The outcomes the model is told about are the ones worth recording.
    if (patch.status && OUTCOMES[patch.status]) {
      // From the store, just updated: a change confirmed in this render's
      // closure picked its person after the render.
      const turn = (conversations.get(congregation) ?? NO_TURNS).find(
        (candidate) => candidate.id === turnId
      );
      const proposal = turn?.response?.proposals?.find(
        (candidate) => candidate.id === proposalId
      );
      const action = turn?.actions?.[proposalId];
      // For a role change, whom it applied to, so history can say; for a
      // link, the link it created, so history can share it again.
      const person = action?.candidate?.userId;
      const link =
        proposal &&
        isLinkProposal(proposal) &&
        patch.status === "done" &&
        action?.recordId
          ? {
              record: action.recordId,
              ...(action.label && { label: action.label })
            }
          : {};
      if (proposal) {
        report(
          turn?.response,
          {
            proposal: proposal.id,
            outcome: patch.status,
            ...(person && { person }),
            ...link
          },
          `assistant-outcome-${proposalId}`
        );
      }
    }
  };

  // Thumbs up or down on an answer; the same thumb again takes it back.
  const rate = (turnId: string, rating: 1 | -1) => {
    const turn = turns.find((candidate) => candidate.id === turnId);
    if (!turn?.response?.questionId) return;
    const next = turn.rating === rating ? undefined : rating;
    updateTurn(congregation, turnId, (current) => ({
      ...current,
      rating: next,
      ratingReason: undefined
    }));
    report(turn.response, { rating: next ?? 0 }, `assistant-rate-${turnId}`);
  };

  // Says why an answer got a thumbs down.
  const explainRating = (turnId: string, reason: RatingReason) => {
    const turn = turns.find((candidate) => candidate.id === turnId);
    if (!turn?.response?.questionId || turn.rating !== -1) return;
    updateTurn(congregation, turnId, (current) => ({
      ...current,
      ratingReason: reason
    }));
    report(turn.response, { rating: -1, reason }, `assistant-rate-${turnId}`);
  };

  const actionError = (error: unknown) =>
    error instanceof ClientResponseError ? error.message : String(error);

  // Runs a confirmed proposal with the admin's own session, through the calls
  // the Users and Invite screens make, so the same permission checks, guards
  // and role log apply. The role is re-read first: if it moved since the
  // proposal, nothing runs.
  const confirmProposal = async (
    turnId: string,
    proposal: AssistantProposal,
    candidate?: ProposalCandidate
  ) => {
    if (isRoleProposal(proposal) && !candidate) return;
    setAction(turnId, proposal.id, { status: "running", candidate });
    try {
      if (!isRoleProposal(proposal)) {
        const location = sharedLocations.get(congregation);
        if (
          !location &&
          (proposal.kind === "map_location" || proposal.kind === "quick_link")
        ) {
          setAction(turnId, proposal.id, {
            status: "failed",
            error: t(
              "assistant.action.needLocation",
              "Share your location again, then ask again."
            )
          });
          return;
        }
        const locations = turns.find((turn) => turn.id === turnId)?.actions?.[
          proposal.id
        ]?.locations;
        const outcome = await runRecordProposal(
          proposal,
          congregation,
          location,
          locations
        );
        setAction(turnId, proposal.id, outcome);
        if (proposal.kind === "settings" && outcome.status === "done") {
          onSettingsChange?.(parseSettings(proposal.value));
        }
        return;
      }
      const person = candidate!;
      if (proposal.kind === "role_grant") {
        const existing = await getFirstItemOfList(
          "roles",
          `user="${person.userId}" && congregation="${congregation}"`,
          { fields: "id", requestKey: `assistant-grant-check-${proposal.id}` }
        );
        if (existing) {
          setAction(turnId, proposal.id, { status: "stale" });
          return;
        }
        const created = await createData(
          "roles",
          { user: person.userId, congregation, role: proposal.to },
          { requestKey: `assistant-grant-${proposal.id}` }
        );
        trackEvent(ANALYTICS_EVENTS.USER_INVITED, { role: proposal.to });
        setAction(turnId, proposal.id, {
          status: "done",
          roleId: created.id,
          doneAt: Date.now()
        });
        return;
      }

      const current = await getFirstItemOfList(
        "roles",
        `id="${person.roleId}" && congregation="${congregation}"`,
        { fields: "id,role", requestKey: `assistant-role-check-${proposal.id}` }
      );
      if (!current || current.role !== roleChangeFor(proposal, person).from) {
        setAction(turnId, proposal.id, { status: "stale" });
        return;
      }
      if (proposal.kind === "role_revoke") {
        const deleted = await deleteDataById("roles", String(person.roleId), {
          requestKey: `assistant-revoke-${proposal.id}`
        });
        if (!deleted) {
          setAction(turnId, proposal.id, { status: "stale" });
          return;
        }
      } else {
        await updateDataById(
          "roles",
          String(person.roleId),
          { role: proposal.to },
          { requestKey: `assistant-change-${proposal.id}` }
        );
      }
      setAction(turnId, proposal.id, {
        status: "done",
        roleId: person.roleId,
        doneAt: Date.now()
      });
    } catch (error) {
      setAction(turnId, proposal.id, {
        status: "failed",
        error: actionError(error)
      });
    }
  };

  // What Undo leaves: the record kinds in assistantActions, roles here.
  const undoChange = async (
    proposal: AssistantProposal,
    state: ProposalState
  ): Promise<Partial<ProposalState>> => {
    if (!isRoleProposal(proposal)) {
      return undoRecordProposal(
        proposal,
        state,
        congregation,
        t(
          "assistant.action.changedSince",
          "It has changed again since, so it was left as it is."
        )
      );
    }
    const { candidate, roleId } = state;
    if (!candidate || !roleId) return { status: "done" };
    const requestKey = `assistant-undo-${proposal.id}`;
    if (proposal.kind === "role_grant") {
      await deleteDataById("roles", roleId, { requestKey });
      return { status: "undone" };
    }
    if (proposal.kind === "role_revoke") {
      const restored = await createData(
        "roles",
        {
          user: candidate.userId,
          congregation,
          role: roleChangeFor(proposal, candidate).from
        },
        { requestKey }
      );
      return { status: "undone", roleId: restored.id };
    }
    await updateDataById(
      "roles",
      roleId,
      { role: roleChangeFor(proposal, candidate).from },
      { requestKey }
    );
    return { status: "undone" };
  };

  // Puts things back as they were before the change.
  const undoProposal = async (
    turnId: string,
    proposal: AssistantProposal,
    state: ProposalState
  ) => {
    setAction(turnId, proposal.id, { status: "undoing" });
    try {
      const outcome = await undoChange(proposal, state);
      setAction(turnId, proposal.id, outcome);
      if (proposal.kind === "settings" && outcome.status === "undone") {
        onSettingsChange?.(parseSettings(proposal.previous));
      }
    } catch (error) {
      setAction(turnId, proposal.id, {
        status: "done",
        error: actionError(error)
      });
    }
  };

  // Asks for the device's position, keeps it for this conversation, and asks
  // the question again with it. Rejects when the admin refuses or the device
  // cannot tell, so the panel can explain.
  const shareLocation = async (turnId: string) => {
    setSharedLocation(congregation, await readPosition());
    retry(turnId);
  };

  // Reads the position again, for an admin who has moved since sharing it.
  const updateLocation = async () => {
    setSharedLocation(congregation, await readPosition());
  };

  // Stops sending the location; the conversation stays.
  const stopSharingLocation = () => setSharedLocation(congregation, undefined);

  const reset = () => {
    stop();
    sharedLocations.delete(congregation);
    setConversationId(congregation, undefined);
    update(congregation, () => NO_TURNS);
  };

  // Brings back an earlier conversation to go on with: its questions, answers,
  // lookups and cards become the turns, and new questions join it.
  const continueConversation = (past: PastConversation) => {
    stop();
    sharedLocations.delete(congregation);
    setConversationId(congregation, past.conversation.id);
    update(congregation, () =>
      past.turns.map((turn) =>
        restoredTurn(
          turn,
          past.people,
          t(
            "assistant.error.generic",
            "Something went wrong. Please try again."
          )
        )
      )
    );
  };

  // After a reload, the conversation the panel was on comes back, as it was.
  useEffect(() => {
    const stored = readStoredConversation(congregation);
    if (!stored || restoring.has(congregation)) return;
    restoring.add(congregation);
    if ((conversations.get(congregation) ?? NO_TURNS).length) return;
    openConversation(congregation, stored)
      .then((past) => {
        // Not over a conversation the admin started meanwhile.
        if (!(conversations.get(congregation) ?? NO_TURNS).length) {
          continueConversation(past);
        }
      })
      .catch((error) => {
        // Gone: deleted, aged out, or never logged.
        const current = conversationIds.get(congregation) ?? stored;
        if (
          error instanceof ClientResponseError &&
          error.status === 404 &&
          current === stored
        ) {
          setConversationId(congregation, undefined);
        }
      });
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- once per congregation
  }, [congregation]);

  const location = useSyncExternalStore(subscribe, () =>
    sharedLocations.get(congregation)
  );
  const conversationId = useSyncExternalStore(subscribe, () =>
    conversationIds.get(congregation)
  );

  return {
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
  };
}
