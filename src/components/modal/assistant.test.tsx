import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import NiceModal from "@ebay/nice-modal-react";
import { render, screen, waitFor, userEvent, within } from "@/utils/test";

const {
  callFunctionMock,
  networkState,
  getFirstItemOfListMock,
  updateDataByIdMock
} = vi.hoisted(() => ({
  callFunctionMock: vi.fn(),
  networkState: { isOnline: true },
  getFirstItemOfListMock: vi.fn(),
  updateDataByIdMock: vi.fn()
}));

vi.mock("../../utils/pocketbase", () => ({
  callFunction: callFunctionMock,
  pb: { cancelRequest: vi.fn() },
  getFirstItemOfList: getFirstItemOfListMock,
  updateDataById: updateDataByIdMock,
  createData: vi.fn(),
  deleteDataById: vi.fn(),
  isAbortError: (error: unknown) =>
    (error as { isAbort?: boolean })?.isAbort === true
}));

// The canvas has its own tests; here it only needs to show it opened.
vi.mock("./assistant-canvas", () => ({
  default: ({
    place,
    onOpenInAdmin
  }: {
    place: { title: string; territoryId: string };
    onOpenInAdmin: (id: string) => void;
  }) => (
    <div>
      <p>Canvas: {place.title}</p>
      <button type="button" onClick={() => onOpenInAdmin(place.territoryId)}>
        Open in admin view
      </button>
    </div>
  )
}));

vi.mock("../middlewares/networkstatuscontext", () => ({
  useNetworkStatusContext: () => networkState
}));

const { default: AssistantModal, AssistantChat } = await import("./assistant");
const { STARTER_QUESTIONS } = await import("./assistant-suggestions");

const onSelectTerritory = vi.fn();

// Conversations outlive the panel, so each test uses its own congregation.
let congregationCounter = 0;
let congregation = "";

const open = async (role = "administrator") => {
  render(<></>);
  NiceModal.show(AssistantModal, { congregation, role, onSelectTerritory });
  await waitFor(() =>
    expect(screen.getByText("Mapper Assistant")).toBeVisible()
  );
};

const overdueAnswer = {
  answer: "T01 has not been completed in 6 months.",
  grounded: true,
  context: "T01 has not been completed in 6 months.",
  people: {},
  steps: [
    {
      tool: "territory_overview",
      result: {
        columns: ["territory", "progress", "has_boundary"],
        rows: [
          {
            territory_id: "terr1",
            territory: "T01",
            progress: 40,
            has_boundary: true
          }
        ],
        total: 1
      }
    }
  ]
};

// New turns and answers fade in, so they turn visible a frame after they
// are in the page.
const visible = async (found: Promise<HTMLElement>) => {
  const element = await found;
  await waitFor(() => expect(element).toBeVisible());
  return element;
};

describe("AssistantModal", () => {
  beforeEach(() => {
    networkState.isOnline = true;
    congregation = `cong${++congregationCounter}`;
    localStorage.clear();
    // Starter questions are shuffled; this keeps them in the pool's order.
    vi.spyOn(Math, "random").mockReturnValue(0.999);
  });

  afterEach(() => {
    callFunctionMock.mockReset();
    onSelectTerritory.mockReset();
    NiceModal.remove(AssistantModal);
    vi.restoreAllMocks();
  });

  it("says changes can be asked for only to roles that can make them", async () => {
    await open("conductor");
    expect(screen.getByText(/hidden from the AI/)).toBeVisible();
    expect(screen.getByText("What can I help with?")).toBeVisible();
    expect(screen.getByText(/Nothing changes until you confirm/)).toBeVisible();
    NiceModal.hide(AssistantModal);
    NiceModal.remove(AssistantModal);

    await open("read_only");
    expect(screen.getByText("What would you like to know?")).toBeVisible();
    expect(screen.queryByText(/ask for a change/)).toBeNull();
  });

  it("offers four starter questions the role may ask, shuffled", async () => {
    // Fisher-Yates with 0 swaps each question with the first, which leaves
    // the pool's second question in front.
    vi.spyOn(Math, "random").mockReturnValue(0);
    await open("read_only");
    const starters = within(
      screen.getByRole("group", { name: "Suggested questions" })
    ).getAllByRole("button");
    expect(starters).toHaveLength(4);
    const readOnly = STARTER_QUESTIONS.filter((q) => q.role === "read_only");
    for (const starter of starters) {
      expect(readOnly.map((q) => q.fallback)).toContain(starter.textContent);
    }
    expect(starters[0]).toHaveTextContent(readOnly[1].fallback);
  });

  it("answers a suggested question and shows what it looked at", async () => {
    callFunctionMock.mockResolvedValue(overdueAnswer);
    await open();

    await userEvent.click(
      screen.getByRole("button", {
        name: "Which territories have not been completed in 6 months?"
      })
    );

    await visible(screen.findByText("T01 has not been completed in 6 months."));
    expect(callFunctionMock).toHaveBeenCalledWith(
      "/assistant/ask",
      expect.objectContaining({
        body: expect.objectContaining({
          congregation,
          question: "Which territories have not been completed in 6 months?"
        })
      })
    );
    expect(screen.getByText("Checked territories")).toBeVisible();
    expect(screen.getByText("1 found")).toBeVisible();
  });

  it("shows a retried check once and marks one that still failed", async () => {
    callFunctionMock.mockResolvedValue({
      ...overdueAnswer,
      steps: [
        { tool: "territory_overview", error: "bad filter" },
        ...overdueAnswer.steps,
        { tool: "search_notes", error: "bad filter" }
      ]
    });
    await open();
    await userEvent.type(screen.getByRole("textbox"), "How is T01?{Enter}");

    await screen.findByText("T01 has not been completed in 6 months.");
    expect(screen.getAllByText("Checked territories")).toHaveLength(1);
    expect(screen.getAllByText("didn't work")).toHaveLength(1);
  });

  it("labels map types and says how many of a long table came back", async () => {
    const rows = Array.from({ length: 25 }, (_, index) => ({
      territory_id: "terr1",
      map: `Blk ${index}`,
      map_type: "multi"
    }));
    callFunctionMock.mockResolvedValue({
      ...overdueAnswer,
      steps: [
        {
          tool: "territory_overview",
          result: { columns: ["map", "map_type"], rows, total: 230 }
        }
      ]
    });
    await open();
    await userEvent.type(screen.getByRole("textbox"), "List maps{Enter}");

    expect(await screen.findAllByText("Multi-story")).toHaveLength(10);
    expect(screen.getByText("First 25 of 230 found")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Show 15 more" }));
    expect(screen.getAllByText("Multi-story")).toHaveLength(25);
  });

  it("shows one map's details as a card and its homes in the canvas", async () => {
    callFunctionMock.mockResolvedValue({
      ...overdueAnswer,
      answer: "950A has 96 homes and is 40% done.",
      context: "950A has 96 homes and is 40% done.",
      steps: [
        {
          tool: "map_details",
          result: {
            columns: ["map", "homes", "progress"],
            rows: [
              {
                map_id: "m950",
                map: "950A Marsiling Delta",
                territory_id: "terr9",
                territory: "M09",
                type: "multi",
                floors: "2 to 13",
                units_per_floor: 8,
                homes: 96,
                progress: 40,
                has_location: false
              }
            ],
            total: 1
          }
        }
      ]
    });
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "Show me 950A Marsiling Delta{Enter}"
    );
    await screen.findByText("Looked at the map");
    expect(
      await screen.findByText(/Floors 2 to 13, 8 units a floor/)
    ).toBeInTheDocument();
    // A card, not a one-row table.
    expect(screen.queryByRole("columnheader", { name: "Homes" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Show homes" }));
    expect(
      await screen.findByText("Canvas: 950A Marsiling Delta")
    ).toBeInTheDocument();
  });

  it("draws the chart an answer asks for, and lets its table be copied", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });
    const result = {
      columns: ["territory", "visits"],
      rows: [
        { territory_id: "terr1", territory: "T01", visits: 12 },
        { territory_id: "terr2", territory: "T02", visits: 3 }
      ],
      total: 2
    };
    callFunctionMock.mockResolvedValue({
      ...overdueAnswer,
      answer: "T01 had the most visits.",
      context: "T01 had the most visits.",
      steps: [
        {
          tool: "activity",
          result,
          chart: { type: "bar", x: "territory", y: ["visits"] }
        }
      ]
    });
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "Compare visits by territory{Enter}"
    );

    expect(
      await visible(screen.findByText("Visits by territory"))
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: "T01: 12 Visits" })
    ).toBeInTheDocument();
    // The chart shows the rows, so their table starts folded.
    expect(screen.queryByRole("columnheader")).toBeNull();

    await userEvent.click(screen.getByText("Counted visits"));
    await userEvent.click(
      await screen.findByRole("button", { name: "Copy table" })
    );
    expect(writeText).toHaveBeenCalledWith(
      "Territory\tVisits\nT01\t12\nT02\t3"
    );
    expect(
      screen.getByRole("button", { name: "Download as CSV" })
    ).toBeInTheDocument();
  });

  it("writes the answer in place of the progress line as it streams", async () => {
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
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "Which territory is overdue?{Enter}"
    );
    expect(
      await screen.findByText("Reading your question…")
    ).toBeInTheDocument();

    push({ type: "delta", text: "T01 has not been " });
    expect(await screen.findByText("T01 has not been")).toBeInTheDocument();
    expect(screen.queryByText("Reading your question…")).toBeNull();
    expect(screen.queryByRole("button", { name: "Copy answer" })).toBeNull();

    push({ type: "done", response: overdueAnswer });
    close();
    expect(
      await screen.findByText("T01 has not been completed in 6 months.")
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Copy answer" })
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("opens a linked territory in the page and keeps the conversation", async () => {
    callFunctionMock.mockResolvedValue(overdueAnswer);
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "Which territory is overdue?{Enter}"
    );
    await screen.findByText("Checked territories");
    // The answer's table opens by itself.
    expect(
      await screen.findByRole("columnheader", { name: "Territory" })
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "T01" }));
    expect(onSelectTerritory).toHaveBeenCalledWith("terr1");
    // The phone drawer covers the page, so it closes...
    await waitFor(() =>
      expect(screen.queryByText("Mapper Assistant")).toBeNull()
    );
    // ...and the conversation is there when it opens again.
    await open();
    expect(
      screen.getByText("T01 has not been completed in 6 months.")
    ).toBeInTheDocument();
  });

  it("uses what is open as context, shown on a chip that can be removed", async () => {
    callFunctionMock.mockResolvedValue(overdueAnswer);
    const view = {
      territoryId: "terr1",
      territoryCode: "M01",
      territoryName: "Marsiling Road",
      mapId: "m187",
      mapName: "187A Marsiling Road"
    };
    render(
      <AssistantChat
        congregation={congregation}
        role="administrator"
        view={view}
        onSelectTerritory={onSelectTerritory}
        onClose={vi.fn()}
        docked
      />
    );
    expect(
      screen.getByText("Using M01 · 187A Marsiling Road")
    ).toBeInTheDocument();
    const starters = within(
      screen.getByRole("group", { name: "Suggested questions" })
    ).getAllByRole("button");
    expect(starters[0]).toHaveTextContent("Show me 187A Marsiling Road");
    expect(starters[1]).toHaveTextContent(
      "Which maps in M01 have the most homes not done?"
    );
    expect(starters).toHaveLength(4);

    await userEvent.click(starters[0]);
    expect(callFunctionMock.mock.calls[0][1].body.view).toEqual({
      territory: "terr1",
      map: "m187"
    });
    expect(
      await screen.findByText("About M01 · 187A Marsiling Road")
    ).toBeInTheDocument();

    // Removed, the next question goes without it, and it can be put back.
    await userEvent.click(
      screen.getByRole("button", { name: "Do not use what is open" })
    );
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "And overall?{Enter}"
    );
    await waitFor(() => expect(callFunctionMock).toHaveBeenCalledTimes(2));
    expect(callFunctionMock.mock.calls[1][1].body.view).toBeUndefined();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Use M01 · 187A Marsiling Road"
      })
    );
    expect(
      screen.getByText("Using M01 · 187A Marsiling Road")
    ).toBeInTheDocument();
  });

  it("stays open beside the page when docked", async () => {
    callFunctionMock.mockResolvedValue(overdueAnswer);
    const onClose = vi.fn();
    render(
      <AssistantChat
        congregation={congregation}
        role="administrator"
        onSelectTerritory={onSelectTerritory}
        onClose={onClose}
        docked
      />
    );
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "Which territory is overdue?{Enter}"
    );
    await userEvent.click(await screen.findByRole("button", { name: "T01" }));
    expect(onSelectTerritory).toHaveBeenCalledWith("terr1");
    expect(onClose).not.toHaveBeenCalled();
    expect(
      await screen.findByText("T01 has not been completed in 6 months.")
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Close assistant" })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("shows the data without text when the answer was not grounded", async () => {
    callFunctionMock.mockResolvedValue({
      ...overdueAnswer,
      grounded: false,
      answer: "",
      context: ""
    });
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "Overdue?{Enter}"
    );

    await visible(screen.findByText(/Open the checks above/));
    expect(screen.getByText("Checked territories")).toBeVisible();
    // A way forward, and a short note for screen readers.
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(screen.getByRole("status", { name: "" })).toHaveTextContent(
      "I could not write an answer that matches your data exactly."
    );
  });

  it("explains when the assistant is unavailable", async () => {
    callFunctionMock.mockRejectedValue(new Error("boom"));
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "Overdue?{Enter}"
    );

    await visible(screen.findByText("Something went wrong. Please try again."));
  });

  it("rates a logged answer with a thumb that stays pressed", async () => {
    callFunctionMock.mockResolvedValue({});
    callFunctionMock.mockResolvedValueOnce({
      ...overdueAnswer,
      questionId: "q1"
    });
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "Overdue?{Enter}"
    );
    const bad = await screen.findByRole("button", { name: "Bad answer" });

    await userEvent.click(bad);

    expect(bad).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Good answer" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(callFunctionMock).toHaveBeenLastCalledWith(
      "/assistant/feedback",
      expect.objectContaining({ body: { question: "q1", rating: -1 } })
    );

    // A thumbs down asks, optionally, what went wrong.
    await userEvent.click(
      screen.getByRole("button", { name: "Wrong numbers" })
    );
    expect(
      screen.getByText("Thanks. Your feedback helps improve the assistant.")
    ).toBeVisible();
    expect(callFunctionMock).toHaveBeenLastCalledWith(
      "/assistant/feedback",
      expect.objectContaining({
        body: { question: "q1", rating: -1, reason: "wrong_figures" }
      })
    );
  });

  it("brings a past conversation back into the chat, cards and all, and clears it once deleted", async () => {
    callFunctionMock.mockImplementation((path: string, options) => {
      if (path !== "/assistant/history") return Promise.resolve(overdueAnswer);
      return Promise.resolve(
        options.body.action === "list"
          ? {
              conversations: [
                {
                  id: "c1",
                  title: "",
                  firstQuestion: "Who came out today?",
                  questions: 1,
                  lastQuestion: new Date().toISOString()
                }
              ],
              more: false
            }
          : {
              conversation: { id: "c1" },
              turns: [
                {
                  id: "q1",
                  question: "Who came out today?",
                  answer: "Bro Tan came out.",
                  context: "Person QXWB came out.",
                  asked: "2026-11-05T10:00:00Z",
                  cards: [
                    {
                      proposal: {
                        id: "p1",
                        kind: "pin_message",
                        candidates: [],
                        from: "",
                        to: "",
                        warnings: [],
                        value: "Bring tracts",
                        target: {
                          id: "m1",
                          name: "Blk 1"
                        }
                      },
                      outcome: ""
                    }
                  ],
                  steps: overdueAnswer.steps,
                  status: "",
                  view: null,
                  rating: 1,
                  reason: ""
                }
              ],
              people: { "Person QXWB": "Bro Tan" }
            }
      );
    });
    await open();

    await userEvent.click(
      screen.getByRole("button", { name: "Past conversations" })
    );
    await userEvent.click(await screen.findByText("Who came out today?"));

    // Straight into the chat: the answer, its lookups, its rating, and the
    // card it prepared, still there to confirm.
    await visible(screen.findByText("Bro Tan came out."));
    expect(screen.getByText(/^Asked /)).toBeVisible();
    expect(screen.getByText("Checked territories")).toBeVisible();
    expect(screen.getByRole("button", { name: "Good answer" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("Pin an instruction")).toBeVisible();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Ask again" })).toBeEnabled();

    // Deleting it from history clears the chat too.
    await userEvent.click(
      screen.getByRole("button", { name: "Past conversations" })
    );
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Options for Who came out today?"
      })
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Delete" })
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Delete" }, { timeout: 3000 })
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Back to chat" })
    );
    expect(screen.queryByText("Bro Tan came out.")).toBeNull();
  });

  it("copies an answer", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });
    callFunctionMock.mockResolvedValue(overdueAnswer);
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "Overdue?{Enter}"
    );
    await screen.findByText("T01 has not been completed in 6 months.");

    await userEvent.click(screen.getByRole("button", { name: "Copy answer" }));

    expect(writeText).toHaveBeenCalledWith(
      "T01 has not been completed in 6 months."
    );
    expect(
      await screen.findByRole("button", { name: "Copied" })
    ).toBeInTheDocument();
  });

  it("offers Stop while answering and Try again after a failure", async () => {
    let fail: (reason: unknown) => void = () => {};
    callFunctionMock.mockImplementationOnce(
      () => new Promise((_, reject) => (fail = reject))
    );
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "Overdue?{Enter}"
    );

    await visible(screen.findByRole("button", { name: "Stop" }));
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();

    fail(new Error("boom"));
    callFunctionMock.mockResolvedValueOnce(overdueAnswer);
    await userEvent.click(
      await screen.findByRole("button", { name: "Try again" })
    );

    await visible(screen.findByText("T01 has not been completed in 6 months."));
    expect(callFunctionMock).toHaveBeenCalledTimes(2);
  });

  it("offers the latest answer's follow-up questions", async () => {
    callFunctionMock.mockResolvedValueOnce({
      ...overdueAnswer,
      answer: "You have 30 territories.",
      suggestions: ["Which territories are not started?", "Who came out today?"]
    });
    callFunctionMock.mockResolvedValueOnce(overdueAnswer);
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "Tell me about my territories{Enter}"
    );
    await screen.findByText("You have 30 territories.");

    // The app's buttons lift on hover, which flickers under a pointer resting
    // on the edge; the panel's buttons must not lift.
    const suggestion = screen.getByRole("button", {
      name: "Which territories are not started?"
    });
    expect(suggestion.className).toContain(
      "hover:not-aria-[haspopup]:translate-y-0"
    );
    expect(suggestion.className).not.toContain("-translate-y-0.5");

    await userEvent.click(
      screen.getByRole("button", { name: "Which territories are not started?" })
    );

    expect(callFunctionMock).toHaveBeenLastCalledWith(
      "/assistant/ask",
      expect.objectContaining({
        body: expect.objectContaining({
          question: "Which territories are not started?"
        })
      })
    );
    await visible(screen.findByText("T01 has not been completed in 6 months."));
    expect(
      screen.queryByRole("button", { name: "Who came out today?" })
    ).toBeNull();
  });

  it("offers to share the location when an answer needs it", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (ok: (p: unknown) => void) =>
          ok({ coords: { latitude: 1.44, longitude: 103.77 } })
      }
    });
    callFunctionMock.mockResolvedValueOnce({
      ...overdueAnswer,
      steps: [],
      answer: "Please share your location.",
      needsLocation: true
    });
    callFunctionMock.mockResolvedValueOnce(overdueAnswer);
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "What is near me?{Enter}"
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Use my location" })
    );

    await visible(screen.findByText("T01 has not been completed in 6 months."));
    expect(callFunctionMock.mock.calls[1][1].body).toMatchObject({
      question: "What is near me?",
      location: { lat: 1.44, lng: 103.77 }
    });

    // While shared, a chip says so and can stop it.
    expect(screen.getByText("Using your location")).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Stop sharing your location" })
    );
    expect(screen.queryByText("Using your location")).toBeNull();
  });

  it("shows maps found nearby on the canvas", async () => {
    callFunctionMock.mockResolvedValue({
      ...overdueAnswer,
      answer: "Blk 100B is nearest.",
      steps: [
        {
          tool: "maps_near",
          result: {
            columns: ["territory", "map", "distance_m"],
            total: 1,
            rows: [
              {
                territory_id: "terr1",
                territory: "T01",
                map_id: "map2",
                map: "Blk 100B",
                distance_m: 110,
                lat: 1.301,
                lng: 103.8
              }
            ]
          }
        }
      ]
    });
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "What is near Blk 100A?{Enter}"
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Show on map" })
    );
    expect(await screen.findByText("Canvas: Nearby maps")).toBeInTheDocument();
  });

  it("confirms a prepared change from its card", async () => {
    callFunctionMock.mockResolvedValue({
      ...overdueAnswer,
      steps: [],
      answer: "The change is ready for you to confirm on the card below.",
      proposals: [
        {
          id: "p1",
          kind: "role_change",
          candidates: [
            {
              userId: "u1",
              roleId: "r1",
              name: "Bro Lee",
              email: "lee@example.com"
            }
          ],
          from: "conductor",
          to: "read_only",
          warnings: []
        }
      ]
    });
    getFirstItemOfListMock.mockResolvedValue({ id: "r1", role: "conductor" });
    updateDataByIdMock.mockResolvedValue({ id: "r1", role: "read_only" });
    await open();
    await userEvent.type(
      screen.getByLabelText("Ask a question…"),
      "Make Bro Lee read-only{Enter}"
    );

    await visible(screen.findByText("Change access"));
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await visible(screen.findByText("Done."));
    expect(updateDataByIdMock).toHaveBeenCalledWith(
      "roles",
      "r1",
      { role: "read_only" },
      expect.anything()
    );
    expect(screen.getByRole("button", { name: "Undo" })).toBeVisible();

    // Starting over would lose that Undo, so it asks first.
    await userEvent.click(
      screen.getByRole("button", { name: "New conversation" })
    );
    await visible(
      screen.findByText(/can still be undone/, undefined, {
        timeout: 3000
      })
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Done.")).toBeVisible();
  });

  it("keeps an earlier answer's card confirmable after another question", async () => {
    callFunctionMock
      .mockResolvedValueOnce({
        ...overdueAnswer,
        steps: [],
        answer: "The change is ready for you to confirm on the card below.",
        proposals: [
          {
            id: "p1",
            kind: "role_change",
            candidates: [
              {
                userId: "u1",
                roleId: "r1",
                name: "Bro Lee",
                email: "lee@example.com"
              }
            ],
            from: "conductor",
            to: "read_only",
            warnings: []
          }
        ]
      })
      .mockResolvedValueOnce(overdueAnswer);
    getFirstItemOfListMock.mockResolvedValue({ id: "r1", role: "conductor" });
    updateDataByIdMock.mockResolvedValue({ id: "r1", role: "read_only" });
    await open();
    const input = screen.getByLabelText("Ask a question…");
    await userEvent.type(input, "Make Bro Lee read-only{Enter}");
    await visible(screen.findByText("Change access"));

    // Another question before confirming the first card.
    await userEvent.type(input, "Which territory is overdue?{Enter}");
    await visible(screen.findByText("T01 has not been completed in 6 months."));

    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    expect(confirmButton).toBeEnabled();
    await userEvent.click(confirmButton);
    await visible(screen.findByText("Done."));
  });

  it("disables asking while offline", async () => {
    networkState.isOnline = false;
    await open();

    expect(screen.getByLabelText("Ask a question…")).toBeDisabled();
    expect(
      screen.getByText("The assistant needs an internet connection.")
    ).toBeVisible();
  });
});
