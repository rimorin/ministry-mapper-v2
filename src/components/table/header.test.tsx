import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TableHeader from "./header";
import { floorDetails, unitDetails } from "../../utils/interface";

const createMockUnit = (number: string, floor: number): unitDetails => ({
  id: `unit-${number}`,
  number,
  note: "",
  type: [],
  status: "DEFAULT",
  nhcount: "",
  dnctime: 0,
  floor,
  sequence: 0
});

describe("TableHeader", () => {
  it("renders table header with unit numbers", () => {
    const mockFloors: floorDetails[] = [
      {
        floor: 1,
        units: [
          createMockUnit("1", 1),
          createMockUnit("2", 1),
          createMockUnit("3", 1)
        ]
      }
    ];

    render(
      <table>
        <TableHeader floors={mockFloors} maxUnitNumber={2} />
      </table>
    );

    expect(screen.getByText("lvl/unit")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("renders with custom maxUnitNumber padding", () => {
    const mockFloors: floorDetails[] = [
      {
        floor: 1,
        units: [createMockUnit("5", 1)]
      }
    ];

    render(
      <table>
        <TableHeader floors={mockFloors} maxUnitNumber={3} />
      </table>
    );

    expect(screen.getByText("005")).toBeInTheDocument();
  });

  it("renders empty header when floors is undefined", () => {
    const { container } = render(
      <table>
        <TableHeader floors={[] as floorDetails[]} maxUnitNumber={2} />
      </table>
    );

    expect(screen.getByText("lvl/unit")).toBeInTheDocument();
    const headers = container.querySelectorAll("th");
    expect(headers).toHaveLength(1);
  });

  it("renders empty header when floors array is empty", () => {
    const { container } = render(
      <table>
        <TableHeader floors={[]} maxUnitNumber={2} />
      </table>
    );

    expect(screen.getByText("lvl/unit")).toBeInTheDocument();
    const headers = container.querySelectorAll("th");
    expect(headers).toHaveLength(1);
  });
});
