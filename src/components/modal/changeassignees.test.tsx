import { describe, it, expect, beforeEach, vi } from "vitest";
import NiceModal from "@ebay/nice-modal-react";
import { render, screen, waitFor, userEvent } from "../../utils/test";
import ChangeAssignees from "./changeassignees";
import type { LinkSession } from "../../utils/policies";

const { callFunctionMock, membersMock } = vi.hoisted(() => ({
  callFunctionMock: vi.fn(),
  membersMock: vi.fn()
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
  callFunction: callFunctionMock
}));

const roster = [
  {
    id: "sam",
    name: "Sam Lee",
    email: "sam@alpha.test",
    role: "publisher",
    maps: [{ link: "l1", map: "m1", name: "Blk 301" }]
  },
  {
    id: "rita",
    name: "Rita Tan",
    email: "rita@alpha.test",
    role: "publisher",
    maps: []
  }
];

const open = (publisherName: string) => {
  render(<></>);
  return NiceModal.show(ChangeAssignees, {
    assignment: {
      id: "link1",
      name: "Blk 100A",
      congregation: "cong1",
      publisherName,
      holders: [{ id: "sam", name: "Sam Lee" }]
    } as LinkSession
  });
};

describe("ChangeAssignees", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    membersMock.mockResolvedValue(roster);
    callFunctionMock.mockResolvedValue({ publisher: "Sam Lee, Rita Tan" });
  });

  it("adds a member and renames a link named after its members", async () => {
    const user = userEvent.setup();
    const closed = open("Sam Lee");
    const input = await screen.findByRole("combobox", {
      name: "Search members"
    });
    expect(screen.getByText("Sam Lee")).toBeInTheDocument();
    await waitFor(() => expect(membersMock).toHaveBeenCalledWith("cong1"));

    await user.type(input, "rita@{Enter}");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(callFunctionMock).toHaveBeenCalledWith(
        "/assignment/assignees",
        expect.objectContaining({
          method: "POST",
          body: {
            assignment: "link1",
            assignees: ["sam", "rita"],
            publisher: "Sam Lee, Rita Tan"
          }
        })
      )
    );
    await expect(closed).resolves.toEqual({
      holders: [
        { id: "sam", name: "Sam Lee" },
        { id: "rita", name: "Rita Tan" }
      ],
      publisherName: "Sam Lee, Rita Tan"
    });
  });

  it("leaves a hand-typed link name alone", async () => {
    const user = userEvent.setup();
    open("Car group 2");
    const input = await screen.findByRole("combobox", {
      name: "Search members"
    });
    await waitFor(() => expect(membersMock).toHaveBeenCalled());

    await user.type(input, "rita@{Enter}");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(callFunctionMock).toHaveBeenCalledWith(
        "/assignment/assignees",
        expect.objectContaining({
          body: { assignment: "link1", assignees: ["sam", "rita"] }
        })
      )
    );
  });
});
