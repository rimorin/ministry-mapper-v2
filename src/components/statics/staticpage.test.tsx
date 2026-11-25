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

    expect(
      screen.getByRole("img", { name: "Ministry Mapper logo" })
    ).toBeInTheDocument();
  });

  it("should hide logo when showLogo is false", () => {
    render(<StaticPageCard showLogo={false} />);

    expect(
      screen.queryByRole("img", { name: "Ministry Mapper logo" })
    ).not.toBeInTheDocument();
  });

  it("should apply custom card class", () => {
    const { container } = render(
      <StaticPageCard cardClassName="custom-card" />
    );

    const card = container.querySelector(".custom-card");
    expect(card).toBeInTheDocument();
  });

  it("should render logo with correct Tailwind classes", () => {
    render(<StaticPageCard />);

    const logo = screen.getByRole("img", { name: "Ministry Mapper logo" });
    expect(logo).toHaveClass("mx-auto", "w-[30%]");
  });
});
