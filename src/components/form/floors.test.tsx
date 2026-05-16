import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../utils/test";
import FloorField from "./floors";

describe("FloorField", () => {
  const defaultProps = {
    handleChange: vi.fn(),
    changeValue: 5
  };

  it("renders the slider and ordinal label", () => {
    const { container } = render(<FloorField {...defaultProps} />);

    expect(screen.getByText(/No. of floors/i)).toBeInTheDocument();
    expect(container.querySelector('input[type="range"]')).toBeInTheDocument();
    expect(screen.getByText("5th")).toBeInTheDocument();
  });

  it("shows ordinal suffixes correctly", () => {
    const { rerender } = render(
      <FloorField {...defaultProps} changeValue={1} />
    );
    expect(screen.getByText("1st")).toBeInTheDocument();

    rerender(<FloorField {...defaultProps} changeValue={2} />);
    expect(screen.getByText("2nd")).toBeInTheDocument();

    rerender(<FloorField {...defaultProps} changeValue={3} />);
    expect(screen.getByText("3rd")).toBeInTheDocument();

    rerender(<FloorField {...defaultProps} changeValue={11} />);
    expect(screen.getByText("11th")).toBeInTheDocument();

    rerender(<FloorField {...defaultProps} changeValue={21} />);
    expect(screen.getByText("21st")).toBeInTheDocument();
  });

  it("passes slider bounds and value through the range input", () => {
    const { container } = render(
      <FloorField {...defaultProps} changeValue={25} />
    );

    const slider = container.querySelector('input[type="range"]');
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "50");
    expect(slider).toHaveValue("25");
  });

  it("keeps the Tailwind wrapper classes and slider id", () => {
    const { container } = render(<FloorField {...defaultProps} />);

    expect(container.firstElementChild).toHaveClass(
      "flex",
      "flex-col",
      "gap-2"
    );
    expect(
      container.querySelector(".flex.items-center.gap-3")
    ).toBeInTheDocument();
    expect(container.querySelector("#formBasicFloorRange")).toBeInTheDocument();
  });
});
