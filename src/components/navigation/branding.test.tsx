import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NavBarBranding from "./branding";

vi.mock("../../utils/helpers/assetpath", () => ({
  getAssetUrl: vi.fn((path: string) => `/assets/${path}`)
}));

describe("NavBarBranding", () => {
  it("should render logo image", () => {
    render(<NavBarBranding />);
    const logo = screen.getByRole("img", { name: /ministry mapper logo/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/assets/favicon-32x32.png");
    expect(logo).toHaveAttribute("width", "32");
    expect(logo).toHaveAttribute("height", "32");
  });

  it("should render naming text when provided", () => {
    render(<NavBarBranding naming="Test App" />);
    expect(screen.getByText("Test App")).toBeInTheDocument();
  });

  it("should not render naming text when not provided", () => {
    const { container } = render(<NavBarBranding />);
    const navbarText = container.querySelector(".fluid-bolding");
    expect(navbarText).not.toBeInTheDocument();
  });

  it("should have correct styling classes", () => {
    const { container } = render(<NavBarBranding naming="Test" />);
    const brand = container.querySelector(".brand-wrap");
    expect(brand).toHaveClass("d-flex", "align-items-center");
  });
});
