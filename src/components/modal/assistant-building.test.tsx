import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@/utils/test";

const { callFunctionMock } = vi.hoisted(() => ({ callFunctionMock: vi.fn() }));
vi.mock("../../utils/pocketbase", () => ({
  callFunction: callFunctionMock,
  isAbortError: () => false
}));

const { default: AssistantBuilding } = await import("./assistant-building");

const home = (
  id: string,
  floor: number,
  code: string,
  sequence: number,
  status: string,
  extra = {}
) => ({
  id,
  code,
  floor,
  sequence,
  status,
  not_home_tries: 0,
  notes: "",
  ...extra
});

describe("AssistantBuilding", () => {
  it("lays out floors from the top, units in visiting order, by status", async () => {
    callFunctionMock.mockResolvedValue([
      home("a", 2, "673", 2, "done"),
      home("b", 2, "671", 1, "not_home", { not_home_tries: 2 }),
      home("c", 3, "671", 1, "not_done", { notes: "Dog" }),
      home("d", 3, "673", 2, "do_not_call")
    ]);
    render(<AssistantBuilding mapId="m950" title="950A" onClose={vi.fn()} />);
    const rows = await screen.findAllByRole("row");
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("03");
    expect(
      within(rows[1])
        .getAllByRole("cell")
        .map((c) => c.textContent)
    ).toEqual(["6712", "673"]);
    expect(callFunctionMock).toHaveBeenCalledWith(
      "/map/addresses",
      expect.objectContaining({ body: { map_id: "m950" } })
    );
    expect(screen.getByText("Done 1")).toBeInTheDocument();
    expect(screen.getByText("DNC 1")).toBeInTheDocument();
  });

  it("says when the homes cannot be loaded", async () => {
    callFunctionMock.mockRejectedValue(new Error("down"));
    render(<AssistantBuilding mapId="m1" title="X" onClose={vi.fn()} />);
    expect(
      await screen.findByText("The homes could not be loaded.")
    ).toBeInTheDocument();
  });
});
