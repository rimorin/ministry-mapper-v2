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

      const divider = container.querySelector(".d-flex");
      expect(divider).toBeInTheDocument();
      expect(divider).toHaveClass("align-items-center");
    });

    it("should have muted text", () => {
      const { container } = render(<Divider text="TEST" />);

      const text = container.querySelector(".text-muted");
      expect(text).toBeInTheDocument();
      expect(text).toHaveTextContent("TEST");
    });

    it("should have small text size", () => {
      const { container } = render(<Divider text="TEST" />);

      const text = container.querySelector(".small");
      expect(text).toBeInTheDocument();
    });

    it("should have horizontal rules on both sides", () => {
      const { container } = render(<Divider text="TEST" />);

      const hrs = container.querySelectorAll("hr");
      expect(hrs).toHaveLength(2);
    });

    it("should have proper spacing", () => {
      const { container } = render(<Divider text="TEST" />);

      const wrapper = container.querySelector(".my-3");
      expect(wrapper).toBeInTheDocument();

      const text = container.querySelector(".px-3");
      expect(text).toBeInTheDocument();
    });
  });

  describe("hr elements", () => {
    it("should have flex-grow-1 class on hr elements", () => {
      const { container } = render(<Divider text="TEST" />);

      const hrs = container.querySelectorAll("hr.flex-grow-1");
      expect(hrs).toHaveLength(2);
    });
  });
});
