import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FloorHeader from "./floor";

describe("FloorHeader", () => {
  it("renders floor number with default padding", () => {
    render(
      <table>
        <tbody>
          <tr>
            <FloorHeader index={0} floor={5} />
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByText("05")).toBeInTheDocument();
  });

  it("renders floor number with two-digit padding", () => {
    render(
      <table>
        <tbody>
          <tr>
            <FloorHeader index={0} floor={12} />
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders floor number zero correctly", () => {
    render(
      <table>
        <tbody>
          <tr>
            <FloorHeader index={0} floor={0} />
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByText("00")).toBeInTheDocument();
  });

  it("has correct CSS classes", () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <FloorHeader index={0} floor={3} />
          </tr>
        </tbody>
      </table>
    );

    const th = container.querySelector("th");
    expect(th).toHaveClass("sticky-left-cell", "text-center", "align-middle");
  });
});
