import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, userEvent } from "@/utils/test";
import AssistantProposalCard from "./assistant-proposal";
import type {
  AssistantProposal,
  ProposalState
} from "../../hooks/useAssistant";

const lee = {
  userId: "u1",
  roleId: "r1",
  name: "Bro Lee",
  email: "lee@example.com"
};
const change: AssistantProposal = {
  id: "p1",
  kind: "role_change",
  candidates: [lee],
  from: "conductor",
  to: "read_only",
  warnings: []
};
const handlers = {
  onStatus: vi.fn(),
  onConfirm: vi.fn(),
  onUndo: vi.fn(),
  onAskAgain: vi.fn(),
  onShareLocation: vi.fn()
};

const show = (
  proposal: AssistantProposal,
  state?: ProposalState,
  actionable = true,
  online = true,
  extra: Partial<typeof handlers> = {}
) =>
  render(
    <AssistantProposalCard
      proposal={proposal}
      state={state}
      actionable={actionable}
      online={online}
      onStatus={handlers.onStatus}
      onConfirm={handlers.onConfirm}
      onUndo={handlers.onUndo}
      {...extra}
    />
  );

describe("AssistantProposalCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("confirms a plain change straight away", async () => {
    show(change);
    expect(screen.getByText("Bro Lee")).toBeInTheDocument();
    expect(screen.getByText("lee@example.com")).toBeInTheDocument();
    expect(screen.getByText("Conductor")).toBeInTheDocument();
    expect(screen.getByText("Read Only")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(handlers.onConfirm).toHaveBeenCalledWith(lee);
    expect(handlers.onStatus).not.toHaveBeenCalled();
  });

  it("asks twice before removing an administrator", async () => {
    const removal: AssistantProposal = {
      ...change,
      kind: "role_revoke",
      from: "administrator",
      to: "",
      warnings: ["removes_admin"]
    };
    const { rerender } = show(removal);
    expect(
      screen.getByText("Bro Lee will no longer be an administrator.")
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(handlers.onConfirm).not.toHaveBeenCalled();
    expect(handlers.onStatus).toHaveBeenCalledWith({
      status: "confirming",
      candidate: lee
    });

    rerender(
      <AssistantProposalCard
        proposal={removal}
        state={{ status: "confirming", candidate: lee }}
        actionable
        online
        {...handlers}
      />
    );
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Yes, make the change" })
    );
    expect(handlers.onConfirm).toHaveBeenCalledWith(lee);
  });

  it("makes the admin pick between several matching accounts", async () => {
    const grant: AssistantProposal = {
      id: "p2",
      kind: "role_grant",
      candidates: [
        { userId: "u2", name: "Sis Tan", email: "tan1@example.com" },
        { userId: "u3", name: "Sis Tan", email: "tan2@example.com" }
      ],
      from: "",
      to: "conductor",
      warnings: []
    };
    show(grant);
    expect(screen.getByText("Which person?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();

    await userEvent.click(screen.getByText("tan2@example.com"));
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(handlers.onConfirm).toHaveBeenCalledWith(grant.candidates[1]);
  });

  it("shows the picked person's own role, warnings and block", async () => {
    const twoLees: AssistantProposal = {
      ...change,
      from: "",
      candidates: [
        { ...lee, role: "conductor" },
        {
          userId: "u3",
          roleId: "r3",
          name: "Bro Lee",
          email: "lee2@example.com",
          role: "administrator",
          warnings: ["self", "removes_admin"],
          blocked: "last_admin"
        }
      ]
    };
    show(twoLees);
    await userEvent.click(screen.getByText("lee@example.com"));
    expect(screen.getByText("Conductor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();

    await userEvent.click(screen.getByText("lee2@example.com"));
    expect(screen.getByText(/must keep an administrator/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
  });

  it("explains a change blocked to keep an administrator", () => {
    show({ ...change, blocked: "last_admin" });
    expect(screen.getByText(/must keep an administrator/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
  });

  it("offers Undo only within the window", async () => {
    const { unmount } = show(change, {
      status: "done",
      candidate: lee,
      roleId: "r1",
      doneAt: Date.now()
    });
    expect(screen.getByText("5 min left")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(handlers.onUndo).toHaveBeenCalled();
    unmount();

    show(change, {
      status: "done",
      candidate: lee,
      roleId: "r1",
      doneAt: Date.now() - 6 * 60 * 1000
    });
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("counts Undo from the change, however long the card waited before it", () => {
    // Confirmed 23 minutes after the card first appeared.
    show(change, {
      status: "done",
      candidate: lee,
      roleId: "r1",
      doneAt: Date.now() + 23 * 60 * 1000
    });
    expect(screen.getByText("5 min left")).toBeInTheDocument();
    expect(screen.queryByText("28 min left")).toBeNull();
  });

  it("does not offer Undo after an admin removes their own administrator role", () => {
    show(
      {
        ...change,
        from: "administrator",
        warnings: ["self", "removes_admin"]
      },
      { status: "done", candidate: lee, roleId: "r1", doneAt: Date.now() }
    );
    expect(screen.getByText("Done.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("offers a reload after changing your own access, but not from history", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    const own = { ...change, from: "administrator", warnings: ["self"] };
    const { unmount } = show(own, {
      status: "done",
      candidate: lee,
      roleId: "r1",
      doneAt: Date.now()
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Reload to use your new access" })
    );
    expect(reload).toHaveBeenCalled();
    unmount();
    vi.unstubAllGlobals();

    show(own, { status: "done", candidate: lee });
    expect(
      screen.queryByRole("button", { name: "Reload to use your new access" })
    ).toBeNull();
  });

  it("keeps Undo on an older card while the window is open", async () => {
    show(
      change,
      { status: "done", candidate: lee, roleId: "r1", doneAt: Date.now() },
      false
    );
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(handlers.onUndo).toHaveBeenCalled();
  });

  it("holds Confirm while an answer is being written, and explains offline", () => {
    const { unmount } = show(change, undefined, false);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    expect(screen.queryByText(/latest answer/)).toBeNull();
    unmount();

    show(change, undefined, false, false);
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
    expect(
      screen.getByText("Connect to the internet to confirm this change.")
    ).toBeInTheDocument();
  });

  it("explains that Undo waits for the connection", () => {
    show(
      change,
      { status: "done", candidate: lee, roleId: "r1", doneAt: Date.now() },
      true,
      false
    );
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    expect(
      screen.getByText("Undo is available when you are back online.")
    ).toBeInTheDocument();
  });
});

// A card of one kind, as the backend prepares it; each test adds the rest.
const cardOf =
  (base: Pick<AssistantProposal, "id" | "kind"> & Partial<AssistantProposal>) =>
  (overrides: Partial<AssistantProposal> = {}): AssistantProposal => ({
    candidates: [],
    from: "",
    to: "",
    warnings: [],
    ...base,
    ...overrides
  });

const blk412 = { id: "m1", name: "Blk 412" };

describe("AssistantProposalCard for records", () => {
  const target = { id: "m1", name: "Blk 100A" };
  const record = cardOf({ id: "p2", kind: "map_rename", target });

  beforeEach(() => vi.clearAllMocks());

  it("shows a rename's old and new names and confirms without a person", async () => {
    show(record({ from: "Blk 100A", to: "Blk 100 North" }));
    expect(screen.getByText("Rename map")).toBeInTheDocument();
    expect(screen.getByText("Blk 100A")).toBeInTheDocument();
    expect(screen.getByText("Blk 100 North")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(handlers.onConfirm).toHaveBeenCalledWith(undefined);
  });

  it("describes a share link and offers Share once it exists", () => {
    const link = record({
      kind: "share_link",
      value: "Sis Ong",
      linkType: "personal",
      hours: 48,
      warnings: ["already_assigned"]
    });
    const { unmount } = show(link);
    expect(screen.getByText("Sis Ong")).toBeInTheDocument();
    expect(screen.getByText(/Personal link/)).toBeInTheDocument();
    expect(screen.getByText(/2 days/)).toBeInTheDocument();
    expect(
      screen.getByText("This map already has an active link.")
    ).toBeInTheDocument();
    unmount();

    show(link, { status: "done", recordId: "link1", doneAt: Date.now() });
    expect(
      screen.getByRole("button", { name: /Share|Copy link/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("warns that a pinned instruction is emailed", () => {
    show(
      record({
        kind: "pin_message",
        value: "Knock softly",
        warnings: ["emails_everyone"]
      })
    );
    expect(screen.getByText("Knock softly")).toBeInTheDocument();
    expect(screen.getByText(/emailed to everyone/)).toBeInTheDocument();
  });

  it("cannot undo the report once it is sent", () => {
    show(record({ kind: "report_email", target: undefined }), {
      status: "done",
      doneAt: Date.now()
    });
    expect(screen.getByText(/You will receive an email/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("says when a record changed since it was prepared, and asks again", async () => {
    show(
      record({ from: "Blk 100A", to: "Blk 100 North" }),
      { status: "stale" },
      true,
      true,
      { onAskAgain: handlers.onAskAgain }
    );
    expect(
      screen.getByText("This changed since it was prepared. Ask again.")
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ask again" }));
    expect(handlers.onAskAgain).toHaveBeenCalled();
  });

  it("offers the location when that is what a change was missing", async () => {
    show(
      record({ kind: "map_location" }),
      { status: "failed", error: "Share your location again, then ask again." },
      true,
      true,
      { onShareLocation: handlers.onShareLocation }
    );
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Use my location" })
    );
    expect(handlers.onShareLocation).toHaveBeenCalled();
  });
});

describe("AssistantProposalCard for assisting actions", () => {
  const target = blk412;
  const card = cardOf({ id: "p3", kind: "mark_read", target });

  beforeEach(() => vi.clearAllMocks());

  it("counts the messages to mark read per map", () => {
    show(
      card({
        target: undefined,
        items: [
          { id: "a", map: "m1", label: "Blk 412" },
          { id: "b", map: "m1", label: "Blk 412" },
          { id: "c", map: "m2", label: "Blk 100A" }
        ]
      })
    );
    expect(screen.getByText(/3 unread messages/)).toBeInTheDocument();
    expect(
      screen.getByText(/Blk 412 \(2\), Blk 100A \(1\)/)
    ).toBeInTheDocument();
  });

  it("warns that taking back a link cannot be undone, and offers no Undo", () => {
    const revoke = card({
      kind: "link_revoke",
      warnings: ["stops_now"],
      items: [
        {
          id: "l1",
          map: "m1",
          label: "Bro Tan",
          detail: "2026-11-08 10:00:00.000Z"
        }
      ]
    });
    const { unmount } = show(revoke);
    expect(screen.getByText("Bro Tan")).toBeInTheDocument();
    expect(screen.getByText(/until/)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
    unmount();

    show(revoke, { status: "done", recordIds: ["l1"], doneAt: Date.now() });
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("shows a home's changes and asks twice before leaving do not call", async () => {
    show(
      card({
        kind: "home_update",
        warnings: ["leaves_do_not_call"],
        items: [{ id: "h1", map: "m1", label: "#05-12" }],
        previous: JSON.stringify({
          status: "do_not_call",
          notes: "Asked not to call",
          type_names: ["Chinese"]
        }),
        value: JSON.stringify({
          status: "not_done",
          notes: "Asked not to call",
          type_names: ["Chinese"]
        })
      })
    );
    expect(screen.getByText(/#05-12/)).toBeInTheDocument();
    expect(screen.getByText("DNC")).toBeInTheDocument();
    expect(screen.getByText("Not Done")).toBeInTheDocument();
    expect(screen.queryByText("Note")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(handlers.onConfirm).not.toHaveBeenCalled();
    expect(handlers.onStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: "confirming" })
    );
  });

  it("names the map a quick link picked and offers Share", () => {
    show(
      card({
        kind: "quick_link",
        target: { ...target, name: "T01" },
        value: "Sis Ong"
      }),
      { status: "done", recordId: "q1", label: "Blk 412", doneAt: Date.now() }
    );
    expect(screen.getByText("Blk 412")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Share|Copy link/ })
    ).toBeInTheDocument();
  });

  it("warns when a new map location is far from the old one", () => {
    show(card({ kind: "map_location", warnings: ["moves_far"] }));
    expect(
      screen.getByText(/Set Blk 412 to where you are/)
    ).toBeInTheDocument();
    expect(screen.getByText(/more than 500 m/)).toBeInTheDocument();
  });
});

describe("AssistantProposalCard for structural actions", () => {
  const target = blk412;
  const card = cardOf({ id: "p4", kind: "map_reset", target });

  beforeEach(() => vi.clearAllMocks());

  it("asks twice before a reset and offers no Undo after", async () => {
    const reset = card({
      warnings: ["cannot_undo"],
      data: { done: 15, not_home: 8, maps: 1 }
    });
    const { unmount } = show(reset);
    expect(
      screen.getByText(/23 homes go back to not done: 15 done, 8 not home/)
    ).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(handlers.onConfirm).not.toHaveBeenCalled();
    expect(handlers.onStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: "confirming" })
    );
    unmount();

    show(reset, { status: "done", doneAt: Date.now() });
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("shows only the settings that change", () => {
    show(
      card({
        kind: "settings",
        target: undefined,
        warnings: ["affects_everyone"],
        previous: JSON.stringify({
          max_tries: 3,
          expiry_hours: 24,
          completion_threshold: 90
        }),
        value: JSON.stringify({
          max_tries: 2,
          expiry_hours: 24,
          completion_threshold: 90
        })
      })
    );
    expect(screen.getByText("No. of Tries")).toBeInTheDocument();
    expect(screen.queryByText(/Expiry/)).toBeNull();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("lists the homes to reset and how many were left", () => {
    show(
      card({
        kind: "tries_reset",
        target: undefined,
        items: [
          { id: "h1", map: "m1", label: "Blk 412 12" },
          { id: "h2", map: "m1", label: "Blk 412 13" }
        ]
      }),
      { status: "done", recordIds: ["h1"], skipped: 1, doneAt: Date.now() }
    );
    expect(screen.getByText("Blk 412 12, Blk 412 13")).toBeInTheDocument();
    expect(
      screen.getByText("1 home had changed since and was left.")
    ).toBeInTheDocument();
  });

  it("names the new status and that special homes stay", () => {
    show(
      card({
        kind: "homes_status",
        to: "done",
        items: [
          { id: "h1", map: "m1", label: "230A #01-01" },
          { id: "h2", map: "m1", label: "230A #01-02" }
        ]
      })
    );
    expect(screen.getByText("2 homes change to Done.")).toBeInTheDocument();
    expect(
      screen.getByText("Do-not-call and invalid homes stay as they are.")
    ).toBeInTheDocument();
  });

  it("names the units added and those already there", () => {
    show(
      card({
        kind: "unit_add",
        warnings: ["some_exist"],
        data: { units: ["15", "16"], existing: ["14"], floors: 12 }
      })
    );
    expect(screen.getByText("15, 16")).toBeInTheDocument();
    expect(screen.getByText(/each of the 12 floors/)).toBeInTheDocument();
    expect(
      screen.getByText("14 already exist and are left out.")
    ).toBeInTheDocument();
  });
});
