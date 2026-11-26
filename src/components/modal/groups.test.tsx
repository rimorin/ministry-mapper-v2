import { describe, it, expect, beforeEach, vi } from "vitest";
import NiceModal from "@ebay/nice-modal-react";
import { render, screen, waitFor, userEvent } from "../../utils/test";
import Groups from "./groups";

const pb = vi.hoisted(() => ({
  members: vi.fn(),
  groups: vi.fn(),
  createData: vi.fn(),
  updateDataById: vi.fn(),
  deleteDataById: vi.fn()
}));

vi.mock(
  "../../utils/helpers/getcongregationmembers",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("../../utils/helpers/getcongregationmembers")
    >()),
    default: pb.members,
    getCongregationGroups: pb.groups
  })
);

vi.mock("../../utils/pocketbase", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/pocketbase")>()),
  createData: pb.createData,
  updateDataById: pb.updateDataById,
  deleteDataById: pb.deleteDataById
}));

const person = (id: string, name: string) => ({
  id,
  name,
  email: `${id}@alpha.test`,
  role: "publisher",
  maps: [],
  groups: []
});

const roster = [
  person("sam", "Sam Lee"),
  person("rita", "Rita Tan"),
  person("joe", "Joe Ng")
];

const open = async () => {
  render(<></>);
  void NiceModal.show(Groups, { congregation: "cong1" });
  return screen.findByRole("dialog");
};

describe("Groups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pb.members.mockResolvedValue(roster);
    // "gone" is in the group but not on the roster: it cannot sign in.
    pb.groups.mockResolvedValue([
      { id: "g1", name: "Group 3", members: ["sam", "rita", "gone"] }
    ]);
    pb.createData.mockResolvedValue({});
    pb.updateDataById.mockResolvedValue({});
    pb.deleteDataById.mockResolvedValue(true);
  });

  it("lists each group with who is in it, and who is in none", async () => {
    await open();

    expect(await screen.findByText("Group 3")).toBeInTheDocument();
    expect(screen.getByText("3 people")).toBeInTheDocument();
    expect(screen.getByText("Sam Lee, Rita Tan")).toBeInTheDocument();
    expect(screen.getByText("1 person isn't in a group")).toBeInTheDocument();
  });

  it("makes a group of the people picked", async () => {
    const user = userEvent.setup();
    await open();
    await screen.findByText("Group 3");

    await user.click(screen.getByRole("button", { name: "New group" }));
    await user.type(screen.getByLabelText("Name"), "Group 5 ");
    await user.type(
      screen.getByRole("combobox", { name: "Search members" }),
      "joe@{Enter}"
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(pb.createData).toHaveBeenCalledWith(
        "groups",
        { name: "Group 5", members: ["joe"], congregation: "cong1" },
        expect.anything()
      )
    );
    expect(pb.groups).toHaveBeenCalledTimes(2);
  });

  it("keeps the members the roster leaves out", async () => {
    const user = userEvent.setup();
    await open();

    await user.click(await screen.findByText("Group 3"));
    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Group 4");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(pb.updateDataById).toHaveBeenCalledWith(
        "groups",
        "g1",
        { name: "Group 4", members: ["sam", "rita", "gone"] },
        expect.anything()
      )
    );
  });

  it("lists the members, and takes one out with its button", async () => {
    const user = userEvent.setup();
    await open();

    await user.click(await screen.findByText("Group 3"));
    expect(screen.getByText("sam@alpha.test")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove Sam Lee" }));
    await waitFor(() =>
      expect(screen.queryByText("sam@alpha.test")).not.toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(pb.updateDataById).toHaveBeenCalledWith(
        "groups",
        "g1",
        { name: "Group 3", members: ["rita", "gone"] },
        expect.anything()
      )
    );
  });

  it("says so, in the form, when a name is taken", async () => {
    const user = userEvent.setup();
    await open();
    await screen.findByText("Group 3");

    await user.click(screen.getByRole("button", { name: "New group" }));
    await user.type(screen.getByLabelText("Name"), "group 3");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("There's already a group called group 3.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(pb.createData).not.toHaveBeenCalled();
  });

  it("asks for a name rather than saving spaces", async () => {
    const user = userEvent.setup();
    await open();
    await screen.findByText("Group 3");

    await user.click(screen.getByRole("button", { name: "New group" }));
    await user.type(screen.getByLabelText("Name"), "   ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Give the group a name.")).toBeInTheDocument();
    expect(pb.createData).not.toHaveBeenCalled();
  });

  it("deletes a group once confirmed", async () => {
    const user = userEvent.setup();
    await open();

    await user.click(await screen.findByText("Group 3"));
    await user.click(screen.getByRole("button", { name: "Delete group" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(pb.deleteDataById).toHaveBeenCalledWith("groups", "g1")
    );
  });
});
