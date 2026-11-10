import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, userEvent, waitFor } from "@/utils/test";
import type { AssistantProposal } from "../../hooks/useAssistant";

const { geocodeMock } = vi.hoisted(() => ({ geocodeMock: vi.fn() }));
vi.mock("../../utils/geocode", () => ({ geocodeAddress: geocodeMock }));

const { default: AssistantNewMaps, allMapsPlaced } =
  await import("./assistant-new-maps");

const plan = {
  name: "Blk 412",
  type: "multi",
  lowest_floor: 2,
  top_floor: 13,
  floors: 12,
  homes: 96,
  units: Array.from({ length: 8 }, (_, i) => String(671 + i * 2)),
  address: "412 Bedok North Ave 2"
};
const proposal: AssistantProposal = {
  id: "p1",
  kind: "maps_create",
  candidates: [],
  from: "",
  to: "",
  warnings: [],
  data: { maps: [plan], homes: 96 }
};

describe("AssistantNewMaps", () => {
  beforeEach(() => geocodeMock.mockReset());

  it("looks up the address and sets the location the admin accepts", async () => {
    geocodeMock.mockResolvedValue({
      lat: 1.33,
      lng: 103.93,
      formatted: "412 Bedok North Avenue 2, Singapore 460412"
    });
    const onStatus = vi.fn();
    render(
      <AssistantNewMaps
        proposal={proposal}
        editable
        origin="SG"
        onStatus={onStatus}
      />
    );
    expect(
      screen.getByText(/Floors 2 to 13, 8 units a floor/i)
    ).toBeInTheDocument();
    expect(screen.getByText("96 homes in all")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText(/Found: 412 Bedok North Avenue 2/)
      ).toBeInTheDocument()
    );
    expect(geocodeMock).toHaveBeenCalledWith(
      "412 Bedok North Ave 2",
      "SG",
      expect.anything()
    );
    await userEvent.click(screen.getByRole("button", { name: "Use this" }));
    expect(onStatus).toHaveBeenCalledWith({
      locations: { "0": { lat: 1.33, lng: 103.93 } }
    });
  });

  it("asks to pick on the map when the address is not found", async () => {
    geocodeMock.mockResolvedValue(null);
    render(
      <AssistantNewMaps proposal={proposal} editable onStatus={vi.fn()} />
    );
    await waitFor(() =>
      expect(
        screen.getByText(/was not found; pick it on the map/)
      ).toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: "Pick on map" })
    ).toBeInTheDocument();
  });

  it("needs every map placed before confirming", () => {
    expect(allMapsPlaced(proposal)).toBe(false);
    expect(
      allMapsPlaced(proposal, {
        status: "idle",
        locations: { "0": { lat: 1, lng: 2 } }
      })
    ).toBe(true);
  });
});
