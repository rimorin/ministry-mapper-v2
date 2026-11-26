import { describe, it, expect, beforeEach, vi } from "vitest";
import NiceModal from "@ebay/nice-modal-react";
import { render, screen, waitFor, userEvent } from "../../utils/test";
import EditGroup from "./editgroup";
import type { CongregationGroup } from "../../utils/helpers/getcongregationmembers";

const pb = vi.hoisted(() => ({
  createData: vi.fn(),
  updateDataById: vi.fn(),
  deleteDataById: vi.fn()
}));

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

// "gone" is in the group but not on the roster: it cannot sign in.
const group3 = { id: "g1", name: "Group 3", members: ["sam", "rita", "gone"] };

const open = (group: CongregationGroup, taken: string[] = []) => {
  render(<></>);
  return NiceModal.show(EditGroup, {
    congregation: "cong1",
    group,
    members: roster,
    taken
  });
};

describe("EditGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pb.createData.mockResolvedValue({});
    pb.updateDataById.mockResolvedValue({});
    pb.deleteDataById.mockResolvedValue(true);
  });

  it("makes a group of the people picked", async () => {
    const user = userEvent.setup();
    const done = open({ id: "", name: "", members: [] });

    await user.type(await screen.findByLabelText("Name"), "Group 5 ");
    await user.type(
      screen.getByRole("combobox", { name: "Search members" }),
      "joe@{Enter}"
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await expect(done).resolves.toBe(true);
    expect(pb.createData).toHaveBeenCalledWith(
      "groups",
      { name: "Group 5", members: ["joe"], congregation: "cong1" },
      expect.anything()
    );
  });

  it("keeps the members the roster leaves out", async () => {
    const user = userEvent.setup();
    void open(group3);

    const name = await screen.findByLabelText("Name");
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
    void open(group3);

    expect(await screen.findByText("sam@alpha.test")).toBeInTheDocument();
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
    void open({ id: "", name: "", members: [] }, ["Group 3"]);

    await user.type(await screen.findByLabelText("Name"), "group 3");
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
    void open({ id: "", name: "", members: [] });

    await user.type(await screen.findByLabelText("Name"), "   ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Give the group a name.")).toBeInTheDocument();
    expect(pb.createData).not.toHaveBeenCalled();
  });

  it("deletes a group once confirmed", async () => {
    const user = userEvent.setup();
    const done = open(group3);

    await user.click(
      await screen.findByRole("button", { name: "Delete group" })
    );
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await expect(done).resolves.toBe(true);
    expect(pb.deleteDataById).toHaveBeenCalledWith("groups", "g1");
  });
});
