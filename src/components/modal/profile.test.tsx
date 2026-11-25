import { describe, it, expect, afterEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NiceModal from "@ebay/nice-modal-react";
import { render } from "../../utils/test";
import GetProfile from "./profile";

const updateDataById = vi.hoisted(() => vi.fn(() => Promise.resolve({})));

vi.mock("../../utils/pocketbase", () => ({
  updateDataById,
  isAbortError: () => false
}));

const open = async (user: Record<string, unknown>) => {
  render(<></>);
  NiceModal.show(GetProfile, {
    user: { id: "user1", email: "sam@example.test", name: "Sam", ...user }
  } as never);
  return screen.findByRole("switch", {
    name: "Email me when I am given a map"
  });
};

describe("Profile assignment emails", () => {
  afterEach(() => {
    updateDataById.mockClear();
    NiceModal.remove(GetProfile);
  });

  it("is off for an account that never turned it on", async () => {
    expect(await open({})).not.toBeChecked();
  });

  it("shows it on once the account has asked for it", async () => {
    expect(await open({ assignment_emails: true })).toBeChecked();
  });

  it("saves the choice as assignment_emails", async () => {
    await userEvent.click(await open({}));
    await userEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() =>
      expect(updateDataById).toHaveBeenCalledWith(
        "users",
        "user1",
        { name: "Sam", assignment_emails: true },
        expect.anything()
      )
    );
  });
});
