import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import GenericButton from "./button";

describe("GenericButton", () => {
  describe("rendering", () => {
    it("should render button with label", () => {
      render(<GenericButton label="Click Me" />);

      expect(
        screen.getByRole("button", { name: "Click Me" })
      ).toBeInTheDocument();
    });

    it("should use small size by default", () => {
      render(<GenericButton label="Button" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("btn-sm");
    });

    it("should use outline-primary variant by default", () => {
      render(<GenericButton label="Button" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("btn-outline-primary");
    });

    it("should apply custom className", () => {
      render(<GenericButton label="Button" className="custom-class" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("button variants", () => {
    it("should render with primary variant", () => {
      render(<GenericButton label="Primary" variant="primary" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("btn-primary");
    });

    it("should render with danger variant", () => {
      render(<GenericButton label="Danger" variant="danger" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("btn-danger");
    });

    it("should render with success variant", () => {
      render(<GenericButton label="Success" variant="success" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("btn-success");
    });
  });

  describe("button sizes", () => {
    it("should render with small size", () => {
      render(<GenericButton label="Small" size="sm" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("btn-sm");
    });

    it("should render with large size", () => {
      render(<GenericButton label="Large" size="lg" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("btn-lg");
    });
  });

  describe("button type", () => {
    it("should be button type by default", () => {
      render(<GenericButton label="Button" />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("should support submit type", () => {
      render(<GenericButton label="Submit" type="submit" />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("should support reset type", () => {
      render(<GenericButton label="Reset" type="reset" />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "reset");
    });
  });

  describe("user interaction", () => {
    it("should call onClick when clicked", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<GenericButton label="Click" onClick={handleClick} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <GenericButton label="Disabled" onClick={handleClick} disabled={true} />
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("disabled state", () => {
    it("should be enabled by default", () => {
      render(<GenericButton label="Button" />);

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });

    it("should be disabled when disabled prop is true", () => {
      render(<GenericButton label="Disabled" disabled={true} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("data attributes", () => {
    it("should apply custom data attributes", () => {
      render(
        <GenericButton
          label="Button"
          dataAttributes={{ testid: "custom-btn", action: "submit" }}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-testid", "custom-btn");
      expect(button).toHaveAttribute("data-action", "submit");
    });

    it("should handle empty data attributes", () => {
      render(<GenericButton label="Button" dataAttributes={{}} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should convert object keys to data- prefixed attributes", () => {
      render(
        <GenericButton
          label="Button"
          dataAttributes={{ userId: "123", role: "admin" }}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-userId", "123");
      expect(button).toHaveAttribute("data-role", "admin");
    });
  });

  describe("accessibility", () => {
    it("should be keyboard accessible", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<GenericButton label="Accessible" onClick={handleClick} />);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalled();
    });

    it("should have proper button role", () => {
      render(<GenericButton label="Button" />);

      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });
  });
});
