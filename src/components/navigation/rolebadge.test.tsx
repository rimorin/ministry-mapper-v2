import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import UserRoleBadge from "./rolebadge";

describe("UserRoleBadge", () => {
  describe("role display", () => {
    it("should display read-only badge", () => {
      render(<UserRoleBadge role="read_only" />);

      const badge = screen.getByText(/read/i);
      expect(badge).toHaveAttribute("data-slot", "badge");
      expect(badge).toHaveClass("bg-secondary");
    });

    it("should display conductor badge", () => {
      render(<UserRoleBadge role="conductor" />);

      const badge = screen.getByText(/conductor/i);
      expect(badge).toHaveClass("bg-green-600", "text-white");
    });

    it("should display administrator badge for administrator role", () => {
      render(<UserRoleBadge role="administrator" />);

      const badge = screen.getByText(/admin/i);
      expect(badge).toHaveClass("bg-primary", "text-primary-foreground");
    });
  });

  describe("edge cases", () => {
    it("should display question mark when role is undefined", () => {
      render(<UserRoleBadge role={undefined} />);

      const badge = screen.getByText("?");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-secondary");
    });

    it("should display question mark for unknown role", () => {
      render(<UserRoleBadge role="unknown_role" />);

      const badge = screen.getByText("?");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-secondary");
    });
  });

  describe("badge styling", () => {
    it("should render as a shadcn badge", () => {
      render(<UserRoleBadge role="conductor" />);

      expect(screen.getByText(/conductor/i)).toHaveAttribute(
        "data-slot",
        "badge"
      );
    });

    it("should use correct variant colors", () => {
      const { rerender } = render(<UserRoleBadge role="read_only" />);
      expect(screen.getByText(/read/i)).toHaveClass("bg-secondary");

      rerender(<UserRoleBadge role="conductor" />);
      expect(screen.getByText(/conductor/i)).toHaveClass("bg-green-600");

      rerender(<UserRoleBadge role="administrator" />);
      expect(screen.getByText(/admin/i)).toHaveClass("bg-primary");
    });
  });
});
