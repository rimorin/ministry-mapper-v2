import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import Divider from "./divider";

describe("Divider", () => {
  describe("rendering", () => {
    it("should render divider with text", () => {
      render(<Divider text="OR" />);

      expect(screen.getByText("OR")).toBeInTheDocument();
    });

    it("should render with custom text", () => {
      render(<Divider text="Continue with" />);

      expect(screen.getByText("Continue with")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should have proper flex layout", () => {
      const { container } = render(<Divider text="TEST" />);

      expect(container.firstElementChild).toHaveClass(
        "flex",
        "items-center",
        "gap-3",
        "my-2"
      );
    });

    it("should have muted text", () => {
      const { container } = render(<Divider text="TEST" />);

      const text = container.querySelector(".text-xs.text-muted-foreground");
      expect(text).toBeInTheDocument();
      expect(text).toHaveTextContent("TEST");
    });

    it("should have small text size", () => {
      const { container } = render(<Divider text="TEST" />);

      expect(container.querySelector(".text-xs")).toBeInTheDocument();
    });

    it("should render border lines on both sides", () => {
      const { container } = render(<Divider text="TEST" />);

      expect(container.querySelectorAll(".flex-1.h-px.bg-border")).toHaveLength(
        2
      );
    });

    it("should have proper spacing", () => {
      const { container } = render(<Divider text="TEST" />);

      expect(container.firstElementChild).toHaveClass("my-2", "gap-3");
    });
  });

  describe("line elements", () => {
    it("should use flex-1 on both divider lines", () => {
      const { container } = render(<Divider text="TEST" />);

      expect(container.querySelectorAll(".flex-1.bg-border")).toHaveLength(2);
    });
  });
});
