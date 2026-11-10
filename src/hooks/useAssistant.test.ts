import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ClientResponseError } from "pocketbase";
import type { AssistantProposal, PastTurn } from "./useAssistant";

const {
  callFunctionMock,
  captureExceptionMock,
  cancelRequestMock,
  getFirstItemOfListMock,
  getListMock,
  getOneMock,
  createDataMock,
  updateDataByIdMock,
  deleteDataByIdMock
} = vi.hoisted(() => ({
  callFunctionMock: vi.fn(),
  captureExceptionMock: vi.fn(),
  cancelRequestMock: vi.fn(),
  getFirstItemOfListMock: vi.fn(),
  getListMock: vi.fn(),
  getOneMock: vi.fn(),
  createDataMock: vi.fn(),
  updateDataByIdMock: vi.fn(),
  deleteDataByIdMock: vi.fn()
}));

vi.mock("../utils/pocketbase", () => ({
  callFunction: callFunctionMock,
  pb: {
    cancelRequest: cancelRequestMock,
    collection: () => ({ getOne: getOneMock })
  },
  getFirstItemOfList: getFirstItemOfListMock,
  getList: getListMock,
  createData: createDataMock,
  updateDataById: updateDataByIdMock,
  deleteDataById: deleteDataByIdMock,
  getUser: (field: string) => (field === "id" ? "me1" : "Bro Admin"),
  isAbortError: (error: unknown) =>
    (error as { isAbort?: boolean })?.isAbort === true
}));

vi.mock("@sentry/react", () => ({ captureException: captureExceptionMock }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
    i18n: { language: "zh-TW", resolvedLanguage: "zh" }
  })
}));

const { default: useAssistant } = await import("./useAssistant");

const answer = (overrides: Record<string, unknown> = {}) => ({
  answer: "T01 has not been completed.",
  grounded: true,
  steps: [],
  context: "T01 has not been completed.",
  people: {},
  ...overrides
});

// A question as history returns it.
const pastTurn = (overrides: Partial<PastTurn> = {}): PastTurn => ({
  id: "q1",
  question: "Who came out?",
  answer: "",
  context: "",
  asked: "2026-11-05T10:00:00Z",
  cards: [],
  steps: [],
  status: "",
  view: null,
  rating: 0,
  reason: "",
  ...overrides
});

const pbError = (status: number, message: string) =>
  new ClientResponseError({ status, response: { message } });

// Conversations outlive the hook, so each test talks to its own congregation.
let congregationCounter = 0;
const nextCongregation = () => `cong${++congregationCounter}`;

// The conversation id and unsent feedback stay in the browser between tests.
beforeEach(() => localStorage.clear());

const OUTBOX = "assistant-feedback-outbox";

type Hook = { result: { current: ReturnType<typeof useAssistant> } };

// A card of one kind, as the backend prepares it; each test adds the rest.
const proposalOf =
  (base: Partial<AssistantProposal> & Pick<AssistantProposal, "kind">) =>
  (overrides: Partial<AssistantProposal> = {}): AssistantProposal => ({
    id: "p1",
    candidates: [],
    from: "",
    to: "",
    warnings: [],
    ...base,
    ...overrides
  });

// An answer that brings the card, in a congregation of its own.
const withProposal = async (
  p: AssistantProposal,
  onSettingsChange?: Parameters<typeof useAssistant>[1]
) => {
  callFunctionMock.mockResolvedValueOnce(answer({ proposals: [p] }));
  const congregation = nextCongregation();
  const hook = renderHook(() => useAssistant(congregation, onSettingsChange));
  await act(() => hook.result.current.ask("Do it"));
  return { hook, congregation, turnId: hook.result.current.turns[0].id };
};

const action = (hook: Hook) => hook.result.current.turns.at(-1)?.actions?.p1;

const resetMocks = (...mocks: Array<{ mockReset: () => void }>) =>
  mocks.forEach((mock) => mock.mockReset());

const blk100A = { id: "m1", name: "Blk 100A" };

describe("useAssistant", () => {
  beforeEach(() => {
    callFunctionMock.mockReset();
    captureExceptionMock.mockReset();
    cancelRequestMock.mockReset();
  });

  it("asks with the congregation and resolved language, then keeps the answer", async () => {
    callFunctionMock.mockResolvedValue(answer());
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    await act(() => result.current.ask("  Which territory is overdue?  "));

    expect(callFunctionMock).toHaveBeenCalledWith(
      "/assistant/ask",
      expect.objectContaining({
        method: "POST",
        body: {
          congregation,
          question: "Which territory is overdue?",
          history: [],
          locale: "zh",
          people: {},
          conversation: expect.stringMatching(/^[a-z0-9]{15}$/)
        }
      })
    );
    expect(result.current.turns).toHaveLength(1);
    expect(result.current.turns[0].status).toBe("done");
    expect(result.current.turns[0].response?.answer).toBe(
      "T01 has not been completed."
    );
  });

  it("rates a logged answer, and the same thumb again takes it back", async () => {
    callFunctionMock.mockResolvedValue({});
    callFunctionMock.mockResolvedValueOnce(answer({ questionId: "q1" }));
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));
    await act(() => result.current.ask("Who came out?"));
    const turnId = result.current.turns[0].id;

    act(() => result.current.rate(turnId, -1));
    expect(result.current.turns[0].rating).toBe(-1);
    expect(callFunctionMock).toHaveBeenLastCalledWith("/assistant/feedback", {
      method: "POST",
      body: { question: "q1", rating: -1 },
      requestKey: `assistant-rate-${turnId}`
    });

    act(() => result.current.rate(turnId, -1));
    expect(result.current.turns[0].rating).toBeUndefined();
    await waitFor(() =>
      expect(callFunctionMock.mock.lastCall?.[1].body.rating).toBe(0)
    );
  });

  it("keeps a report that could not be sent, and sends it once back online", async () => {
    callFunctionMock
      .mockResolvedValueOnce(answer({ questionId: "q1" }))
      .mockRejectedValueOnce(pbError(0, "Failed to fetch"))
      .mockResolvedValue({});
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));
    await act(() => result.current.ask("Who came out?"));

    act(() => result.current.rate(result.current.turns[0].id, 1));
    await waitFor(() => expect(callFunctionMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(localStorage.getItem(OUTBOX) ?? "{}")).toEqual({
      [`assistant-rate-${result.current.turns[0].id}`]: {
        question: "q1",
        rating: 1
      }
    });

    window.dispatchEvent(new Event("online"));
    await waitFor(() => expect(localStorage.getItem(OUTBOX)).toBeNull());
    expect(callFunctionMock).toHaveBeenCalledTimes(3);
  });

  it("drops a report the backend refuses", async () => {
    callFunctionMock
      .mockResolvedValueOnce(answer({ questionId: "q1" }))
      .mockRejectedValueOnce(pbError(404, "Question not found"));
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));
    await act(() => result.current.ask("Who came out?"));

    act(() => result.current.rate(result.current.turns[0].id, 1));
    await waitFor(() => expect(callFunctionMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(localStorage.getItem(OUTBOX)).toBeNull());
  });

  it("says why an answer got a thumbs down, only with a thumbs down", async () => {
    callFunctionMock.mockResolvedValue({});
    callFunctionMock.mockResolvedValueOnce(answer({ questionId: "q1" }));
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));
    await act(() => result.current.ask("Who came out?"));
    const turnId = result.current.turns[0].id;

    act(() => result.current.explainRating(turnId, "wrong_figures"));
    expect(result.current.turns[0].ratingReason).toBeUndefined();

    act(() => result.current.rate(turnId, -1));
    act(() => result.current.explainRating(turnId, "wrong_figures"));
    expect(result.current.turns[0].ratingReason).toBe("wrong_figures");
    await waitFor(() =>
      expect(callFunctionMock.mock.lastCall?.[1].body).toEqual({
        question: "q1",
        rating: -1,
        reason: "wrong_figures"
      })
    );

    // A new rating replaces the reason.
    act(() => result.current.rate(turnId, 1));
    expect(result.current.turns[0].ratingReason).toBeUndefined();
  });

  it("names the conversation at the first question, and keeps it until a new one starts", async () => {
    callFunctionMock.mockResolvedValue(answer());
    const congregation = nextCongregation();
    const stored = `assistant-conversation-${congregation}`;
    const { result } = renderHook(() => useAssistant(congregation));

    await act(() => result.current.ask("Who came out?"));
    const first = callFunctionMock.mock.calls[0][1].body.conversation;
    expect(first).toMatch(/^[a-z0-9]{15}$/);
    // Kept in the browser, so a reload comes back to it.
    expect(localStorage.getItem(stored)).toBe(first);
    await act(() => result.current.ask("And yesterday?"));
    expect(callFunctionMock.mock.calls[1][1].body.conversation).toBe(first);

    act(() => result.current.reset());
    expect(localStorage.getItem(stored)).toBeNull();
    await act(() => result.current.ask("Fresh start?"));
    const next = callFunctionMock.mock.calls[2][1].body.conversation;
    expect(next).toMatch(/^[a-z0-9]{15}$/);
    expect(next).not.toBe(first);
  });

  it("follows the conversation the backend logged in when it differs", async () => {
    callFunctionMock.mockResolvedValue(answer({ conversationId: "conv1" }));
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    await act(() => result.current.ask("Who came out?"));
    await act(() => result.current.ask("And yesterday?"));
    expect(callFunctionMock.mock.calls[1][1].body.conversation).toBe("conv1");
    expect(result.current.conversationId).toBe("conv1");
  });

  it("brings back the conversation it was on after a reload, as it was", async () => {
    const congregation = nextCongregation();
    localStorage.setItem(`assistant-conversation-${congregation}`, "past1");
    const lee = { userId: "u1", roleId: "r1", name: "Bro Lee", email: "" };
    const card = (
      id: string,
      kind: AssistantProposal["kind"],
      extra = {}
    ): AssistantProposal => ({
      id,
      kind,
      candidates: [],
      from: "",
      to: "",
      warnings: [],
      ...extra
    });
    const steps = [
      {
        tool: "who_worked",
        result: { columns: ["name"], rows: [{ name: "Bro Tan" }], total: 1 }
      }
    ];
    callFunctionMock.mockResolvedValueOnce({
      conversation: { id: "past1" },
      people: { "Person QXWB": "Bro Tan" },
      turns: [
        pastTurn({
          question: "Give Blk 1 to John and Blk 2 to Eric",
          answer: "Here are the links.",
          context: "Here are the links.",
          steps,
          view: { territoryId: "t1", territoryCode: "T01" },
          rating: -1,
          reason: "wrong_figures",
          cards: [
            // The backend sends a card's link only while it still works.
            {
              proposal: card("p1", "share_link", { value: "John" }),
              outcome: "done",
              record: "link1"
            },
            {
              proposal: card("p2", "share_link", { value: "Eric" }),
              outcome: "done"
            },
            {
              proposal: card("p3", "role_change", { candidates: [lee] }),
              outcome: "undone",
              person: "Bro Lee"
            },
            {
              proposal: card("p4", "share_link", { value: "Yoong" }),
              outcome: ""
            }
          ]
        }),
        pastTurn({ id: "q2", steps, status: "stopped" }),
        pastTurn({ id: "q3", status: "failed" })
      ]
    });
    const { result } = renderHook(() => useAssistant(congregation));

    await waitFor(() => expect(result.current.turns).toHaveLength(3));
    expect(callFunctionMock.mock.calls[0][1].body).toEqual({
      congregation,
      action: "open",
      conversation: "past1"
    });
    expect(result.current.conversationId).toBe("past1");
    const [answered, stopped, failed] = result.current.turns;
    expect(answered.response).toMatchObject({
      steps,
      questionId: "q1",
      people: { "Person QXWB": "Bro Tan" }
    });
    expect(answered.response?.proposals?.map((p) => p.id)).toEqual([
      "p1",
      "p2",
      "p3",
      "p4"
    ]);
    expect(answered.view).toEqual({ territoryId: "t1", territoryCode: "T01" });
    expect(answered.rating).toBe(-1);
    expect(answered.ratingReason).toBe("wrong_figures");
    // A live link can be shared again; an ended one cannot. Nothing offers
    // Undo, and the card never acted on can still be confirmed.
    expect(answered.actions).toEqual({
      p1: { status: "done", recordId: "link1" },
      p2: { status: "done" },
      p3: { status: "undone", candidate: lee }
    });
    expect(stopped).toMatchObject({ status: "stopped", progress: steps });
    expect(failed).toMatchObject({
      status: "error",
      error: "Something went wrong. Please try again."
    });
  });

  it("forgets a stored conversation that is gone", async () => {
    const congregation = nextCongregation();
    const stored = `assistant-conversation-${congregation}`;
    localStorage.setItem(stored, "gone1");
    callFunctionMock.mockRejectedValueOnce(
      pbError(404, "Conversation not found")
    );
    const { result } = renderHook(() => useAssistant(congregation));

    await waitFor(() => expect(localStorage.getItem(stored)).toBeNull());
    expect(result.current.turns).toHaveLength(0);
  });

  it("reports the link a link card created, so history can share it", async () => {
    callFunctionMock.mockResolvedValue({});
    callFunctionMock.mockResolvedValueOnce(
      answer({
        questionId: "q1",
        proposals: [
          {
            id: "p9",
            kind: "share_link",
            candidates: [],
            from: "",
            to: "",
            warnings: [],
            value: "John"
          }
        ]
      })
    );
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));
    await act(() => result.current.ask("Give Blk 1 to John"));

    act(() =>
      result.current.setAction(result.current.turns[0].id, "p9", {
        status: "done",
        recordId: "link1",
        doneAt: Date.now()
      })
    );
    expect(callFunctionMock.mock.lastCall?.[1].body).toEqual({
      question: "q1",
      proposal: "p9",
      outcome: "done",
      record: "link1"
    });
  });

  it("goes on with an earlier conversation, sending its masked answers", async () => {
    callFunctionMock.mockResolvedValue(answer({ conversationId: "past1" }));
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    act(() =>
      result.current.continueConversation({
        conversation: { id: "past1" },
        turns: [
          pastTurn({
            answer: "Bro Tan came out.",
            context: "Person QXWB came out."
          })
        ],
        people: { "Person QXWB": "Bro Tan" }
      })
    );
    expect(result.current.turns).toHaveLength(1);
    expect(result.current.turns[0].askedAt).toBe("2026-11-05T10:00:00Z");
    expect(result.current.turns[0].response?.answer).toBe("Bro Tan came out.");

    await act(() => result.current.ask("And yesterday?"));
    expect(callFunctionMock.mock.lastCall?.[1].body).toMatchObject({
      conversation: "past1",
      history: [{ question: "Who came out?", answer: "Person QXWB came out." }],
      people: { "Person QXWB": "Bro Tan" }
    });
  });

  it("offers no rating for an answer that was not logged", async () => {
    callFunctionMock.mockResolvedValueOnce(answer());
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));
    await act(() => result.current.ask("Who came out?"));

    act(() => result.current.rate(result.current.turns[0].id, 1));
    expect(result.current.turns[0].rating).toBeUndefined();
    expect(callFunctionMock).toHaveBeenCalledTimes(1);
  });

  it("sends earlier answers as masked context with the people they mention", async () => {
    callFunctionMock.mockResolvedValueOnce(
      answer({
        answer: "Bro Tan came out today.",
        context: "Person QXWB came out today.",
        people: { "Person QXWB": "Bro Tan" }
      })
    );
    callFunctionMock.mockResolvedValueOnce(answer());
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    await act(() => result.current.ask("Who came out today?"));
    await act(() => result.current.ask("And yesterday?"));

    const body = callFunctionMock.mock.calls[1][1].body;
    expect(body.history).toEqual([
      { question: "Who came out today?", answer: "Person QXWB came out today." }
    ]);
    expect(body.people).toEqual({ "Person QXWB": "Bro Tan" });
  });

  it("leaves answers that were not grounded out of the history", async () => {
    callFunctionMock.mockResolvedValueOnce(
      answer({ grounded: false, answer: "", context: "" })
    );
    callFunctionMock.mockResolvedValueOnce(answer());
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    await act(() => result.current.ask("First?"));
    await act(() => result.current.ask("Second?"));

    expect(callFunctionMock.mock.calls[1][1].body.history).toEqual([]);
  });

  it.each([
    [
      403,
      "The assistant is not enabled for this congregation.",
      "The assistant is not turned on for your congregation."
    ],
    [
      429,
      "Your congregation has reached today's question limit.",
      "Your congregation has reached today's question limit. Try again tomorrow."
    ],
    [
      503,
      "The assistant is not configured.",
      "The assistant is not available right now."
    ]
  ])(
    "explains a %i without reporting it",
    async (status, serverMessage, shown) => {
      callFunctionMock.mockRejectedValue(pbError(status, serverMessage));
      const congregation = nextCongregation();
      const { result } = renderHook(() => useAssistant(congregation));

      await act(() => result.current.ask("Anything?"));

      expect(result.current.turns[0]).toMatchObject({
        status: "error",
        error: shown
      });
      expect(captureExceptionMock).not.toHaveBeenCalled();
    }
  );

  it("reports unexpected failures and shows a generic message", async () => {
    const failure = pbError(500, "Something failed.");
    callFunctionMock.mockRejectedValue(failure);
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    await act(() => result.current.ask("Anything?"));

    expect(result.current.turns[0].error).toBe(
      "Something went wrong. Please try again."
    );
    expect(captureExceptionMock).toHaveBeenCalledWith(failure);
  });

  it("keeps a stopped question, marked stopped, without reporting it", async () => {
    callFunctionMock.mockRejectedValue({ isAbort: true });
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    await act(() => result.current.ask("Anything?"));

    expect(result.current.turns).toHaveLength(1);
    expect(result.current.turns[0]).toMatchObject({
      question: "Anything?",
      status: "stopped"
    });
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("stops the running question by cancelling its request", async () => {
    let finish: (value: unknown) => void = () => {};
    callFunctionMock.mockImplementation(
      () => new Promise((resolve) => (finish = resolve))
    );
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    let asking: Promise<void> = Promise.resolve();
    act(() => {
      asking = result.current.ask("Slow question?");
    });
    const requestKey = callFunctionMock.mock.calls[0][1].requestKey;
    act(() => result.current.stop());

    expect(cancelRequestMock).toHaveBeenCalledWith(requestKey);
    finish(answer());
    await act(() => asking);
  });

  it("sends what is open by id, and asks about the same on retry", async () => {
    const view = {
      territoryId: "t1",
      territoryCode: "M01",
      territoryName: "Marsiling Road",
      mapId: "m187",
      mapName: "187A Marsiling Road"
    };
    callFunctionMock.mockRejectedValueOnce(pbError(500, "Something failed."));
    callFunctionMock.mockResolvedValueOnce(answer());
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    await act(() => result.current.ask("How is this territory doing?", view));
    expect(callFunctionMock.mock.calls[0][1].body.view).toEqual({
      territory: "t1",
      map: "m187"
    });
    expect(result.current.turns[0].view).toEqual(view);

    await act(async () => result.current.retry(result.current.turns[0].id));
    await waitFor(() => expect(result.current.turns[0]?.status).toBe("done"));
    expect(callFunctionMock.mock.calls[1][1].body.view).toEqual({
      territory: "t1",
      map: "m187"
    });

    // Without a view, nothing is sent.
    callFunctionMock.mockResolvedValueOnce(answer());
    await act(() => result.current.ask("And overall?"));
    expect(callFunctionMock.mock.calls[2][1].body.view).toBeUndefined();
  });

  it("retries a failed question as a fresh turn", async () => {
    callFunctionMock.mockRejectedValueOnce(pbError(500, "Something failed."));
    callFunctionMock.mockResolvedValueOnce(answer());
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    await act(() => result.current.ask("Which territory is overdue?"));
    const failed = result.current.turns[0];
    expect(failed.status).toBe("error");

    await act(async () => result.current.retry(failed.id));
    await waitFor(() => expect(result.current.turns[0]?.status).toBe("done"));
    expect(result.current.turns).toHaveLength(1);
    expect(result.current.turns[0].id).not.toBe(failed.id);
    expect(callFunctionMock.mock.calls[1][1].body.question).toBe(
      "Which territory is overdue?"
    );
  });

  it("ignores blank questions and clears on reset", async () => {
    callFunctionMock.mockResolvedValue(answer());
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    await act(() => result.current.ask("   "));
    expect(callFunctionMock).not.toHaveBeenCalled();

    await act(() => result.current.ask("Real question?"));
    act(() => result.current.reset());
    expect(result.current.turns).toEqual([]);
  });

  it("keeps the conversation when the panel closes and reopens", async () => {
    callFunctionMock.mockResolvedValue(answer());
    const congregation = nextCongregation();
    const first = renderHook(() => useAssistant(congregation));
    await act(() => first.result.current.ask("Which territory is overdue?"));
    first.unmount();

    const reopened = renderHook(() => useAssistant(congregation));
    expect(reopened.result.current.turns).toHaveLength(1);
    expect(reopened.result.current.turns[0].response?.answer).toBe(
      "T01 has not been completed."
    );
    const other = nextCongregation();
    expect(renderHook(() => useAssistant(other)).result.current.turns).toEqual(
      []
    );
  });

  it("shows each streamed check before the answer arrives", async () => {
    const step = {
      tool: "territory_overview",
      result: { columns: [], rows: [], total: 3 }
    };
    let releaseAnswer = () => {};
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "step", step }) + "\n")
        );
        releaseAnswer = () => {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "done", response: answer() }) + "\n"
            )
          );
          controller.close();
        };
      }
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(stream, {
            headers: { "Content-Type": "application/x-ndjson" }
          })
      )
    );
    // Stand in for pb.send: call the hook's fetch, then parse what it returns.
    callFunctionMock.mockImplementation(async (_path, options) => {
      const response = await options.fetch("/assistant/ask", {});
      return response.json();
    });
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    let asking: Promise<void> = Promise.resolve();
    act(() => {
      asking = result.current.ask("Which territory is overdue?");
    });
    await waitFor(() =>
      expect(result.current.turns[0].progress).toHaveLength(1)
    );
    expect(result.current.turns[0].status).toBe("pending");
    expect(result.current.turns[0].progress[0].tool).toBe("territory_overview");

    releaseAnswer();
    await act(() => asking);
    expect(result.current.turns[0].status).toBe("done");
    expect(result.current.turns[0].response?.answer).toBe(
      "T01 has not been completed."
    );
    vi.unstubAllGlobals();
  });

  it("writes the answer as it streams, withdraws it on reset, and lets the response replace it", async () => {
    let push = (_event: unknown) => {};
    let close = () => {};
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        push = (event) =>
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        close = () => controller.close();
      }
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(stream, {
            headers: { "Content-Type": "application/x-ndjson" }
          })
      )
    );
    callFunctionMock.mockImplementation(async (_path, options) => {
      const response = await options.fetch("/assistant/ask", {});
      return response.json();
    });
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    let asking: Promise<void> = Promise.resolve();
    act(() => {
      asking = result.current.ask("Which territory is overdue?");
    });
    push({ type: "delta", text: "T01 has " });
    push({ type: "delta", text: "taken 9" });
    await waitFor(() =>
      expect(result.current.turns[0].draft).toBe("T01 has taken 9")
    );
    push({ type: "reset" });
    await waitFor(() => expect(result.current.turns[0].draft).toBeUndefined());
    push({ type: "delta", text: "T01 has not " });
    await waitFor(() =>
      expect(result.current.turns[0].draft).toBe("T01 has not ")
    );
    expect(result.current.turns[0].status).toBe("pending");

    push({ type: "done", response: answer() });
    close();
    await act(() => asking);
    expect(result.current.turns[0]).toMatchObject({
      status: "done",
      draft: undefined,
      response: { answer: "T01 has not been completed." }
    });
    vi.unstubAllGlobals();
  });

  it("turns an error event in the stream into a failed answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              type: "error",
              message: "The assistant could not answer."
            }) + "\n",
            {
              headers: { "Content-Type": "application/x-ndjson" }
            }
          )
      )
    );
    callFunctionMock.mockImplementation(async (_path, options) => {
      const response = await options.fetch("/assistant/ask", {});
      if (!response.ok)
        throw pbError(response.status, (await response.json()).message);
      return response.json();
    });
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    await act(() => result.current.ask("Anything?"));

    expect(result.current.turns[0]).toMatchObject({
      status: "error",
      error: "Something went wrong. Please try again."
    });
    vi.unstubAllGlobals();
  });
});

describe("useAssistant location sharing", () => {
  const setPosition = (lat: number, lng: number) =>
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (ok: (p: unknown) => void) =>
          ok({ coords: { latitude: lat, longitude: lng } })
      }
    });

  beforeEach(() => {
    callFunctionMock.mockReset();
  });

  it("re-asks with the shared location, keeps it, and forgets it on reset", async () => {
    setPosition(1.44, 103.77);
    callFunctionMock.mockResolvedValueOnce(answer({ needsLocation: true }));
    callFunctionMock.mockResolvedValue(answer());
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));

    await act(() => result.current.ask("What is near me?"));
    expect(callFunctionMock.mock.calls[0][1].body.location).toBeUndefined();

    await act(() => result.current.shareLocation(result.current.turns[0].id));
    await waitFor(() => expect(callFunctionMock).toHaveBeenCalledTimes(2));
    expect(callFunctionMock.mock.calls[1][1].body).toMatchObject({
      question: "What is near me?",
      location: { lat: 1.44, lng: 103.77 }
    });

    await act(() => result.current.ask("And free ones?"));
    expect(callFunctionMock.mock.calls[2][1].body.location).toEqual({
      lat: 1.44,
      lng: 103.77
    });

    act(() => result.current.reset());
    await act(() => result.current.ask("Near me again?"));
    expect(callFunctionMock.mock.calls[3][1].body.location).toBeUndefined();
  });

  it("shows the shared location, updates it, and stops sharing it", async () => {
    setPosition(1.44, 103.77);
    callFunctionMock.mockResolvedValueOnce(answer({ needsLocation: true }));
    callFunctionMock.mockResolvedValue(answer());
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));
    await act(() => result.current.ask("What is near me?"));
    expect(result.current.location).toBeUndefined();

    await act(() => result.current.shareLocation(result.current.turns[0].id));
    expect(result.current.location).toEqual({ lat: 1.44, lng: 103.77 });

    setPosition(1.45, 103.78);
    await act(() => result.current.updateLocation());
    expect(result.current.location).toEqual({ lat: 1.45, lng: 103.78 });

    act(() => result.current.stopSharingLocation());
    expect(result.current.location).toBeUndefined();
    expect(result.current.turns).toHaveLength(1);
    await act(() => result.current.ask("And free ones?"));
    expect(callFunctionMock.mock.lastCall?.[1].body.location).toBeUndefined();
  });

  it("rejects when the device cannot share its location", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (_ok: unknown, fail: (e: unknown) => void) =>
          fail({ code: 1 })
      }
    });
    callFunctionMock.mockResolvedValue(answer({ needsLocation: true }));
    const congregation = nextCongregation();
    const { result } = renderHook(() => useAssistant(congregation));
    await act(() => result.current.ask("What is near me?"));

    await expect(
      result.current.shareLocation(result.current.turns[0].id)
    ).rejects.toBeDefined();
    expect(callFunctionMock).toHaveBeenCalledTimes(1);
  });
});

describe("useAssistant proposals", () => {
  const lee = {
    userId: "u1",
    roleId: "r1",
    name: "Bro Lee",
    email: "lee@example.com"
  };
  const proposal = proposalOf({
    kind: "role_change",
    candidates: [lee],
    from: "conductor",
    to: "read_only"
  });

  beforeEach(() => {
    vi.clearAllMocks();
    callFunctionMock.mockReset();
  });

  it("changes a role through the existing call and undoes it", async () => {
    const p = proposal();
    const { hook, congregation, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValue({ id: "r1", role: "conductor" });

    await act(() => hook.result.current.confirmProposal(turnId, p, lee));
    expect(getFirstItemOfListMock).toHaveBeenCalledWith(
      "roles",
      `id="r1" && congregation="${congregation}"`,
      expect.anything()
    );
    expect(updateDataByIdMock).toHaveBeenCalledWith(
      "roles",
      "r1",
      { role: "read_only" },
      expect.anything()
    );
    const done = hook.result.current.turns[0].actions?.p1;
    expect(done?.status).toBe("done");

    await act(() => hook.result.current.undoProposal(turnId, p, done!));
    expect(updateDataByIdMock).toHaveBeenLastCalledWith(
      "roles",
      "r1",
      { role: "conductor" },
      expect.anything()
    );
    expect(hook.result.current.turns[0].actions?.p1.status).toBe("undone");
  });

  it("removes access and restores it on undo", async () => {
    const p = proposal({ kind: "role_revoke", to: "" });
    const { hook, congregation, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValue({ id: "r1", role: "conductor" });
    deleteDataByIdMock.mockResolvedValue(true);
    createDataMock.mockResolvedValue({ id: "r9" });

    await act(() => hook.result.current.confirmProposal(turnId, p, lee));
    expect(deleteDataByIdMock).toHaveBeenCalledWith(
      "roles",
      "r1",
      expect.anything()
    );
    const done = hook.result.current.turns[0].actions?.p1;

    await act(() => hook.result.current.undoProposal(turnId, p, done!));
    expect(createDataMock).toHaveBeenCalledWith(
      "roles",
      { user: "u1", congregation, role: "conductor" },
      expect.anything()
    );
    expect(hook.result.current.turns[0].actions?.p1).toMatchObject({
      status: "undone",
      roleId: "r9"
    });
  });

  it("grants access to a new person and removes the role on undo", async () => {
    const tan = { userId: "u2", name: "Sis Tan", email: "tan@example.com" };
    const p = proposal({
      kind: "role_grant",
      from: "",
      to: "conductor",
      candidates: [tan]
    });
    const { hook, congregation, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValue(null);
    createDataMock.mockResolvedValue({ id: "r5" });

    await act(() => hook.result.current.confirmProposal(turnId, p, tan));
    expect(createDataMock).toHaveBeenCalledWith(
      "roles",
      { user: "u2", congregation, role: "conductor" },
      expect.anything()
    );
    const done = hook.result.current.turns[0].actions?.p1;
    expect(done).toMatchObject({ status: "done", roleId: "r5" });

    await act(() => hook.result.current.undoProposal(turnId, p, done!));
    expect(deleteDataByIdMock).toHaveBeenCalledWith(
      "roles",
      "r5",
      expect.anything()
    );
  });

  it("records what became of a card on the logged question", async () => {
    const p = proposal();
    callFunctionMock.mockResolvedValue({});
    callFunctionMock.mockResolvedValueOnce(
      answer({ proposals: [p], questionId: "q1" })
    );
    const congregation = nextCongregation();
    const hook = renderHook(() => useAssistant(congregation));
    await act(() => hook.result.current.ask("Change Bro Lee"));
    const turnId = hook.result.current.turns[0].id;
    getFirstItemOfListMock.mockResolvedValue({ id: "r1", role: "conductor" });

    await act(() => hook.result.current.confirmProposal(turnId, p, lee));
    expect(callFunctionMock).toHaveBeenLastCalledWith("/assistant/feedback", {
      method: "POST",
      // Per card, with whom the role change applied to, for history.
      body: {
        question: "q1",
        proposal: "p1",
        outcome: "done",
        person: "u1"
      },
      requestKey: "assistant-outcome-p1"
    });

    await act(() =>
      hook.result.current.undoProposal(
        turnId,
        p,
        hook.result.current.turns[0].actions!.p1
      )
    );
    expect(callFunctionMock.mock.lastCall?.[1].body.outcome).toBe("undone");
  });

  it("changes nothing when the role moved since the proposal", async () => {
    const p = proposal();
    const { hook, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValue({
      id: "r1",
      role: "administrator"
    });

    await act(() => hook.result.current.confirmProposal(turnId, p, lee));
    expect(updateDataByIdMock).not.toHaveBeenCalled();
    expect(hook.result.current.turns[0].actions?.p1.status).toBe("stale");
  });

  it("checks and undoes against the picked person's own role when names match", async () => {
    const other = {
      userId: "u3",
      roleId: "r3",
      name: "Bro Lee",
      email: "lee2@example.com",
      role: "administrator"
    };
    const p = proposal({
      from: "",
      candidates: [{ ...lee, role: "conductor" }, other]
    });
    const { hook, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValue({
      id: "r3",
      role: "administrator"
    });

    await act(() => hook.result.current.confirmProposal(turnId, p, other));
    expect(updateDataByIdMock).toHaveBeenCalledWith(
      "roles",
      "r3",
      { role: "read_only" },
      expect.anything()
    );
    const done = hook.result.current.turns[0].actions?.p1;
    expect(done?.status).toBe("done");

    await act(() => hook.result.current.undoProposal(turnId, p, done!));
    expect(updateDataByIdMock).toHaveBeenLastCalledWith(
      "roles",
      "r3",
      { role: "administrator" },
      expect.anything()
    );
  });

  it("shows the backend's refusal and tells the model it failed", async () => {
    const p = proposal();
    const { hook, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValue({ id: "r1", role: "conductor" });
    updateDataByIdMock.mockRejectedValue(
      pbError(400, "A congregation must keep at least one administrator.")
    );

    await act(() => hook.result.current.confirmProposal(turnId, p, lee));
    expect(hook.result.current.turns[0].actions?.p1).toMatchObject({
      status: "failed",
      error: "A congregation must keep at least one administrator."
    });

    callFunctionMock.mockResolvedValueOnce(answer());
    await act(() => hook.result.current.ask("What happened?"));
    expect(
      callFunctionMock.mock.calls.at(-1)?.[1].body.history[0].answer
    ).toContain("The change failed and was not made.");
  });
});

describe("useAssistant record proposals", () => {
  const map = blk100A;
  const proposal = proposalOf({
    kind: "map_rename",
    from: "Blk 100A",
    to: "Blk 100 North",
    target: map,
    value: "Blk 100 North",
    previous: "Blk 100A"
  });

  beforeEach(() =>
    resetMocks(
      callFunctionMock,
      getFirstItemOfListMock,
      createDataMock,
      updateDataByIdMock,
      deleteDataByIdMock
    )
  );

  it("renames a map after checking its name, and undoes it", async () => {
    const p = proposal();
    const { hook, congregation, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValueOnce({
      id: "m1",
      description: "Blk 100A"
    });

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(getFirstItemOfListMock).toHaveBeenCalledWith(
      "maps",
      `id="m1" && congregation="${congregation}"`,
      expect.anything()
    );
    expect(updateDataByIdMock).toHaveBeenCalledWith(
      "maps",
      "m1",
      { description: "Blk 100 North" },
      expect.anything()
    );
    const done = hook.result.current.turns[0].actions?.p1;
    expect(done?.status).toBe("done");

    getFirstItemOfListMock.mockResolvedValueOnce({
      id: "m1",
      description: "Blk 100 North"
    });
    await act(() => hook.result.current.undoProposal(turnId, p, done!));
    expect(updateDataByIdMock).toHaveBeenLastCalledWith(
      "maps",
      "m1",
      { description: "Blk 100A" },
      expect.anything()
    );
    expect(hook.result.current.turns[0].actions?.p1.status).toBe("undone");
  });

  it("leaves a name renamed again by someone else when undoing", async () => {
    const p = proposal({
      kind: "territory_rename",
      target: { ...map, id: "t1", name: "T01" }
    });
    const { hook, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValueOnce({
      id: "t1",
      description: "Blk 100A"
    });
    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(updateDataByIdMock).toHaveBeenCalledWith(
      "territories",
      "t1",
      { description: "Blk 100 North" },
      expect.anything()
    );
    const done = hook.result.current.turns[0].actions?.p1;

    getFirstItemOfListMock.mockResolvedValueOnce({
      id: "t1",
      description: "Someone else's name"
    });
    await act(() => hook.result.current.undoProposal(turnId, p, done!));
    expect(updateDataByIdMock).toHaveBeenCalledTimes(1);
    expect(hook.result.current.turns[0].actions?.p1.status).toBe("done");
    expect(hook.result.current.turns[0].actions?.p1.error).toBeTruthy();
  });

  it("changes nothing when the name moved since the proposal", async () => {
    const p = proposal();
    const { hook, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValueOnce({
      id: "m1",
      description: "Blk 100 South"
    });
    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(updateDataByIdMock).not.toHaveBeenCalled();
    expect(hook.result.current.turns[0].actions?.p1.status).toBe("stale");
  });

  it("creates a share link under the admin and deletes it on undo", async () => {
    const p = proposal({
      kind: "share_link",
      from: "",
      to: "",
      value: "Sis Ong",
      previous: undefined,
      linkType: "personal",
      hours: 48
    });
    const { hook, congregation, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValueOnce({ id: "m1" });
    createDataMock.mockResolvedValueOnce({ id: "link1" });

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(createDataMock).toHaveBeenCalledWith(
      "assignments",
      expect.objectContaining({
        map: "m1",
        user: "me1",
        type: "personal",
        publisher: "Sis Ong",
        congregation
      }),
      expect.anything()
    );
    const done = hook.result.current.turns[0].actions?.p1;
    expect(done).toMatchObject({ status: "done", recordId: "link1" });

    await act(() => hook.result.current.undoProposal(turnId, p, done!));
    expect(deleteDataByIdMock).toHaveBeenCalledWith(
      "assignments",
      "link1",
      expect.anything()
    );
  });

  it("posts a pinned instruction as an administrator message", async () => {
    const p = proposal({
      kind: "pin_message",
      from: "",
      to: "",
      value: "Knock softly",
      previous: undefined
    });
    const { hook, congregation, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValueOnce({ id: "m1" });
    createDataMock.mockResolvedValueOnce({ id: "msg1" });

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(createDataMock).toHaveBeenCalledWith(
      "messages",
      {
        map: "m1",
        message: "Knock softly",
        read: true,
        pinned: true,
        created_by: "Bro Admin",
        type: "administrator",
        congregation
      },
      expect.anything()
    );
    expect(hook.result.current.turns[0].actions?.p1.recordId).toBe("msg1");
  });

  it("emails the report through the existing route", async () => {
    const p = proposal({
      kind: "report_email",
      from: "",
      to: "",
      target: undefined,
      value: undefined,
      previous: undefined
    });
    const { hook, congregation, turnId } = await withProposal(p);
    callFunctionMock.mockResolvedValueOnce({});

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(callFunctionMock).toHaveBeenLastCalledWith("/report/generate", {
      method: "POST",
      requestKey: `report-generate-${congregation}`,
      body: { congregation }
    });
    expect(hook.result.current.turns[0].actions?.p1.status).toBe("done");
  });
});

describe("useAssistant assisting actions", () => {
  const map = blk100A;
  const proposal = proposalOf({ kind: "mark_read" });

  beforeEach(() =>
    resetMocks(
      callFunctionMock,
      getFirstItemOfListMock,
      getListMock,
      createDataMock,
      updateDataByIdMock,
      deleteDataByIdMock
    )
  );

  it("marks only the messages still unread, and marks them unread on undo", async () => {
    const p = proposal({
      items: [
        { id: "a", map: "m1", label: "Blk 100A" },
        { id: "b", map: "m1", label: "Blk 100A" },
        { id: "c", map: "m2", label: "Blk 200A" }
      ]
    });
    const { hook, turnId } = await withProposal(p);
    getListMock
      .mockResolvedValueOnce([{ id: "a" }])
      .mockResolvedValueOnce([{ id: "c" }]);

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(getListMock).toHaveBeenCalledWith(
      "messages",
      expect.objectContaining({
        filter: 'map="m1" && read=false && type!="administrator"',
        fields: "id"
      })
    );
    expect(updateDataByIdMock.mock.calls.map((c) => [c[1], c[2]])).toEqual([
      ["a", { read: true }],
      ["c", { read: true }]
    ]);
    const done = action(hook);
    expect(done).toMatchObject({ status: "done", recordIds: ["a", "c"] });

    await act(() => hook.result.current.undoProposal(turnId, p, done!));
    expect(updateDataByIdMock).toHaveBeenLastCalledWith(
      "messages",
      "c",
      { read: false },
      expect.anything()
    );
  });

  it("unpins instructions and pins them again on undo", async () => {
    const p = proposal({
      kind: "unpin_message",
      target: map,
      items: [{ id: "a", map: "m1", label: "Skip floor 3" }]
    });
    const { hook, turnId } = await withProposal(p);
    getListMock.mockResolvedValueOnce([{ id: "a" }]);

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(updateDataByIdMock).toHaveBeenCalledWith(
      "messages",
      "a",
      { pinned: false },
      expect.anything()
    );
    await act(() => hook.result.current.undoProposal(turnId, p, action(hook)!));
    expect(updateDataByIdMock).toHaveBeenLastCalledWith(
      "messages",
      "a",
      { pinned: true },
      expect.anything()
    );
  });

  it("deletes the listed links and offers nothing to undo", async () => {
    const p = proposal({
      kind: "link_revoke",
      target: map,
      warnings: ["stops_now"],
      items: [{ id: "l1", map: "m1", label: "Bro Tan" }]
    });
    const { hook, turnId } = await withProposal(p);
    deleteDataByIdMock.mockResolvedValueOnce(true);

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(deleteDataByIdMock).toHaveBeenCalledWith(
      "assignments",
      "l1",
      expect.anything()
    );
    expect(action(hook)).toMatchObject({ status: "done", recordIds: ["l1"] });
  });

  it("needs the shared location to set a map's location", async () => {
    const p = proposal({ kind: "map_location", target: map, previous: "" });
    const { hook, turnId } = await withProposal(p);

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(updateDataByIdMock).not.toHaveBeenCalled();
    expect(action(hook)?.status).toBe("failed");
  });

  it("gives a quick link from the shared location", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (ok: (p: unknown) => void) =>
          ok({ coords: { latitude: 1.3, longitude: 103.8 } })
      }
    });
    const p = proposal({
      kind: "quick_link",
      target: { ...map, id: "t1", name: "T01" },
      value: "Sis Ong"
    });
    callFunctionMock.mockResolvedValueOnce(answer({ needsLocation: true }));
    callFunctionMock.mockResolvedValueOnce(answer({ proposals: [p] }));
    const congregation = nextCongregation();
    const hook = renderHook(() => useAssistant(congregation));
    await act(() => hook.result.current.ask("Quick link near me for Sis Ong"));
    await act(() =>
      hook.result.current.shareLocation(hook.result.current.turns[0].id)
    );
    await waitFor(() => expect(callFunctionMock).toHaveBeenCalledTimes(2));
    const turnId = hook.result.current.turns.at(-1)!.id;

    callFunctionMock.mockResolvedValueOnce({
      linkId: "q1",
      mapName: "Blk 412"
    });
    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(callFunctionMock).toHaveBeenLastCalledWith("/territory/link", {
      method: "POST",
      requestKey: expect.any(String),
      body: {
        territory: "t1",
        publisher: "Sis Ong",
        coordinates: { lat: 1.3, lng: 103.8 }
      }
    });
    expect(action(hook)).toMatchObject({
      status: "done",
      recordId: "q1",
      label: "Blk 412"
    });
  });

  it("updates a home with all its fields, and restores them on undo", async () => {
    const before = {
      status: "not_home",
      notes: "",
      not_home_tries: 2,
      dnc_time: "",
      types: ["o1"],
      type_names: ["Chinese"]
    };
    const after = {
      ...before,
      status: "done",
      notes: "Dog",
      types: ["o2"],
      type_names: ["Malay"]
    };
    const p = proposal({
      kind: "home_update",
      target: map,
      items: [{ id: "h1", map: "m1", label: "#05-12" }],
      previous: JSON.stringify(before),
      value: JSON.stringify(after)
    });
    const { hook, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValueOnce({
      id: "h1",
      status: "not_home",
      notes: "",
      not_home_tries: 2,
      dnc_time: "",
      coordinates: { lat: 1, lng: 2 }
    });
    getListMock.mockResolvedValueOnce([{ id: "ao1", option: "o1" }]);
    callFunctionMock.mockResolvedValueOnce(undefined);

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(callFunctionMock).toHaveBeenLastCalledWith(
      "/address/update",
      expect.objectContaining({
        body: {
          address_id: "h1",
          map_id: "m1",
          notes: "Dog",
          status: "done",
          not_home_tries: 2,
          dnc_time: "",
          coordinates: { lat: 1, lng: 2 },
          delete_ao_ids: ["ao1"],
          add_option_ids: ["o2"]
        }
      })
    );
    expect(action(hook)?.status).toBe("done");

    getFirstItemOfListMock.mockResolvedValueOnce({
      id: "h1",
      status: "done",
      notes: "Dog",
      not_home_tries: 2,
      dnc_time: "",
      coordinates: { lat: 1, lng: 2 }
    });
    getListMock.mockResolvedValueOnce([{ id: "ao2", option: "o2" }]);
    callFunctionMock.mockResolvedValueOnce(undefined);
    await act(() => hook.result.current.undoProposal(turnId, p, action(hook)!));
    expect(callFunctionMock.mock.calls.at(-1)?.[1].body).toMatchObject({
      status: "not_home",
      notes: "",
      delete_ao_ids: ["ao2"],
      add_option_ids: ["o1"]
    });
    expect(action(hook)?.status).toBe("undone");
  });

  it("leaves a home that changed since the proposal", async () => {
    const state = {
      status: "not_done",
      notes: "",
      not_home_tries: 0,
      dnc_time: "",
      types: [],
      type_names: []
    };
    const p = proposal({
      kind: "home_update",
      target: map,
      items: [{ id: "h1", map: "m1", label: "12" }],
      previous: JSON.stringify(state),
      value: JSON.stringify({ ...state, status: "done" })
    });
    const { hook, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValueOnce({
      id: "h1",
      status: "not_home",
      notes: "",
      not_home_tries: 1,
      dnc_time: ""
    });
    getListMock.mockResolvedValueOnce([]);

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(callFunctionMock).toHaveBeenCalledTimes(1); // only the question
    expect(action(hook)?.status).toBe("stale");
  });
});

describe("useAssistant structural actions", () => {
  const map = { id: "m1", name: "Blk 412" };
  const proposal = proposalOf({ kind: "map_reset", target: map });
  const lastCall = () => callFunctionMock.mock.calls.at(-1);

  beforeEach(() =>
    resetMocks(
      callFunctionMock,
      getFirstItemOfListMock,
      getListMock,
      getOneMock,
      updateDataByIdMock
    )
  );

  it("resets a map and a territory through their routes", async () => {
    const p = proposal({});
    const { hook, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValueOnce({ id: "m1" });
    callFunctionMock.mockResolvedValueOnce("ok");
    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(lastCall()?.[0]).toBe("/map/reset");
    expect(lastCall()?.[1].body).toEqual({ map: "m1" });

    const t = proposal({
      kind: "territory_reset",
      target: { ...map, id: "t1", name: "T01" }
    });
    const territory = await withProposal(t);
    callFunctionMock.mockResolvedValueOnce("ok");
    await act(() =>
      territory.hook.result.current.confirmProposal(territory.turnId, t)
    );
    expect(lastCall()?.[0]).toBe("/territory/reset");
    expect(lastCall()?.[1].body).toEqual({ territory: "t1" });
    expect(action(territory.hook)?.status).toBe("done");
  });

  it("resets homes that still hold their state, counts the rest, and undoes", async () => {
    const state = (tries: number) =>
      JSON.stringify({
        status: "not_home",
        notes: "",
        not_home_tries: tries,
        dnc_time: "",
        types: [],
        type_names: []
      });
    const p = proposal({
      kind: "tries_reset",
      target: undefined,
      value: '{"status":"not_done","not_home_tries":0}',
      items: [
        { id: "h1", map: "m1", label: "Blk 412 12", detail: state(3) },
        { id: "h2", map: "m1", label: "Blk 412 13", detail: state(3) }
      ]
    });
    const { hook, turnId } = await withProposal(p);
    getFirstItemOfListMock
      .mockResolvedValueOnce({
        id: "h1",
        status: "not_home",
        notes: "",
        not_home_tries: 3,
        dnc_time: ""
      })
      .mockResolvedValueOnce({
        id: "h2",
        status: "done",
        notes: "",
        not_home_tries: 3,
        dnc_time: ""
      });
    getListMock.mockResolvedValue([]);
    callFunctionMock.mockResolvedValueOnce(undefined);

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(lastCall()?.[1].body).toMatchObject({
      address_id: "h1",
      status: "not_done",
      not_home_tries: 0
    });
    expect(action(hook)).toMatchObject({
      status: "done",
      recordIds: ["h1"],
      skipped: 1
    });

    getFirstItemOfListMock.mockResolvedValueOnce({
      id: "h1",
      status: "not_done",
      notes: "",
      not_home_tries: 0,
      dnc_time: ""
    });
    callFunctionMock.mockResolvedValueOnce(undefined);
    await act(() => hook.result.current.undoProposal(turnId, p, action(hook)!));
    expect(lastCall()?.[1].body).toMatchObject({
      address_id: "h1",
      status: "not_home",
      not_home_tries: 3
    });
    expect(action(hook)?.status).toBe("undone");
  });

  it("changes the settings after checking them, and restores them", async () => {
    const before = { max_tries: 3, expiry_hours: 24, completion_threshold: 90 };
    const after = { ...before, max_tries: 2 };
    const p = proposal({
      kind: "settings",
      target: undefined,
      previous: JSON.stringify(before),
      value: JSON.stringify(after)
    });
    const onSettingsChange = vi.fn();
    const { hook, congregation, turnId } = await withProposal(
      p,
      onSettingsChange
    );
    getOneMock.mockResolvedValueOnce({ id: congregation, ...before });

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(updateDataByIdMock).toHaveBeenCalledWith(
      "congregations",
      congregation,
      after,
      expect.anything()
    );
    // The page takes the new settings without a reload.
    expect(onSettingsChange).toHaveBeenLastCalledWith(after);

    getOneMock.mockResolvedValueOnce({ id: congregation, ...after });
    await act(() => hook.result.current.undoProposal(turnId, p, action(hook)!));
    expect(updateDataByIdMock).toHaveBeenLastCalledWith(
      "congregations",
      congregation,
      before,
      expect.anything()
    );
    expect(onSettingsChange).toHaveBeenLastCalledWith(before);
  });

  it("leaves the page's settings alone when they changed meanwhile", async () => {
    const before = { max_tries: 3, expiry_hours: 24, completion_threshold: 90 };
    const p = proposal({
      kind: "settings",
      target: undefined,
      previous: JSON.stringify(before),
      value: JSON.stringify({ ...before, max_tries: 2 })
    });
    const onSettingsChange = vi.fn();
    const { hook, congregation, turnId } = await withProposal(
      p,
      onSettingsChange
    );
    getOneMock.mockResolvedValueOnce({
      id: congregation,
      ...before,
      max_tries: 4
    });
    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(action(hook)?.status).toBe("stale");
    expect(onSettingsChange).not.toHaveBeenCalled();
  });

  it("moves a map and moves it back", async () => {
    const p = proposal({
      kind: "map_move",
      from: "T01",
      to: "T02",
      previous: "t1",
      value: "t2"
    });
    const { hook, turnId } = await withProposal(p);
    getFirstItemOfListMock.mockResolvedValueOnce({ id: "m1", territory: "t1" });
    callFunctionMock.mockResolvedValueOnce(undefined);
    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(lastCall()?.[0]).toBe("/map/territory/update");
    expect(lastCall()?.[1].body).toEqual({
      map: "m1",
      new_territory: "t2",
      old_territory: "t1"
    });

    getFirstItemOfListMock.mockResolvedValueOnce({ id: "m1", territory: "t2" });
    callFunctionMock.mockResolvedValueOnce(undefined);
    await act(() => hook.result.current.undoProposal(turnId, p, action(hook)!));
    expect(lastCall()?.[1].body).toEqual({
      map: "m1",
      new_territory: "t1",
      old_territory: "t2"
    });
  });

  it("adds a floor, and removes it on undo only while nobody has used it", async () => {
    const p = proposal({
      kind: "floor_add",
      to: "top",
      data: { floor: 6, units: ["01", "02"] }
    });
    const { hook, turnId } = await withProposal(p);
    getListMock.mockResolvedValueOnce([]);
    callFunctionMock.mockResolvedValueOnce(undefined);
    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(lastCall()?.[0]).toBe("/map/floor/add");
    expect(lastCall()?.[1].body).toEqual({ map: "m1", add_higher: true });
    const done = action(hook)!;

    getListMock.mockResolvedValueOnce([{ id: "a", status: "done", notes: "" }]);
    await act(() => hook.result.current.undoProposal(turnId, p, done));
    expect(lastCall()?.[0]).toBe("/map/floor/add");
    expect(action(hook)).toMatchObject({ status: "done" });
    expect(action(hook)?.error).toBeTruthy();

    getListMock.mockResolvedValueOnce([
      { id: "a", status: "not_done", notes: "" }
    ]);
    callFunctionMock.mockResolvedValueOnce(undefined);
    await act(() => hook.result.current.undoProposal(turnId, p, done));
    expect(lastCall()?.[0]).toBe("/map/floor/remove");
    expect(lastCall()?.[1].body).toEqual({ map: "m1", floor: 6 });
  });

  it("adds units and deletes each on undo", async () => {
    const p = proposal({
      kind: "unit_add",
      data: { units: ["15", "16"], existing: [], floors: 3 }
    });
    const { hook, turnId } = await withProposal(p);
    callFunctionMock.mockResolvedValueOnce(undefined);
    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(lastCall()?.[1].body).toEqual({ map: "m1", codes: ["15", "16"] });

    getListMock.mockResolvedValueOnce([
      { id: "a", code: "15", status: "not_done", notes: "" }
    ]);
    callFunctionMock.mockResolvedValue(undefined);
    await act(() => hook.result.current.undoProposal(turnId, p, action(hook)!));
    expect(
      callFunctionMock.mock.calls
        .filter((c) => c[0] === "/map/code/delete")
        .map((c) => c[1].body.code)
    ).toEqual(["15", "16"]);
  });
});

describe("useAssistant creating territories and maps", () => {
  const plan = (name: string) => ({
    name,
    type: "multi",
    lowest_floor: 2,
    top_floor: 13,
    floors: 12,
    homes: 24,
    units: ["671", "673"],
    address: name
  });
  const proposal = proposalOf({
    kind: "territory_create",
    target: { id: "", name: "T05" },
    value: "Bedok North",
    data: { maps: [plan("Blk 412"), plan("Blk 413")], homes: 48 }
  });
  // The card with each new map placed, as the admin does before confirming.
  const withPlaces = async (p: AssistantProposal) => {
    const { hook, congregation, turnId } = await withProposal(p);
    act(() =>
      hook.result.current.setAction(turnId, "p1", {
        locations: {
          "0": { lat: 1.3, lng: 103.9 },
          "1": { lat: 1.31, lng: 103.91 }
        }
      })
    );
    return { hook, congregation, turnId };
  };
  beforeEach(() =>
    resetMocks(
      callFunctionMock,
      getFirstItemOfListMock,
      getListMock,
      createDataMock,
      deleteDataByIdMock
    )
  );

  it("creates the territory, then each map where the admin put it", async () => {
    const p = proposal({});
    const { hook, congregation, turnId } = await withPlaces(p);
    getFirstItemOfListMock.mockResolvedValueOnce(null);
    createDataMock.mockResolvedValueOnce({ id: "t9" });
    callFunctionMock
      .mockResolvedValueOnce({ id: "m1" })
      .mockRejectedValueOnce(new Error("Duplicate unit in sequence"));

    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(createDataMock).toHaveBeenCalledWith(
      "territories",
      { code: "T05", description: "Bedok North", congregation },
      expect.anything()
    );
    const first = callFunctionMock.mock.calls.find((c) => c[0] === "/map/add");
    expect(first?.[1].body).toEqual({
      name: "Blk 412",
      sequence: "671,673",
      type: "multi",
      coordinates: JSON.stringify({ lat: 1.3, lng: 103.9 }),
      congregation,
      territory: "t9",
      floors: 12,
      start_floor: 2
    });
    // One map failing does not lose the other.
    expect(action(hook)).toMatchObject({
      status: "done",
      recordId: "t9",
      recordIds: ["m1"],
      error: "Blk 413: Duplicate unit in sequence"
    });

    getListMock.mockResolvedValueOnce([]);
    callFunctionMock.mockResolvedValueOnce(undefined);
    await act(() => hook.result.current.undoProposal(turnId, p, action(hook)!));
    expect(callFunctionMock).toHaveBeenLastCalledWith(
      "/territory/delete",
      expect.objectContaining({ body: { territory: "t9" } })
    );
    expect(action(hook)?.status).toBe("undone");
  });

  it("does not create a territory whose code was taken since", async () => {
    const p = proposal({});
    const { hook, turnId } = await withPlaces(p);
    getFirstItemOfListMock.mockResolvedValueOnce({ id: "other" });
    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(createDataMock).not.toHaveBeenCalled();
    expect(action(hook)?.status).toBe("stale");
  });

  it("adds maps to a territory and keeps them once a home is used", async () => {
    const p = proposal({
      kind: "maps_create",
      target: { id: "t1", name: "T01" },
      data: { maps: [plan("Blk 412")], homes: 24 }
    });
    const { hook, turnId } = await withPlaces(p);
    getFirstItemOfListMock.mockResolvedValueOnce({ id: "t1" });
    callFunctionMock.mockResolvedValueOnce({ id: "m1" });
    await act(() => hook.result.current.confirmProposal(turnId, p));
    expect(action(hook)).toMatchObject({ status: "done", recordIds: ["m1"] });

    getListMock.mockResolvedValueOnce([{ id: "a1" }]);
    await act(() => hook.result.current.undoProposal(turnId, p, action(hook)!));
    expect(deleteDataByIdMock).not.toHaveBeenCalled();
    expect(action(hook)?.error).toBeTruthy();

    getListMock.mockResolvedValueOnce([]);
    await act(() =>
      hook.result.current.undoProposal(turnId, p, {
        ...action(hook)!,
        error: undefined
      })
    );
    expect(deleteDataByIdMock).toHaveBeenCalledWith(
      "maps",
      "m1",
      expect.anything()
    );
  });
});
