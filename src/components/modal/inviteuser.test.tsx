import { describe, it, expect, beforeEach, vi } from "vitest";
import NiceModal from "@ebay/nice-modal-react";
import { render, screen, userEvent } from "../../utils/test";
import InviteUser from "./inviteuser";
import { USER_ACCESS_LEVELS } from "../../utils/constants";

const pb = vi.hoisted(() => ({
  createData: vi.fn(),
  updateDataById: vi.fn(),
  getFirstItemOfList: vi.fn(),
  getPaginatedList: vi.fn(),
  groups: vi.fn(),
  publisherRole: { on: true }
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
  createData: pb.createData,
  updateDataById: pb.updateDataById,
  getFirstItemOfList: pb.getFirstItemOfList,
  getPaginatedList: pb.getPaginatedList
}));

const open = () => {
  render(<></>);
  return NiceModal.show(InviteUser, { uid: "me", congregation: "cong1" });
};

const pickMei = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(
    await screen.findByPlaceholderText("Search by name or email"),
    "mei"
  );
  await user.click(
    await screen.findByRole("option", { name: "Mei Ling · mei@example.com" })
  );
};

describe("InviteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pb.publisherRole.on = true;
    pb.createData.mockResolvedValue({});
    pb.updateDataById.mockResolvedValue({});
    pb.getFirstItemOfList.mockResolvedValue(null);
    pb.getPaginatedList.mockResolvedValue({
      items: [{ id: "u9", name: "Mei Ling", email: "mei@example.com" }]
    });
    pb.groups.mockResolvedValue([
      { id: "g1", name: "Group 2", members: [] },
      { id: "g2", name: "Group 4", members: [] }
    ]);
  });

  it("adds the member, then puts them in the groups chosen", async () => {
    const user = userEvent.setup();
    const done = open();

    await pickMei(user);
    await user.click(await screen.findByRole("button", { name: "Group 4" }));
    await user.click(screen.getByRole("button", { name: "Invite" }));

    await expect(done).resolves.toBe(true);
    expect(pb.createData).toHaveBeenCalledWith(
      "roles",
      {
        user: "u9",
        congregation: "cong1",
        role: USER_ACCESS_LEVELS.PUBLISHER.CODE
      },
      expect.anything()
    );
    expect(pb.updateDataById).toHaveBeenCalledTimes(1);
    expect(pb.updateDataById).toHaveBeenCalledWith(
      "groups",
      "g2",
      { "members+": "u9" },
      expect.anything()
    );
  });

  it("still adds the member when a group can't be saved", async () => {
    pb.updateDataById.mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    const done = open();

    await pickMei(user);
    await user.click(await screen.findByRole("button", { name: "Group 2" }));
    await user.click(screen.getByRole("button", { name: "Invite" }));

    await expect(done).resolves.toBe(true);
    expect(pb.createData).toHaveBeenCalled();
  });

  it("offers no groups when the congregation has none", async () => {
    pb.groups.mockResolvedValue([]);
    void open();

    await screen.findByRole("heading", { name: "Invite Member" });

    expect(pb.groups).toHaveBeenCalledWith("cong1");
    expect(screen.queryByText("Groups")).not.toBeInTheDocument();
  });

  it("leaves groups out where the publisher role is off", async () => {
    pb.publisherRole.on = false;
    void open();

    await screen.findByRole("heading", { name: "Invite Member" });

    expect(pb.groups).not.toHaveBeenCalled();
    expect(screen.queryByText("Groups")).not.toBeInTheDocument();
  });
});
