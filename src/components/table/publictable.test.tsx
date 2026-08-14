import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../utils/test/test-wrapper";
import PublicTerritoryTable from "./publictable";
import { Policy } from "../../utils/policies";
import { STATUS_CODES, DEFAULT_AGGREGATES } from "../../utils/constants";
import type {
  addressDetails,
  floorDetails,
  unitColumn,
  unitDetails
} from "../../utils/interface";

/** Column list as map.tsx derives it: one entry per copy of a unit number. */
const cols = (...numbers: string[]): unitColumn[] => {
  const seen = new Map<string, number>();
  return numbers.map((number) => {
    const occurrence = seen.get(number) ?? 0;
    seen.set(number, occurrence + 1);
    return { key: `${number}#${occurrence}`, number, occurrence };
  });
};

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

const renderTable = (floors: floorDetails[], columns: unitColumn[]) =>
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
const cellUnder = (
  rowIndex: number,
  unitNumber: string,
  columns: unitColumn[]
) => {
  const row = screen.getAllByRole("row")[rowIndex + 1]; // +1 skips the header
  const cells = row.querySelectorAll("td");
  return cells[columns.findIndex((column) => column.number === unitNumber)];
};

describe("PublicTerritoryTable", () => {
  // Yishun 804: 4303 was added late and inherited 4301's sequence. The server
  // returned the tied pair in status order, so floor 12 - where the two units
  // differ in status - listed them the opposite way round from floor 13, which
  // is where the headers used to be read from.
  it("puts each unit under its own header when a floor orders a tied pair differently", () => {
    const columns = cols("4299", "4301", "4303", "4305");
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
    const columns = cols("10", "12", "14");
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
    const columns = cols("10", "12", "14");
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

describe("PublicTerritoryTable duplicate unit numbers", () => {
  // BLK 215C carries unit 703 twice on every floor, at two sequences, with
  // real work recorded against both.
  it("renders a column for each copy of a repeated unit number", () => {
    const columns = cols("701", "703", "703", "705");
    const floors: floorDetails[] = [
      {
        floor: 16,
        units: [
          unit("701", 3, STATUS_CODES.DEFAULT, 16),
          unit("703", 4, STATUS_CODES.DONE, 16),
          { ...unit("703", 5, STATUS_CODES.NOT_HOME, 16), id: "16-703-b" },
          unit("705", 6, STATUS_CODES.DEFAULT, 16)
        ]
      }
    ];

    renderTable(floors, columns);

    const cells = screen.getAllByRole("row")[1].querySelectorAll("td");
    expect(cells).toHaveLength(4);
    expect(cells[1]).toHaveAttribute("data-id", "16-703");
    expect(cells[2]).toHaveAttribute("data-id", "16-703-b");
  });
});
