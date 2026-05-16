import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import AggregationBadge from "./aggrbadge";

describe("AggregationBadge", () => {
  describe("color variants based on percentage", () => {
    it("should show success (green) for 0-70%", () => {
      render(<AggregationBadge aggregate={50} />);

      const badge = screen.getByText("50%");
      expect(badge).toHaveAttribute("data-slot", "badge");
      expect(badge).toHaveClass("bg-green-600", "text-white");
    });

    it("should show success for exactly 70%", () => {
      render(<AggregationBadge aggregate={70} />);

      expect(screen.getByText("70%")).toHaveClass("bg-green-600", "text-white");
    });

    it("should show warning (yellow) for 71-90%", () => {
      render(<AggregationBadge aggregate={80} />);

      const badge = screen.getByText("80%");
      expect(badge).toHaveClass("bg-yellow-500", "text-black");
    });

    it("should show warning for exactly 90%", () => {
      render(<AggregationBadge aggregate={90} />);

      expect(screen.getByText("90%")).toHaveClass(
        "bg-yellow-500",
        "text-black"
      );
    });

    it("should show danger (red) for 91-100%", () => {
      render(<AggregationBadge aggregate={95} />);

      const badge = screen.getByText("95%");
      expect(badge).toHaveClass("bg-destructive", "text-white");
    });

    it("should show danger for 100%", () => {
      render(<AggregationBadge aggregate={100} />);

      expect(screen.getByText("100%")).toHaveClass(
        "bg-destructive",
        "text-white"
      );
    });
  });

  describe("text styling", () => {
    it("should have dark text for warning badges", () => {
      render(<AggregationBadge aggregate={85} />);

      expect(screen.getByText("85%")).toHaveClass("text-black");
    });

    it("should not have dark text for success badges", () => {
      render(<AggregationBadge aggregate={50} />);

      expect(screen.getByText("50%")).not.toHaveClass("text-black");
    });

    it("should not have dark text for danger badges", () => {
      render(<AggregationBadge aggregate={95} />);

      expect(screen.getByText("95%")).not.toHaveClass("text-black");
    });
  });

  describe("badge styling", () => {
    it("should render as pill badge", () => {
      render(<AggregationBadge aggregate={50} />);

      expect(screen.getByText("50%")).toHaveClass("rounded-full");
    });

    it("should use default width of 3rem", () => {
      render(<AggregationBadge aggregate={50} />);

      expect(screen.getByText("50%")).toHaveStyle({ width: "3rem" });
    });

    it("should use custom width when provided", () => {
      render(<AggregationBadge aggregate={50} width="3rem" />);

      expect(screen.getByText("50%")).toHaveStyle({ width: "3rem" });
    });

    it("should have margin around badge", () => {
      render(<AggregationBadge aggregate={50} />);

      expect(screen.getByText("50%").parentElement).toHaveClass(
        "mx-1",
        "shrink-0"
      );
    });
  });

  describe("default values", () => {
    it("should display 0% when no aggregate provided", () => {
      render(<AggregationBadge />);

      expect(screen.getByText("0%")).toHaveClass("bg-green-600");
    });
  });

  describe("edge cases", () => {
    it("should handle edge case at 71%", () => {
      render(<AggregationBadge aggregate={71} />);

      expect(screen.getByText("71%")).toHaveClass("bg-yellow-500");
    });

    it("should handle edge case at 91%", () => {
      render(<AggregationBadge aggregate={91} />);

      expect(screen.getByText("91%")).toHaveClass("bg-destructive");
    });
  });
});
