import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
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

const { createDataMock } = vi.hoisted(() => ({
  createDataMock: vi.fn(() => Promise.resolve({ id: "mocklink" }))
}));

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

describe("ConfirmSlipDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
