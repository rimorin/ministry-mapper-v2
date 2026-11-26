import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  render,
  setNavigatorShare,
  setNavigatorClipboard,
  setViewport,
  restoreBrowserStubs
} from "../../utils/test";
import NiceModal from "@ebay/nice-modal-react";
import ConfirmSlipDetails from "./slipdetails";
import { LINK_TYPES, USER_ACCESS_LEVELS } from "../../utils/constants";
import type { addressDetails } from "../../utils/interface";
import type { LinkSession, Policy } from "../../utils/policies";

const link = (publisherName: string, linkType: string) =>
  ({ publisherName, linkType }) as LinkSession;

const { createDataMock, membersMock, flag } = vi.hoisted(() => ({
  flag: { publisherRole: true },
  createDataMock: vi.fn(() => Promise.resolve({ id: "mocklink" })),
  membersMock: vi.fn(() =>
    Promise.resolve(
      [] as {
        id: string;
        name: string;
        email: string;
        role: string;
        maps: unknown[];
      }[]
    )
  )
}));

vi.mock("../../hooks/usePublisherRoleEnabled", () => ({
  default: () => flag.publisherRole
}));

vi.mock(
  "../../utils/helpers/getcongregationmembers",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("../../utils/helpers/getcongregationmembers")
    >()),
    default: membersMock
  })
);

vi.mock("../../utils/pocketbase", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/pocketbase")>()),
  createData: createDataMock
}));

const show = (overrides: Record<string, unknown> = {}) =>
  NiceModal.show(ConfirmSlipDetails, {
    addressElement: {
      id: "map1",
      name: "Sunset Towers",
      aggregates: { value: 62, display: "62%", notDone: 14, notHome: 5 }
    } as unknown as addressDetails,
    policy: {
      userRole: USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE,
      congregation: "cong1",
      defaultExpiryHours: 24
    } as unknown as Policy,
    userId: "user1",
    isPersonalSlip: false,
    territoryName: "Marsiling East",
    existingLinks: [
      link("Sarah", LINK_TYPES.PERSONAL),
      link("Sarah", LINK_TYPES.PERSONAL),
      link("Peter", LINK_TYPES.ASSIGNMENT),
      link("Mary", LINK_TYPES.ASSIGNMENT),
      link("Jane", LINK_TYPES.ASSIGNMENT),
      link("Amos", LINK_TYPES.ASSIGNMENT),
      link("Ruth", LINK_TYPES.ASSIGNMENT)
    ],
    ...overrides
  });

const openAndCreateLink = async (overrides: Record<string, unknown> = {}) => {
  const view = render(<></>);
  show(overrides);
  await waitFor(() =>
    expect(
      screen.getByText("Confirm slip details for Sunset Towers")
    ).toBeInTheDocument()
  );
  await userEvent.type(
    screen.getByPlaceholderText("Names of the assigned publishers"),
    "John"
  );
  await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() =>
    expect(screen.getByText("Map link is ready")).toBeInTheDocument()
  );
  return view;
};

const roster = [
  {
    id: "user9",
    name: "Sam Publisher",
    email: "sam@alpha.test",
    role: "publisher",
    maps: [
      { link: "l1", map: "m1", name: "Blk 301" },
      { link: "l2", map: "m2", name: "Blk 305" }
    ],
    groups: []
  },
  {
    id: "user8",
    name: "Rita Reader",
    email: "rita@alpha.test",
    role: "publisher",
    maps: [],
    groups: []
  }
];

describe("ConfirmSlipDetails", () => {
  beforeEach(() => {
    flag.publisherRole = true;
    vi.clearAllMocks();
    // A roster set by one test must not put the picker into the next.
    membersMock.mockReset();
    membersMock.mockResolvedValue([]);
    localStorage.clear();
  });

  afterEach(() => {
    restoreBrowserStubs();
  });

  it("creates the link on confirm, then shares it from a fresh tap", async () => {
    const shareMock = vi.fn(() => Promise.resolve());
    setNavigatorShare(shareMock);

    const { unmount } = await openAndCreateLink();
    expect(shareMock).not.toHaveBeenCalled();

    expect(screen.getByText("Sunset Towers")).toBeInTheDocument();
    expect(screen.getByText("Marsiling East")).toBeInTheDocument();
    expect(screen.getByText(/Assigned to John/)).toBeInTheDocument();
    expect(screen.getByText(/Expires/)).toBeInTheDocument();
    expect(screen.getByText("Already assigned")).toBeInTheDocument();
    expect(screen.getByText(/^Sarah$/)).toBeInTheDocument();
    expect(screen.getByText(/Peter, Mary, Jane/)).toBeInTheDocument();
    expect(screen.getByText("+2 more")).toBeInTheDocument();
    expect(screen.queryByText(/Amos/)).not.toBeInTheDocument();
    // mixed types: both type badges shown ("Assign" also appears on the header badge)
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getAllByText("Assign")).toHaveLength(2);
    expect(screen.getByText("62%")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(createDataMock).toHaveBeenCalledWith(
      "assignments",
      expect.objectContaining({
        map: "map1",
        user: "user1",
        type: LINK_TYPES.ASSIGNMENT,
        publisher: "John",
        congregation: "cong1"
      }),
      { requestKey: "create-assignment-map1-user1" }
    );

    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(shareMock).toHaveBeenCalledWith({
      text: expect.stringContaining("map/mocklink")
    });
    await waitFor(() =>
      expect(screen.queryByText("Map link is ready")).not.toBeInTheDocument()
    );
    unmount();
  });

  it("gives the link to members picked by typing and Enter, with no share step", async () => {
    membersMock.mockResolvedValueOnce(roster);
    render(<></>);
    show();

    const picker = await screen.findByPlaceholderText("Search members");
    await waitFor(() => expect(picker).toHaveFocus());
    await userEvent.type(picker, "Sam{Enter}");
    // A shared name is settled by the email, so the search matches it too.
    await userEvent.type(picker, "rita@{Enter}");

    expect(
      screen.getByText("They will find this map under My Maps.")
    ).toBeInTheDocument();
    // Their names are not copied into the box for people without an account.
    expect(
      screen.getByPlaceholderText("Names, separated by commas")
    ).toHaveValue("");
    // The share screen is skipped, so its warning moves to the form.
    expect(screen.getByText("Already assigned")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm (2 people)" }));
    await waitFor(() =>
      expect(
        screen.queryByText("Confirm slip details for Sunset Towers")
      ).not.toBeInTheDocument()
    );
    expect(screen.queryByText("Map link is ready")).toBeNull();
    expect(createDataMock).toHaveBeenCalledWith(
      "assignments",
      expect.objectContaining({
        assignees: ["user9", "user8"],
        publisher: "Sam Publisher, Rita Reader"
      }),
      expect.anything()
    );
    expect(JSON.parse(localStorage.getItem("recentAssignees:cong1")!)).toEqual([
      "user9",
      "user8"
    ]);
  });

  it("puts people without an account on the link too, and offers the link to send them", async () => {
    membersMock.mockResolvedValueOnce(roster);
    render(<></>);
    show();

    const picker = await screen.findByPlaceholderText("Search members");
    await waitFor(() => expect(picker).toHaveFocus());
    await userEvent.type(picker, "Sam{Enter}");
    await userEvent.type(
      screen.getByLabelText("Others without an account"),
      "Sis Ong"
    );
    expect(
      screen.getByText("You will be given a link to send them.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm (2 people)" }));

    // Sis Ong has no account to find the map under, so the link is offered.
    expect(await screen.findByText("Map link is ready")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sam Publisher will find it under My Maps. Share the link with Sis Ong."
      )
    ).toBeInTheDocument();
    expect(createDataMock).toHaveBeenCalledWith(
      "assignments",
      expect.objectContaining({
        assignees: ["user9"],
        publisher: "Sam Publisher, Sis Ong"
      }),
      expect.anything()
    );
  });

  it("counts someone picked and typed as well once, as a member", async () => {
    membersMock.mockResolvedValueOnce(roster);
    render(<></>);
    show();

    const picker = await screen.findByPlaceholderText("Search members");
    await waitFor(() => expect(picker).toHaveFocus());
    await userEvent.type(picker, "Sam{Enter}");
    await userEvent.type(
      screen.getByLabelText("Others without an account"),
      "sam  publisher"
    );
    // Nobody is left to send a link to.
    expect(
      screen.queryByText("You will be given a link to send them.")
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Confirm (1 person)" }));

    await waitFor(() =>
      expect(createDataMock).toHaveBeenCalledWith(
        "assignments",
        expect.objectContaining({
          assignees: ["user9"],
          publisher: "Sam Publisher"
        }),
        expect.anything()
      )
    );
    expect(screen.queryByText("Map link is ready")).toBeNull();
  });

  it("still takes a typed name alone, where nobody on the link has an account", async () => {
    membersMock.mockResolvedValueOnce(roster);
    render(<></>);
    show();

    const others = await screen.findByLabelText("Others without an account");
    // With no account picked, someone has to be typed.
    expect(others).toBeRequired();
    await userEvent.type(others, "Sis Ong");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByText("Map link is ready")).toBeInTheDocument();
    expect(createDataMock).toHaveBeenCalledWith(
      "assignments",
      expect.objectContaining({ publisher: "Sis Ong" }),
      expect.anything()
    );
    expect(createDataMock).toHaveBeenCalledWith(
      "assignments",
      expect.not.objectContaining({ assignees: expect.anything() }),
      expect.anything()
    );
  });

  // The list covers the other box and Confirm while it is open.
  it("closes the member list with its Done button, keeping the picks", async () => {
    membersMock.mockResolvedValueOnce(roster);
    render(<></>);
    show();

    const picker = await screen.findByPlaceholderText("Search members");
    await waitFor(() => expect(picker).toHaveFocus());
    await userEvent.type(picker, "Sam{Enter}");
    // Opened here, so the test does not lean on the list staying open after
    // a pick, which varies with what else is running.
    await userEvent.keyboard("{ArrowDown}");

    // fireEvent: the list takes no pointer events while it animates open.
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));

    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(screen.getByText("Sam Publisher")).toBeInTheDocument();
  });

  it("offers recently chosen members first and shows who holds a map", async () => {
    localStorage.setItem("recentAssignees:cong1", JSON.stringify(["user8"]));
    membersMock.mockResolvedValueOnce(roster);
    render(<></>);
    show();

    await userEvent.click(await screen.findByRole("button", { name: "Open" }));

    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      expect.stringContaining("Rita Reader"),
      expect.stringContaining("Sam Publisher")
    ]);
    expect(screen.getByText("Recently assigned")).toBeInTheDocument();
    expect(screen.getByText("2 maps: Blk 301, Blk 305")).toBeInTheDocument();
    expect(screen.queryByText(/sam@alpha\.test/)).not.toBeInTheDocument();
  });

  it("leaves the member picker out and sends no assignees without a roster", async () => {
    await openAndCreateLink();

    expect(screen.queryByPlaceholderText("Search members")).toBeNull();
    expect(createDataMock).toHaveBeenCalledWith(
      "assignments",
      expect.not.objectContaining({ assignees: expect.anything() }),
      expect.anything()
    );
  });

  it("leaves the member picker out where the publisher role is switched off", async () => {
    flag.publisherRole = false;
    membersMock.mockResolvedValue([
      {
        id: "u1",
        name: "Sam Lee",
        email: "sam@example.com",
        role: "publisher",
        maps: []
      }
    ]);
    await openAndCreateLink();

    expect(membersMock).not.toHaveBeenCalled();
    expect(createDataMock).toHaveBeenCalledWith(
      "assignments",
      expect.not.objectContaining({ assignees: expect.anything() }),
      expect.anything()
    );
  });

  it("hides the type badge when only normal assignments exist", async () => {
    setNavigatorShare(vi.fn(() => Promise.resolve()));

    const { unmount } = await openAndCreateLink({
      existingLinks: [
        link("Peter", LINK_TYPES.ASSIGNMENT),
        link("Mary", LINK_TYPES.ASSIGNMENT)
      ]
    });

    expect(screen.getByText("Already assigned")).toBeInTheDocument();
    expect(screen.getByText("Peter, Mary")).toBeInTheDocument();
    // only the header badge for the newly created link remains
    expect(screen.getAllByText("Assign")).toHaveLength(1);
    expect(screen.queryByText("Personal")).not.toBeInTheDocument();
    unmount();
  });

  it("falls back to copying the link when Web Share is unavailable", async () => {
    const writeTextMock = vi.fn(() => Promise.resolve());
    setNavigatorClipboard({ writeText: writeTextMock });

    const { unmount } = await openAndCreateLink();

    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("map/mocklink")
    );
    await waitFor(() =>
      expect(screen.queryByText("Map link is ready")).not.toBeInTheDocument()
    );
    unmount();
  });

  it("runs the full flow inside a bottom-sheet drawer on mobile", async () => {
    setViewport(true);
    const shareMock = vi.fn(() => Promise.resolve());
    setNavigatorShare(shareMock);

    const { unmount } = await openAndCreateLink();

    expect(document.querySelector('[data-slot="drawer-popup"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(shareMock).toHaveBeenCalledWith({
      text: expect.stringContaining("map/mocklink")
    });
    await waitFor(() =>
      expect(screen.queryByText("Map link is ready")).not.toBeInTheDocument()
    );
    unmount();
  });
});
