import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import InvalidPage from "./invalidpage";

describe("InvalidPage", () => {
  it("should render the invalid page component", () => {
    render(<InvalidPage />);

    expect(screen.getByText(/This link has expired/i)).toBeInTheDocument();
  });

  it("should display the hourglass emoji", () => {
    render(<InvalidPage />);

    expect(screen.getByText(/⌛/)).toBeInTheDocument();
  });

  it("should render StaticPageCard with correct title", () => {
    render(<InvalidPage />);

    const title = screen.getByText(/This link has expired/i);
    expect(title).toHaveAttribute("data-slot", "card-title");
  });
});
