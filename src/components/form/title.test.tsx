import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ModalUnitTitle from "./title";

const renderInDialog = (ui: React.ReactElement) =>
  render(
    <Dialog open>
      <DialogContent>{ui}</DialogContent>
    </Dialog>
  );

describe("ModalUnitTitle", () => {
  describe("single story territory", () => {
    it("should display unit and name for single type", () => {
      renderInDialog(
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
      renderInDialog(
        <ModalUnitTitle unit="456" floor={1} name="Main Street" type="other" />
      );

      expect(screen.getByText("456, Main Street")).toBeInTheDocument();
    });
  });

  describe("multiple stories territory", () => {
    it("should display name and floor-unit for multi type", () => {
      renderInDialog(
        <ModalUnitTitle unit="123" floor={5} name="Block 123" type="multi" />
      );

      expect(screen.getByText("Block 123 — # 05 - 123")).toBeInTheDocument();
    });

    it("should pad floor number correctly", () => {
      renderInDialog(
        <ModalUnitTitle unit="456" floor={3} name="Tower A" type="multi" />
      );

      expect(screen.getByText("Tower A — # 03 - 456")).toBeInTheDocument();
    });

    it("should handle double-digit floors", () => {
      renderInDialog(
        <ModalUnitTitle unit="789" floor={12} name="High Rise" type="multi" />
      );

      expect(screen.getByText("High Rise — # 12 - 789")).toBeInTheDocument();
    });
  });

  describe("dialog structure", () => {
    it("should render within DialogHeader", () => {
      renderInDialog(
        <ModalUnitTitle unit="1A" floor={1} name="Test" type="single" />
      );

      expect(
        document.body.querySelector('[data-slot="dialog-header"]')
      ).toHaveClass("text-left");
    });

    it("should render a separator after the title", () => {
      renderInDialog(
        <ModalUnitTitle unit="1A" floor={1} name="Test" type="single" />
      );

      expect(
        document.body.querySelector('[data-slot="separator"]')
      ).toBeInTheDocument();
    });
  });

  describe("DialogTitle", () => {
    it("should contain the title content", () => {
      renderInDialog(
        <ModalUnitTitle
          unit="9C"
          floor={1}
          name="Garden Estate"
          type="single"
        />
      );

      const title = document.body.querySelector('[data-slot="dialog-title"]');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent("9C, Garden Estate");
      expect(title).toHaveClass("truncate", "leading-snug");
    });
  });
});
