import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import Loader from "./loader";

describe("Loader", () => {
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
