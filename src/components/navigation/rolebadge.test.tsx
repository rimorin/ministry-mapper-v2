import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import UserRoleBadge from "./rolebadge";

describe("UserRoleBadge", () => {
  describe("role display", () => {
    it("should display read-only badge", () => {
      const { container } = render(<UserRoleBadge role="read_only" />);

      const badge = container.querySelector(".bg-secondary");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(/read/i);
    });

    it("should display conductor badge", () => {
      const { container } = render(<UserRoleBadge role="conductor" />);

      const badge = container.querySelector(".bg-success");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(/conductor/i);
    });

    it("should display administrator badge for administrator role", () => {
      const { container } = render(<UserRoleBadge role="administrator" />);

      const badge = container.querySelector(".bg-primary");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(/admin/i);
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
    it("should render as Bootstrap badge", () => {
      const { container } = render(<UserRoleBadge role="conductor" />);

      const badge = container.querySelector(".badge");
      expect(badge).toBeInTheDocument();
    });

    it("should use correct variant colors", () => {
      const { rerender, container } = render(
        <UserRoleBadge role="read_only" />
      );
      expect(container.querySelector(".bg-secondary")).toBeInTheDocument();

      rerender(<UserRoleBadge role="conductor" />);
      expect(container.querySelector(".bg-success")).toBeInTheDocument();

      rerender(<UserRoleBadge role="administrator" />);
      expect(container.querySelector(".bg-primary")).toBeInTheDocument();
    });
  });
});
