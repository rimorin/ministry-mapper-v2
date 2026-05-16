import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import Welcome from "./welcome";

describe("Welcome", () => {
  it("should render welcome message with user name", () => {
    render(<Welcome name="John" />);

    expect(screen.getByText(/Welcome John!/i)).toBeInTheDocument();
  });

  it("should render default welcome when no name provided", () => {
    render(<Welcome name="" />);

    expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
  });

  it("should display territory selection message", () => {
    const { container } = render(<Welcome name="John" />);

    expect(
      container.querySelector("p.text-muted-foreground")
    ).toBeInTheDocument();
  });

  it("should display waving hand emoji", () => {
    render(<Welcome name="John" />);

    expect(screen.getByText(/👋/)).toBeInTheDocument();
  });

  it("should render the logo", () => {
    render(<Welcome name="John" />);

    expect(screen.getByAltText(/Ministry Mapper logo/i)).toBeInTheDocument();
  });
});
