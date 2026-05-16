import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../utils/test";
import PasswordChecklist from "./passwordchecklist";

const countValidIcons = (container: HTMLElement) =>
  container.querySelectorAll("svg.text-green-500").length;

const countInvalidIcons = (container: HTMLElement) =>
  container.querySelectorAll("svg.text-destructive").length;

describe("PasswordChecklist", () => {
  describe("validation rules display", () => {
    it("should display all validation rules", () => {
      render(<PasswordChecklist password="" passwordConfirm="" />);

      expect(
        screen.getByText(/Password must be at least 6 characters long/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Password must contain numbers/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Password must contain uppercase letters/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Passwords must match/i)).toBeInTheDocument();
    });

    it("should use custom messages when provided", () => {
      const messages = {
        minLength: "Too short!",
        number: "Add a number!",
        capital: "Add uppercase!",
        match: "Must match!"
      };

      render(
        <PasswordChecklist password="" passwordConfirm="" messages={messages} />
      );

      expect(screen.getByText("Too short!")).toBeInTheDocument();
      expect(screen.getByText("Add a number!")).toBeInTheDocument();
      expect(screen.getByText("Add uppercase!")).toBeInTheDocument();
      expect(screen.getByText("Must match!")).toBeInTheDocument();
    });

    it("should use custom minLength", () => {
      render(
        <PasswordChecklist password="" passwordConfirm="" minLength={8} />
      );

      expect(
        screen.getByText(/Password must be at least 8 characters long/i)
      ).toBeInTheDocument();
    });
  });

  describe("validation - minimum length", () => {
    it("should show invalid for empty password", () => {
      const { container } = render(
        <PasswordChecklist password="" passwordConfirm="" />
      );

      expect(countInvalidIcons(container)).toBe(4);
    });

    it("should validate password with 6 characters", () => {
      const { container } = render(
        <PasswordChecklist password="abc123" passwordConfirm="" />
      );

      expect(countValidIcons(container)).toBe(2);
      expect(countInvalidIcons(container)).toBe(2);
    });

    it("should invalidate password shorter than minLength", () => {
      const { container } = render(
        <PasswordChecklist password="abc" passwordConfirm="" />
      );

      expect(countValidIcons(container)).toBe(0);
      expect(countInvalidIcons(container)).toBe(4);
    });
  });

  describe("validation - numbers", () => {
    it("should validate password with numbers", () => {
      const { container } = render(
        <PasswordChecklist password="password1" passwordConfirm="" />
      );

      expect(countValidIcons(container)).toBe(2);
      expect(countInvalidIcons(container)).toBe(2);
    });

    it("should invalidate password without numbers", () => {
      const { container } = render(
        <PasswordChecklist password="password" passwordConfirm="" />
      );

      expect(countValidIcons(container)).toBe(1);
      expect(countInvalidIcons(container)).toBe(3);
    });
  });

  describe("validation - capital letters", () => {
    it("should validate password with uppercase", () => {
      const { container } = render(
        <PasswordChecklist password="Password1" passwordConfirm="" />
      );

      expect(countValidIcons(container)).toBe(3);
      expect(countInvalidIcons(container)).toBe(1);
    });

    it("should invalidate password without uppercase", () => {
      const { container } = render(
        <PasswordChecklist password="password1" passwordConfirm="" />
      );

      expect(countValidIcons(container)).toBe(2);
      expect(countInvalidIcons(container)).toBe(2);
    });
  });

  describe("validation - password match", () => {
    it("should validate when passwords match", () => {
      const { container } = render(
        <PasswordChecklist password="Password1" passwordConfirm="Password1" />
      );

      expect(countValidIcons(container)).toBe(4);
      expect(countInvalidIcons(container)).toBe(0);
    });

    it("should invalidate when passwords don't match", () => {
      const { container } = render(
        <PasswordChecklist password="Password1" passwordConfirm="Password2" />
      );

      expect(countValidIcons(container)).toBe(3);
      expect(countInvalidIcons(container)).toBe(1);
    });

    it("should invalidate when password is empty", () => {
      const { container } = render(
        <PasswordChecklist password="" passwordConfirm="" />
      );

      expect(countInvalidIcons(container)).toBe(4);
    });
  });

  describe("visual indicators", () => {
    it("should show green icons for valid rules", () => {
      const { container } = render(
        <PasswordChecklist password="Password1" passwordConfirm="Password1" />
      );

      expect(countValidIcons(container)).toBe(4);
    });

    it("should show destructive icons for invalid rules", () => {
      const { container } = render(
        <PasswordChecklist password="" passwordConfirm="" />
      );

      expect(countInvalidIcons(container)).toBe(4);
    });

    it("should use success color for valid rules", () => {
      const { container } = render(
        <PasswordChecklist password="Password1" passwordConfirm="Password1" />
      );

      expect(
        container.querySelectorAll("svg.text-green-500").length
      ).toBeGreaterThan(0);
    });

    it("should use danger color for invalid rules", () => {
      const { container } = render(
        <PasswordChecklist password="" passwordConfirm="" />
      );

      expect(
        container.querySelectorAll("svg.text-destructive").length
      ).toBeGreaterThan(0);
    });
  });

  describe("onChange callback", () => {
    it("should call onChange with true when all rules valid", () => {
      const onChange = vi.fn();

      render(
        <PasswordChecklist
          password="Password1"
          passwordConfirm="Password1"
          onChange={onChange}
        />
      );

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("should call onChange with false when any rule invalid", () => {
      const onChange = vi.fn();

      render(
        <PasswordChecklist
          password="password"
          passwordConfirm=""
          onChange={onChange}
        />
      );

      expect(onChange).toHaveBeenCalledWith(false);
    });

    it("should not call onChange when not provided", () => {
      expect(() => {
        render(<PasswordChecklist password="" passwordConfirm="" />);
      }).not.toThrow();
    });
  });

  describe("styling", () => {
    it("should render as a spaced list", () => {
      const { container } = render(
        <PasswordChecklist password="" passwordConfirm="" />
      );

      expect(container.querySelector("ul")).toHaveClass("space-y-1.5");
    });

    it("should have proper list item styling", () => {
      const { container } = render(
        <PasswordChecklist password="" passwordConfirm="" />
      );

      expect(container.querySelectorAll("li")).toHaveLength(4);
    });
  });

  describe("comprehensive validation", () => {
    it("should validate fully compliant password", () => {
      const onChange = vi.fn();
      const { container } = render(
        <PasswordChecklist
          password="SecurePass123"
          passwordConfirm="SecurePass123"
          onChange={onChange}
        />
      );

      expect(onChange).toHaveBeenCalledWith(true);
      expect(countValidIcons(container)).toBe(4);
    });

    it("should show mixed valid and invalid rules for partial password", () => {
      const { container } = render(
        <PasswordChecklist password="Password" passwordConfirm="" />
      );

      expect(countValidIcons(container)).toBe(2);
      expect(countInvalidIcons(container)).toBe(2);
    });
  });
});
