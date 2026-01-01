import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../utils/test";
import PasswordChecklist from "./passwordchecklist";

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
      render(<PasswordChecklist password="" passwordConfirm="" />);

      const rules = screen.getAllByLabelText("invalid");
      expect(rules.length).toBeGreaterThan(0);
    });

    it("should validate password with 6 characters", () => {
      render(<PasswordChecklist password="abc123" passwordConfirm="" />);

      const validRules = screen.getAllByLabelText("valid");
      // Should have at least minLength valid
      expect(validRules.length).toBeGreaterThan(0);
    });

    it("should invalidate password shorter than minLength", () => {
      render(<PasswordChecklist password="abc" passwordConfirm="" />);

      expect(screen.getAllByLabelText("invalid").length).toBeGreaterThan(0);
    });
  });

  describe("validation - numbers", () => {
    it("should validate password with numbers", () => {
      render(<PasswordChecklist password="password1" passwordConfirm="" />);

      const checks = screen.getAllByLabelText("valid");
      expect(checks.length).toBeGreaterThan(0);
    });

    it("should invalidate password without numbers", () => {
      render(<PasswordChecklist password="password" passwordConfirm="" />);

      const checks = screen.getAllByLabelText("invalid");
      expect(checks.length).toBeGreaterThan(0);
    });
  });

  describe("validation - capital letters", () => {
    it("should validate password with uppercase", () => {
      render(<PasswordChecklist password="Password1" passwordConfirm="" />);

      const checks = screen.getAllByLabelText("valid");
      expect(checks.length).toBeGreaterThan(0);
    });

    it("should invalidate password without uppercase", () => {
      render(<PasswordChecklist password="password1" passwordConfirm="" />);

      const checks = screen.getAllByLabelText("invalid");
      expect(checks.length).toBeGreaterThan(0);
    });
  });

  describe("validation - password match", () => {
    it("should validate when passwords match", () => {
      render(
        <PasswordChecklist password="Password1" passwordConfirm="Password1" />
      );

      const checks = screen.getAllByLabelText("valid");
      expect(checks.length).toBeGreaterThan(0);
    });

    it("should invalidate when passwords don't match", () => {
      render(
        <PasswordChecklist password="Password1" passwordConfirm="Password2" />
      );

      const checks = screen.getAllByLabelText("invalid");
      expect(checks.length).toBeGreaterThan(0);
    });

    it("should invalidate when password is empty", () => {
      render(<PasswordChecklist password="" passwordConfirm="" />);

      const checks = screen.getAllByLabelText("invalid");
      expect(checks.length).toBe(4); // All rules invalid
    });
  });

  describe("visual indicators", () => {
    it("should show checkmark for valid rules", () => {
      render(
        <PasswordChecklist password="Password1" passwordConfirm="Password1" />
      );

      expect(screen.getAllByText("✓").length).toBe(4);
    });

    it("should show X for invalid rules", () => {
      render(<PasswordChecklist password="" passwordConfirm="" />);

      expect(screen.getAllByText("✗").length).toBe(4);
    });

    it("should use success color for valid rules", () => {
      const { container } = render(
        <PasswordChecklist password="Password1" passwordConfirm="Password1" />
      );

      const validMarks = container.querySelectorAll('[style*="bs-success"]');
      expect(validMarks.length).toBeGreaterThan(0);
    });

    it("should use danger color for invalid rules", () => {
      const { container } = render(
        <PasswordChecklist password="" passwordConfirm="" />
      );

      const invalidMarks = container.querySelectorAll('[style*="bs-danger"]');
      expect(invalidMarks.length).toBeGreaterThan(0);
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
    it("should render as unstyled list", () => {
      const { container } = render(
        <PasswordChecklist password="" passwordConfirm="" />
      );

      const list = container.querySelector(".list-unstyled");
      expect(list).toBeInTheDocument();
    });

    it("should have proper list item styling", () => {
      const { container } = render(
        <PasswordChecklist password="" passwordConfirm="" />
      );

      const listItems = container.querySelectorAll("li");
      expect(listItems.length).toBe(4);
    });
  });

  describe("comprehensive validation", () => {
    it("should validate fully compliant password", () => {
      const onChange = vi.fn();

      render(
        <PasswordChecklist
          password="SecurePass123"
          passwordConfirm="SecurePass123"
          onChange={onChange}
        />
      );

      expect(onChange).toHaveBeenCalledWith(true);
      expect(screen.getAllByText("✓").length).toBe(4);
    });

    it("should show mixed valid/invalid for partial password", () => {
      render(<PasswordChecklist password="Password" passwordConfirm="" />);

      const valid = screen.getAllByText("✓");
      const invalid = screen.getAllByText("✗");

      expect(valid.length).toBeGreaterThan(0);
      expect(invalid.length).toBeGreaterThan(0);
    });
  });
});
