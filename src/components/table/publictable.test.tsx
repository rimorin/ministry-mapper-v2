import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../utils/test/test-wrapper";
import PublicTerritoryTable from "./publictable";
import { Policy } from "../../utils/policies";
import { STATUS_CODES, DEFAULT_AGGREGATES } from "../../utils/constants";
import type {
  addressDetails,
  floorDetails,
  unitDetails
} from "../../utils/interface";

const unit = (
  number: string,
  sequence: number,
  status: string,
  floor: number
): unitDetails => ({
  id: `${floor}-${number}`,
  number,
  sequence,
  floor,
  status,
  type: [],
  note: "",
  nhcount: "0",
  dnctime: 0
});

const addressDetails = {
  id: "map1",
  name: "804",
  type: "multi",
  aggregates: DEFAULT_AGGREGATES,
  floors: [],
  assigneeDetailsList: [],
  personalDetailsList: [],
  sequence: 0,
  hasLocation: false,
  coordinates: { lat: 0, lng: 0 }
} as unknown as addressDetails;

const renderTable = (floors: floorDetails[], columns: string[]) =>
  render(
    <PublicTerritoryTable
      floors={floors}
      columns={columns}
      addressDetails={addressDetails}
      policy={new Policy()}
      maxUnitLength={4}
      handleUnitStatusUpdate={vi.fn()}
    />
  );

/** The cell rendered under the column headed `unitNumber`, on the given row. */
const cellUnder = (rowIndex: number, unitNumber: string, columns: string[]) => {
  const row = screen.getAllByRole("row")[rowIndex + 1]; // +1 skips the header
  const cells = row.querySelectorAll("td");
  return cells[columns.indexOf(unitNumber)];
};

describe("PublicTerritoryTable", () => {
  // Yishun 804: 4303 was added late and inherited 4301's sequence. The server
  // returned the tied pair in status order, so floor 12 - where the two units
  // differ in status - listed them the opposite way round from floor 13, which
  // is where the headers used to be read from.
  it("puts each unit under its own header when a floor orders a tied pair differently", () => {
    const columns = ["4299", "4301", "4303", "4305"];
    const floors: floorDetails[] = [
      {
        floor: 13,
        units: [
          unit("4299", 0, STATUS_CODES.NOT_HOME, 13),
          unit("4301", 1, STATUS_CODES.NOT_HOME, 13),
          unit("4303", 1, STATUS_CODES.NOT_HOME, 13),
          unit("4305", 2, STATUS_CODES.NOT_HOME, 13)
        ]
      },
      {
        // 4303 first: it is "done" and sorts ahead of 4301 in status order.
        floor: 12,
        units: [
          unit("4299", 0, STATUS_CODES.DONE, 12),
          unit("4303", 1, STATUS_CODES.DONE, 12),
          unit("4301", 1, STATUS_CODES.DEFAULT, 12),
          unit("4305", 2, STATUS_CODES.NOT_HOME, 12)
        ]
      }
    ];

    renderTable(floors, columns);

    expect(cellUnder(1, "4301", columns)).toHaveAttribute(
      "data-unitno",
      "4301"
    );
    expect(cellUnder(1, "4303", columns)).toHaveAttribute(
      "data-unitno",
      "4303"
    );
    expect(cellUnder(1, "4301", columns)).toHaveAttribute("data-id", "12-4301");
  });

  it("renders headers from the column list, not from one floor", () => {
    const columns = ["10", "12", "14"];
    const floors: floorDetails[] = [
      {
        floor: 2,
        units: [
          unit("10", 0, STATUS_CODES.DEFAULT, 2),
          unit("12", 1, STATUS_CODES.DEFAULT, 2),
          unit("14", 2, STATUS_CODES.DEFAULT, 2)
        ]
      }
    ];

    renderTable(floors, columns);

    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent?.trim());

    expect(headers).toEqual(["", "0010", "0012", "0014"]);
  });

  // A floor missing a unit used to shift every cell after it one column left.
  it("leaves a gap when a floor is missing a unit", () => {
    const columns = ["10", "12", "14"];
    const floors: floorDetails[] = [
      {
        floor: 2,
        units: [
          unit("10", 0, STATUS_CODES.DEFAULT, 2),
          unit("12", 1, STATUS_CODES.DEFAULT, 2),
          unit("14", 2, STATUS_CODES.DEFAULT, 2)
        ]
      },
      {
        floor: 1,
        units: [
          unit("10", 0, STATUS_CODES.DEFAULT, 1),
          unit("14", 2, STATUS_CODES.DEFAULT, 1)
        ]
      }
    ];

    renderTable(floors, columns);

    expect(cellUnder(1, "10", columns)).toHaveAttribute("data-unitno", "10");
    expect(cellUnder(1, "12", columns)).not.toHaveAttribute("data-unitno");
    expect(cellUnder(1, "14", columns)).toHaveAttribute("data-unitno", "14");
  });
});
