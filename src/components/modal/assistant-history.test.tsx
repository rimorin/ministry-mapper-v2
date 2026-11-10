import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, userEvent, waitFor } from "@/utils/test";

const { callFunctionMock } = vi.hoisted(() => ({ callFunctionMock: vi.fn() }));

vi.mock("../../utils/pocketbase", () => ({
  callFunction: callFunctionMock,
  isAbortError: (error: unknown) =>
    (error as { isAbort?: boolean })?.isAbort === true
}));

const { default: AssistantHistory } = await import("./assistant-history");

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const conversations = [
  {
    id: "c1",
    title: "",
    firstQuestion: "Who came out today?",
    questions: 2,
    lastQuestion: daysAgo(0)
  },
  {
    id: "c2",
    title: "Saturday plan",
    firstQuestion: "Which maps are free?",
    questions: 1,
    lastQuestion: daysAgo(1)
  },
  {
    id: "c3",
    title: "",
    firstQuestion: "How is T01 doing?",
    questions: 3,
    lastQuestion: daysAgo(3)
  },
  {
    id: "c4",
    title: "",
    firstQuestion: "Old question",
    questions: 1,
    lastQuestion: daysAgo(60)
  }
];

const past = {
  conversation: { id: "c1" },
  turns: [],
  people: {}
};

const handlers = {
  onBack: vi.fn(),
  onOpen: vi.fn(),
  onDeleted: vi.fn()
};

const show = () =>
  render(<AssistantHistory congregation="cong1" {...handlers} />);

const action = (name: string) =>
  callFunctionMock.mock.calls.find(
    ([, options]) => options.body.action === name
  );

describe("AssistantHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callFunctionMock.mockReset();
  });

  it("groups conversations by when they last asked, titled by name or first question", async () => {
    callFunctionMock.mockResolvedValueOnce({ conversations, more: false });
    show();

    expect(await screen.findByText("Who came out today?")).toBeVisible();
    expect(screen.getByText("Today")).toBeVisible();
    expect(screen.getByText("Yesterday")).toBeVisible();
    expect(screen.getByText("Past 7 days")).toBeVisible();
    // The renamed one shows its name, not its first question.
    expect(screen.getByText("Saturday plan")).toBeVisible();
    expect(screen.queryByText("Which maps are free?")).toBeNull();
    expect(screen.getByText(/2 questions/)).toBeVisible();
    expect(screen.getAllByText(/1 question ·/)).toHaveLength(2);
    expect(
      screen.getByText(
        "Conversations are deleted 90 days after their last question."
      )
    ).toBeVisible();
    expect(callFunctionMock).toHaveBeenCalledWith(
      "/assistant/history",
      expect.objectContaining({
        body: { congregation: "cong1", action: "list", offset: 0 }
      })
    );
  });

  it("opens one into the chat", async () => {
    callFunctionMock
      .mockResolvedValueOnce({ conversations, more: false })
      .mockResolvedValueOnce(past);
    show();

    await userEvent.click(await screen.findByText("Who came out today?"));
    await waitFor(() => expect(handlers.onOpen).toHaveBeenCalledWith(past));
    expect(action("open")?.[1].body).toEqual({
      congregation: "cong1",
      action: "open",
      conversation: "c1"
    });
  });

  it("renames a conversation from its menu", async () => {
    callFunctionMock
      .mockResolvedValueOnce({ conversations, more: false })
      .mockResolvedValue(undefined);
    show();

    await userEvent.click(
      await screen.findByRole("button", {
        name: "Options for Who came out today?"
      })
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Rename" })
    );
    const input = screen.getByRole("textbox", { name: "Conversation name" });
    await userEvent.type(input, "Today's turnout{Enter}");

    await waitFor(() => expect(action("rename")).toBeDefined());
    expect(action("rename")?.[1].body).toEqual({
      congregation: "cong1",
      action: "rename",
      conversation: "c1",
      title: "Today's turnout"
    });
    expect(await screen.findByText("Today's turnout")).toBeVisible();
  });

  it("deletes a conversation once confirmed", async () => {
    callFunctionMock
      .mockResolvedValueOnce({ conversations, more: false })
      .mockResolvedValue(undefined);
    show();

    await userEvent.click(
      await screen.findByRole("button", { name: "Options for Saturday plan" })
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Delete" })
    );
    expect(
      await screen.findByText("Delete this conversation?", undefined, {
        timeout: 3000
      })
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.queryByText("Saturday plan")).toBeNull());
    expect(action("delete")?.[1].body).toEqual({
      congregation: "cong1",
      action: "delete",
      conversation: "c2"
    });
    // The panel clears the chat if it was this one.
    expect(handlers.onDeleted).toHaveBeenCalledWith("c2");
  });

  it("explains an empty history", async () => {
    callFunctionMock.mockResolvedValueOnce({ conversations: [], more: false });
    show();
    expect(await screen.findByText("No conversations yet")).toBeVisible();
  });

  it("offers to try again when the list cannot load", async () => {
    callFunctionMock
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ conversations, more: false });
    show();

    await userEvent.click(
      await screen.findByRole("button", { name: "Try again" })
    );
    expect(await screen.findByText("Who came out today?")).toBeVisible();
  });
});
