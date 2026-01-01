import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import ModalUnitTitle from "./title";

describe("ModalUnitTitle", () => {
  describe("single story territory", () => {
    it("should display unit and name for single type", () => {
      render(
        <ModalUnitTitle
          unit="12A"
          floor={1}
          name="Sunset Villa"
          type="single"
        />
      );

      expect(screen.getByText("12A, Sunset Villa")).toBeInTheDocument();
    });

    it("should display unit and name for other types", () => {
      render(
        <ModalUnitTitle unit="456" floor={1} name="Main Street" type="other" />
      );

      expect(screen.getByText("456, Main Street")).toBeInTheDocument();
    });
  });

  describe("multiple stories territory", () => {
    it("should display name and floor-unit for multi type", () => {
      render(
        <ModalUnitTitle unit="123" floor={5} name="Block 123" type="multi" />
      );

      expect(screen.getByText("Block 123")).toBeInTheDocument();
      expect(screen.getByText("# 05 - 123")).toBeInTheDocument();
    });

    it("should pad floor number correctly", () => {
      render(
        <ModalUnitTitle unit="456" floor={3} name="Tower A" type="multi" />
      );

      expect(screen.getByText("Tower A")).toBeInTheDocument();
      expect(screen.getByText("# 03 - 456")).toBeInTheDocument();
    });

    it("should handle double-digit floors", () => {
      render(
        <ModalUnitTitle unit="789" floor={12} name="High Rise" type="multi" />
      );

      expect(screen.getByText("High Rise")).toBeInTheDocument();
      expect(screen.getByText("# 12 - 789")).toBeInTheDocument();
    });
  });

  describe("modal header", () => {
    it("should render within Modal.Header", () => {
      const { container } = render(
        <ModalUnitTitle unit="1A" floor={1} name="Test" type="single" />
      );

      const header = container.querySelector(".modal-header");
      expect(header).toBeInTheDocument();
    });

    it("should have space-between justification", () => {
      const { container } = render(
        <ModalUnitTitle unit="1A" floor={1} name="Test" type="single" />
      );

      const header = container.querySelector('[style*="space-between"]');
      expect(header).toBeInTheDocument();
    });
  });

  describe("Modal.Title", () => {
    it("should contain the title content", () => {
      const { container } = render(
        <ModalUnitTitle
          unit="9C"
          floor={1}
          name="Garden Estate"
          type="single"
        />
      );

      const title = container.querySelector(".modal-title");
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent("9C, Garden Estate");
    });
  });
});
