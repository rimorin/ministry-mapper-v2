import { describe, it, expect } from "vitest";
import { render } from "../../utils/test";
import MapPlaceholder from "./placeholder";

describe("MapPlaceholder", () => {
  it("should render with default rows and columns", () => {
    const { container } = render(<MapPlaceholder policy={undefined} />);

    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(15);

    const firstRowCells = rows[0].querySelectorAll("td");
    expect(firstRowCells).toHaveLength(4);
  });

  it("should render custom number of rows", () => {
    const { container } = render(
      <MapPlaceholder policy={undefined} rows={5} />
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(5);
  });

  it("should render custom number of columns", () => {
    const { container } = render(
      <MapPlaceholder policy={undefined} columns={6} />
    );

    const headerCells = container.querySelectorAll("thead th");
    expect(headerCells).toHaveLength(6);

    const firstRowCells = container.querySelectorAll("tbody tr:first-child td");
    expect(firstRowCells).toHaveLength(6);
  });

  it("should use admin container class when policy is undefined", () => {
    const { container } = render(<MapPlaceholder policy={undefined} />);

    const mapBody = container.querySelector(".map-body-admin");
    expect(mapBody).toBeInTheDocument();
  });

  it("should render table with correct Tailwind CSS classes", () => {
    const { container } = render(<MapPlaceholder policy={undefined} />);

    const table = container.querySelector("table");
    expect(table).toHaveClass("w-full", "border-collapse");
  });

  it("should render placeholder animations", () => {
    const { container } = render(<MapPlaceholder policy={undefined} />);

    const placeholders = container.querySelectorAll(".animate-pulse");
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it("should have opacity styling on table", () => {
    const { container } = render(<MapPlaceholder policy={undefined} />);

    const table = container.querySelector("table");
    expect(table).toHaveClass("opacity-70");
  });

  it("should render glow animation", () => {
    const { container } = render(<MapPlaceholder policy={undefined} />);

    const glowAnimations = container.querySelectorAll(".animate-pulse");
    expect(glowAnimations.length).toBeGreaterThan(0);
  });
});
