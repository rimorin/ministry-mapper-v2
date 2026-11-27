import { describe, it, expect, beforeEach, vi } from "vitest";
import NiceModal from "@ebay/nice-modal-react";
import { render, screen, userEvent, waitFor } from "../../utils/test";
import UpdateUser from "./updateuser";
import { USER_ACCESS_LEVELS } from "../../utils/constants";

const pb = vi.hoisted(() => ({
  updateDataById: vi.fn(),
  deleteDataById: vi.fn(),
  groups: vi.fn(),
  publisherRole: { on: false }
}));

vi.mock("../../hooks/usePublisherRoleEnabled", () => ({
  default: () => pb.publisherRole.on
}));

vi.mock(
  "../../utils/helpers/getcongregationmembers",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("../../utils/helpers/getcongregationmembers")
    >()),
    getCongregationGroups: pb.groups
  })
);

vi.mock("../../utils/pocketbase", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/pocketbase")>()),
  updateDataById: pb.updateDataById,
  deleteDataById: pb.deleteDataById
}));

const open = () => {
  render(<></>);
  return NiceModal.show(UpdateUser, {
    uid: "role1",
    name: "Aileen Tan",
    role: USER_ACCESS_LEVELS.CONDUCTOR.CODE,
    congregation: "cong1",
    userId: "u1"
  });
};

describe("UpdateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pb.publisherRole.on = false;
    pb.updateDataById.mockResolvedValue({});
    pb.deleteDataById.mockResolvedValue(true);
    pb.groups.mockResolvedValue([
      { id: "g1", name: "Group 2", members: ["u1"] },
      { id: "g2", name: "Group 4", members: [] }
    ]);
  });

  it("moves them between groups, changing only those", async () => {
    pb.publisherRole.on = true;
    const user = userEvent.setup();
    const done = open();

    const group2 = await screen.findByRole("button", { name: "Group 2" });
    expect(group2).toHaveAttribute("aria-pressed", "true");
    await user.click(group2);
    await user.click(screen.getByRole("button", { name: "Group 4" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await expect(done).resolves.toBe(USER_ACCESS_LEVELS.CONDUCTOR.CODE);
    expect(pb.updateDataById).toHaveBeenCalledWith(
      "groups",
      "g1",
      { "members-": "u1" },
      expect.anything()
    );
    expect(pb.updateDataById).toHaveBeenCalledWith(
      "groups",
      "g2",
      { "members+": "u1" },
      expect.anything()
    );
    // The role was left as it was.
    expect(pb.updateDataById).not.toHaveBeenCalledWith(
      "roles",
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });

  it("leaves groups out where the publisher role is off", async () => {
    void open();

    await screen.findByRole("heading", { name: "Aileen Tan" });

    expect(pb.groups).not.toHaveBeenCalled();
    expect(screen.queryByText("Group 2")).not.toBeInTheDocument();
  });

  it("is titled with the member's name and changes their role", async () => {
    const user = userEvent.setup();
    const done = open();

    expect(
      await screen.findByRole("heading", { name: "Aileen Tan" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Read Only" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await expect(done).resolves.toBe(USER_ACCESS_LEVELS.READ_ONLY.CODE);
    expect(pb.updateDataById).toHaveBeenCalledWith(
      "roles",
      "role1",
      { role: USER_ACCESS_LEVELS.READ_ONLY.CODE },
      expect.anything()
    );
  });

  it("removes them from the congregation once confirmed", async () => {
    const user = userEvent.setup();
    const done = open();

    await user.click(
      await screen.findByRole("button", { name: "Remove from congregation" })
    );
    await user.click(await screen.findByRole("button", { name: "Remove" }));

    await expect(done).resolves.toBe(USER_ACCESS_LEVELS.NO_ACCESS.CODE);
    expect(pb.deleteDataById).toHaveBeenCalledWith(
      "roles",
      "role1",
      expect.anything()
    );
  });

  it("keeps them when removal is cancelled", async () => {
    const user = userEvent.setup();
    void open();

    await user.click(
      await screen.findByRole("button", { name: "Remove from congregation" })
    );
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(pb.deleteDataById).not.toHaveBeenCalled());
  });
});
