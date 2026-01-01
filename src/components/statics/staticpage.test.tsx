import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import StaticPageCard from "./staticpage";

describe("StaticPageCard", () => {
  it("should render with default props", () => {
    const { container } = render(<StaticPageCard />);

    const card = container.querySelector(".card-main");
    expect(card).toBeInTheDocument();
  });

  it("should render title when provided", () => {
    render(<StaticPageCard title="Test Title" />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("should render children content", () => {
    render(
      <StaticPageCard>
        <p>Test content</p>
      </StaticPageCard>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should show logo by default", () => {
    render(<StaticPageCard />);

    const logo = screen.getByAltText(/Ministry Mapper logo/i);
    expect(logo).toBeInTheDocument();
  });

  it("should hide logo when showLogo is false", () => {
    render(<StaticPageCard showLogo={false} />);

    const logo = screen.queryByAltText(/Ministry Mapper logo/i);
    expect(logo).not.toBeInTheDocument();
  });

  it("should use custom logo alt text", () => {
    render(<StaticPageCard logoAlt="Custom Logo" />);

    expect(screen.getByAltText("Custom Logo")).toBeInTheDocument();
  });

  it("should use custom logo source", () => {
    render(<StaticPageCard logoSrc="custom-logo.png" />);

    const logo = screen.getByAltText(/Ministry Mapper logo/i);
    expect(logo).toHaveAttribute(
      "src",
      expect.stringContaining("custom-logo.png")
    );
  });

  it("should apply custom card class", () => {
    const { container } = render(
      <StaticPageCard cardClassName="custom-card" />
    );

    const card = container.querySelector(".custom-card");
    expect(card).toBeInTheDocument();
  });

  it("should render logo with correct CSS class", () => {
    render(<StaticPageCard />);

    const logo = screen.getByAltText(/Ministry Mapper logo/i);
    expect(logo).toHaveClass("mm-logo");
  });
});
