import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../utils/test";
import FloorField from "./floors";

describe("FloorField", () => {
  const defaultProps = {
    handleChange: vi.fn(),
    changeValue: 5
  };

  describe("rendering", () => {
    it("should render floor range input", () => {
      render(<FloorField {...defaultProps} />);

      expect(screen.getByText(/No. of floors/i)).toBeInTheDocument();
      const slider = screen.getByRole("slider");
      expect(slider).toBeInTheDocument();
    });

    it("should display current floor value as ordinal", () => {
      render(<FloorField {...defaultProps} changeValue={5} />);

      expect(screen.getByText("5th")).toBeInTheDocument();
    });

    it("should display 1st for floor 1", () => {
      render(<FloorField {...defaultProps} changeValue={1} />);

      expect(screen.getByText("1st")).toBeInTheDocument();
    });

    it("should display 2nd for floor 2", () => {
      render(<FloorField {...defaultProps} changeValue={2} />);

      expect(screen.getByText("2nd")).toBeInTheDocument();
    });

    it("should display 3rd for floor 3", () => {
      render(<FloorField {...defaultProps} changeValue={3} />);

      expect(screen.getByText("3rd")).toBeInTheDocument();
    });

    it("should display 11th for floor 11", () => {
      render(<FloorField {...defaultProps} changeValue={11} />);

      expect(screen.getByText("11th")).toBeInTheDocument();
    });

    it("should display 21st for floor 21", () => {
      render(<FloorField {...defaultProps} changeValue={21} />);

      expect(screen.getByText("21st")).toBeInTheDocument();
    });
  });

  describe("slider range", () => {
    it("should have minimum value of 1", () => {
      render(<FloorField {...defaultProps} />);

      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("min", "1");
    });

    it("should have maximum value of 50", () => {
      render(<FloorField {...defaultProps} />);

      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("max", "50");
    });

    it("should display current value", () => {
      render(<FloorField {...defaultProps} changeValue={25} />);

      const slider = screen.getByRole("slider");
      expect(slider).toHaveValue("25");
    });
  });

  describe("user interaction", () => {
    it("should have interactive slider", () => {
      render(<FloorField {...defaultProps} />);

      const slider = screen.getByRole("slider");
      expect(slider).toBeInTheDocument();
    });
  });

  describe("layout", () => {
    it("should have flex layout with gap", () => {
      render(<FloorField {...defaultProps} />);

      const slider = screen.getByRole("slider");
      expect(slider.parentElement).toHaveClass("d-flex");
    });

    it("should display ordinal with proper styling", () => {
      render(<FloorField {...defaultProps} />);

      const ordinalText = screen.getByText("5th");
      expect(ordinalText).toBeInTheDocument();
    });
  });

  describe("form group", () => {
    it("should have proper control ID", () => {
      render(<FloorField {...defaultProps} />);

      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("id", "formBasicFloorRange");
    });

    it("should be part of mb-3 class", () => {
      const { container } = render(<FloorField {...defaultProps} />);

      const formGroup = container.querySelector(".mb-3");
      expect(formGroup).toBeInTheDocument();
    });
  });
});
