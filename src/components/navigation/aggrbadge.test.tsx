import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import AggregationBadge from "./aggrbadge";

describe("AggregationBadge", () => {
  describe("color variants based on percentage", () => {
    it("should show success (green) for 0-70%", () => {
      const { container } = render(<AggregationBadge aggregate={50} />);

      const badge = container.querySelector(".bg-success");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("50%");
    });

    it("should show success for exactly 70%", () => {
      const { container } = render(<AggregationBadge aggregate={70} />);

      const badge = container.querySelector(".bg-success");
      expect(badge).toBeInTheDocument();
    });

    it("should show warning (yellow) for 71-90%", () => {
      const { container } = render(<AggregationBadge aggregate={80} />);

      const badge = container.querySelector(".bg-warning");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("80%");
    });

    it("should show warning for exactly 90%", () => {
      const { container } = render(<AggregationBadge aggregate={90} />);

      const badge = container.querySelector(".bg-warning");
      expect(badge).toBeInTheDocument();
    });

    it("should show danger (red) for 91-100%", () => {
      const { container } = render(<AggregationBadge aggregate={95} />);

      const badge = container.querySelector(".bg-danger");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("95%");
    });

    it("should show danger for 100%", () => {
      const { container } = render(<AggregationBadge aggregate={100} />);

      const badge = container.querySelector(".bg-danger");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("100%");
    });
  });

  describe("text styling", () => {
    it("should have dark text for warning badges", () => {
      const { container } = render(<AggregationBadge aggregate={85} />);

      const badge = container.querySelector(".aggregate-dark-text");
      expect(badge).toBeInTheDocument();
    });

    it("should not have dark text for success badges", () => {
      const { container } = render(<AggregationBadge aggregate={50} />);

      const badge = container.querySelector(".aggregate-dark-text");
      expect(badge).not.toBeInTheDocument();
    });

    it("should not have dark text for danger badges", () => {
      const { container } = render(<AggregationBadge aggregate={95} />);

      const badge = container.querySelector(".aggregate-dark-text");
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe("badge styling", () => {
    it("should render as pill badge", () => {
      const { container } = render(<AggregationBadge aggregate={50} />);

      const badge = container.querySelector(".rounded-pill");
      expect(badge).toBeInTheDocument();
    });

    it("should use default width of 2.5rem", () => {
      const { container } = render(<AggregationBadge aggregate={50} />);

      const badge = container.querySelector(".badge");
      expect(badge).toHaveStyle({ width: "2.5rem" });
    });

    it("should use custom width when provided", () => {
      const { container } = render(
        <AggregationBadge aggregate={50} width="3rem" />
      );

      const badge = container.querySelector(".badge");
      expect(badge).toHaveStyle({ width: "3rem" });
    });

    it("should have margin around badge", () => {
      const { container } = render(<AggregationBadge aggregate={50} />);

      const wrapper = container.querySelector('[style*="margin"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("default values", () => {
    it("should display 0% when no aggregate provided", () => {
      const { container } = render(<AggregationBadge />);

      expect(screen.getByText("0%")).toBeInTheDocument();
      const badge = container.querySelector(".bg-success");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should handle edge case at 71%", () => {
      const { container } = render(<AggregationBadge aggregate={71} />);

      const badge = container.querySelector(".bg-warning");
      expect(badge).toBeInTheDocument();
    });

    it("should handle edge case at 91%", () => {
      const { container } = render(<AggregationBadge aggregate={91} />);

      const badge = container.querySelector(".bg-danger");
      expect(badge).toBeInTheDocument();
    });
  });
});
