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
    const { container } = render(<InvalidPage />);

    const title = container.querySelector(".card-title");
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toMatch(/This link has expired/i);
  });
});
