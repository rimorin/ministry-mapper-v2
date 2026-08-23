import { describe, it, expect, afterEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../utils/test";
import NiceModal from "@ebay/nice-modal-react";
import CreateAddress from "./createaddress";
import { USER_ACCESS_LEVELS } from "../../utils/constants";
import type { addressDetails } from "../../utils/interface";
import type { Policy } from "../../utils/policies";

const writeCreate = vi.fn(() => Promise.resolve());

const options = [{ id: "1", description: "Chinese" }];

const show = (policyOverrides: Record<string, unknown> = {}) =>
  NiceModal.show(CreateAddress, {
    addressData: {
      id: "map1",
      name: "Jalan Sempadan",
      coordinates: { lat: 1.28, lng: 103.86 }
    } as unknown as addressDetails,
    policy: {
      options,
      congregation: "cong1",
      userRole: USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE,
      ...policyOverrides
    } as unknown as Policy,
    sequence: 1,
    existingCodes: new Set<string>(),
    territoryId: "terr1",
    writeCreate
  });

const openWithNumber = async (
  policyOverrides: Record<string, unknown> = {}
) => {
  render(<></>);
  show(policyOverrides);
  await waitFor(() =>
    expect(screen.getByText("Add address to Jalan Sempadan")).toBeVisible()
  );
  await userEvent.type(screen.getByPlaceholderText("e.g. 1, 2A, B3"), "14");
  await userEvent.click(screen.getByRole("button", { name: "Create" }));
};

describe("CreateAddress household type", () => {
  afterEach(() => {
    writeCreate.mockClear();
    NiceModal.remove(CreateAddress);
  });

  it("refuses to save an address with no household type", async () => {
    await openWithNumber();

    expect(
      await screen.findByText("Please select at least one household type.")
    ).toBeVisible();
    expect(writeCreate).not.toHaveBeenCalled();
  });

  it("saves when the congregation has no household types to choose", async () => {
    await openWithNumber({ options: [] });

    await waitFor(() => expect(writeCreate).toHaveBeenCalled());
  });
});
