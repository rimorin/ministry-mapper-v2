import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import ModalSubmitButton from "./submit";

describe("ModalSubmitButton", () => {
  describe("rendering", () => {
    it("should render submit button with default text", () => {
      render(<ModalSubmitButton isSaving={false} />);

      expect(screen.getByText(/save/i)).toBeInTheDocument();
    });

    it("should render with custom label", () => {
      render(<ModalSubmitButton isSaving={false} btnLabel="Save Changes" />);

      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });

    it("should show spinner when isSaving is true", () => {
      const { container } = render(<ModalSubmitButton isSaving={true} />);

      const spinner = container.querySelector(".spinner-border");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("button state", () => {
    it("should be enabled when not saving", () => {
      render(<ModalSubmitButton isSaving={false} />);

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });

    it("should be disabled when saving", () => {
      render(<ModalSubmitButton isSaving={true} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should be disabled when disabled prop is true", () => {
      render(<ModalSubmitButton isSaving={false} disabled={true} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should be disabled when both isSaving and disabled are true", () => {
      render(<ModalSubmitButton isSaving={true} disabled={true} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("button type", () => {
    it("should have submit type", () => {
      render(<ModalSubmitButton isSaving={false} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });
  });

  describe("styling", () => {
    it("should use primary variant", () => {
      render(<ModalSubmitButton isSaving={false} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("btn-primary");
    });
  });

  describe("spinner display", () => {
    it("should show spinner when saving", () => {
      const { container } = render(<ModalSubmitButton isSaving={true} />);

      const spinner = container.querySelector(".spinner-border");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("spinner-border-sm");
    });

    it("should not show spinner when not saving", () => {
      const { container } = render(<ModalSubmitButton isSaving={false} />);

      const spinner = container.querySelector(".spinner-border");
      expect(spinner).not.toBeInTheDocument();
    });

    it("should have proper spinner attributes when saving", () => {
      const { container } = render(<ModalSubmitButton isSaving={true} />);

      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });
  });
});
