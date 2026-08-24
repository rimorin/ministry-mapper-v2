import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../utils/test/test-wrapper";
import { Policy } from "../../utils/policies";
import {
  ENDGAME_PROGRESS_THRESHOLD,
  STATUS_CODES
} from "../../utils/constants";
import type {
  addressDetails,
  floorDetails,
  unitDetails
} from "../../utils/interface";
import PublicTerritoryTable from "./publictable";

const policy = new Policy("tester", [
  {
    id: "t1",
    code: "C",
    description: "Chinese",
    isCountable: true,
    isDefault: true,
    sequence: 1
  }
]);

const unit = (id: string, status = STATUS_CODES.DEFAULT): unitDetails => ({
  id,
  number: id,
  note: "",
  type: [{ id: "t1", code: "C" }],
  status,
  nhcount: "0",
  dnctime: 0,
  floor: 1,
  sequence: 1
});

// Two floors, because a single-floor map never shows tallies.
const floors = (): floorDetails[] => [
  { floor: 2, units: [unit("a"), unit("b", STATUS_CODES.DONE)] },
  { floor: 1, units: [unit("c"), unit("d")] }
];

// The table reads nothing off the map but its progress.
const addressDetails = (progress: number) =>
  ({ aggregates: { value: progress } }) as addressDetails;

const setup = (progress: number, floorList = floors()) =>
  render(
    <PublicTerritoryTable
      floors={floorList}
      addressDetails={addressDetails(progress)}
      policy={policy}
      maxUnitLength={2}
      handleUnitStatusUpdate={vi.fn()}
    />
  );

const tallies = () =>
  screen.queryAllByLabelText(/still to call on this floor/i);

describe("PublicTerritoryTable floor tallies", () => {
  it("stays hidden while most of the map still needs calling", () => {
    setup(6);
    expect(tallies()).toHaveLength(0);
  });

  it("stays hidden just below the endgame", () => {
    setup(ENDGAME_PROGRESS_THRESHOLD - 1);
    expect(tallies()).toHaveLength(0);
  });

  it("shows a count per floor once the map reaches its endgame", () => {
    setup(ENDGAME_PROGRESS_THRESHOLD);
    const shown = tallies();
    expect(shown).toHaveLength(2);
    expect(shown[0]).toHaveTextContent("1");
    expect(shown[1]).toHaveTextContent("2");
  });

  it("skips a floor that has nothing left", () => {
    setup(95, [
      { floor: 2, units: [unit("a", STATUS_CODES.DONE)] },
      { floor: 1, units: [unit("c")] }
    ]);
    expect(tallies()).toHaveLength(1);
  });

  it("shows no tallies on a single-floor map", () => {
    setup(95, [{ floor: 1, units: [unit("a"), unit("b")] }]);
    expect(tallies()).toHaveLength(0);
  });
});
