import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import Loader from "./loader";

describe("Loader", () => {
  it("should render a loading progress bar", () => {
    const progressbar = render(<Loader />).getByRole("progressbar", {
      name: "Loading"
    });

    expect(progressbar).toBeInTheDocument();
  });

  it("should expose its loading label through aria-label", () => {
    render(<Loader />);

    expect(
      screen.getByRole("progressbar", { name: "Loading" })
    ).toBeInTheDocument();
  });

  it("should render the shimmer animation element", () => {
    const { container } = render(<Loader />);

    expect(
      container.querySelector('[role="progressbar"] > div')
    ).toBeInTheDocument();
  });

  it("should not render visible loading text", () => {
    render(<Loader />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
