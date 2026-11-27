import { describe, it, expect, beforeEach, vi } from "vitest";
import NiceModal from "@ebay/nice-modal-react";
import { render, screen, userEvent, waitFor } from "../../utils/test";
import UpdateUser from "./updateuser";
import { USER_ACCESS_LEVELS } from "../../utils/constants";

const pb = vi.hoisted(() => ({
  updateDataById: vi.fn(),
  deleteDataById: vi.fn()
}));

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
    role: USER_ACCESS_LEVELS.CONDUCTOR.CODE
  });
};

describe("UpdateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pb.updateDataById.mockResolvedValue({});
    pb.deleteDataById.mockResolvedValue(true);
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
