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

    const text = container.querySelector(".welcome-card-text");
    expect(text).toBeInTheDocument();
  });

  it("should render logo image", () => {
    render(<Welcome name="John" />);

    const logo = screen.getByAltText("Ministry Mapper logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass("welcome-image");
  });

  it("should have correct welcome card styling", () => {
    const { container } = render(<Welcome name="John" />);

    const card = container.querySelector(".welcome-card");
    expect(card).toBeInTheDocument();
  });

  it("should display waving hand emoji", () => {
    render(<Welcome name="John" />);

    expect(screen.getByText(/👋/)).toBeInTheDocument();
  });

  it("should render image in container", () => {
    const { container } = render(<Welcome name="John" />);

    const imageContainer = container.querySelector(".welcome-image-container");
    expect(imageContainer).toBeInTheDocument();
  });
});
