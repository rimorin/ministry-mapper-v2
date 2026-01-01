import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import Loader from "./loader";

describe("Loader", () => {
  describe("default loading state", () => {
    it("should render loading overlay with spinner", () => {
      const { container } = render(<Loader />);

      const overlay = container.querySelector(".loading-overlay");
      expect(overlay).toBeInTheDocument();

      const spinner = container.querySelector(".loading-spinner");
      expect(spinner).toBeInTheDocument();
    });

    it("should display loading text", () => {
      render(<Loader />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should use border animation spinner", () => {
      const { container } = render(<Loader />);

      const spinner = container.querySelector(".spinner-border");
      expect(spinner).toBeInTheDocument();
    });

    it("should use primary variant", () => {
      const { container } = render(<Loader />);

      const spinner = container.querySelector(".text-primary");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("suspended state", () => {
    it("should render suspense loader when suspended is true", () => {
      const { container } = render(<Loader suspended={true} />);

      const suspenseLoader = container.querySelector(".suspense-loader");
      expect(suspenseLoader).toBeInTheDocument();
    });

    it("should not show loading text when suspended", () => {
      render(<Loader suspended={true} />);

      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    it("should not render loading overlay when suspended", () => {
      const { container } = render(<Loader suspended={true} />);

      const overlay = container.querySelector(".loading-overlay");
      expect(overlay).not.toBeInTheDocument();
    });

    it("should still render spinner when suspended", () => {
      const { container } = render(<Loader suspended={true} />);

      const spinner = container.querySelector(".spinner-border");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have spinner elements", () => {
      const { container } = render(<Loader />);

      const spinner = container.querySelector(".spinner-border");
      expect(spinner).toBeInTheDocument();
    });
  });
});
