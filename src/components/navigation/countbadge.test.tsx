import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import CountBadge from "./countbadge";

describe("CountBadge", () => {
  describe("rendering", () => {
    it("should display the count", () => {
      render(
        <CountBadge count={5} onClick={vi.fn()} ariaLabel="Assignments" />
      );

      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should display a zero count", () => {
      render(
        <CountBadge count={0} onClick={vi.fn()} ariaLabel="Assignments" />
      );

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("should expose the aria-label on the button", () => {
      render(
        <CountBadge count={3} onClick={vi.fn()} ariaLabel="Unread messages" />
      );

      expect(
        screen.getByRole("button", { name: "Unread messages" })
      ).toBeInTheDocument();
    });
  });

  describe("tone variants", () => {
    it("should use the active border by default", () => {
      render(
        <CountBadge count={2} onClick={vi.fn()} ariaLabel="Assignments" />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("border-l", "border-primary-foreground/20");
      expect(button).not.toHaveClass("text-black");
    });

    it("should use the active border when tone is explicitly active", () => {
      render(
        <CountBadge
          count={2}
          tone="active"
          onClick={vi.fn()}
          ariaLabel="Assignments"
        />
      );

      expect(screen.getByRole("button")).toHaveClass(
        "border-l",
        "border-primary-foreground/20"
      );
    });

    it("should use the warning styling when tone is notify", () => {
      render(
        <CountBadge
          count={2}
          tone="notify"
          onClick={vi.fn()}
          ariaLabel="Unread messages"
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-black");
      expect(button).not.toHaveClass("border-l");
    });
  });

  describe("interaction", () => {
    it("should call onClick when clicked", async () => {
      const onClick = vi.fn();
      render(
        <CountBadge count={1} onClick={onClick} ariaLabel="Assignments" />
      );

      await userEvent.click(screen.getByRole("button"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
