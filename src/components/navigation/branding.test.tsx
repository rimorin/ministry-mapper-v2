import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NavBarBranding from "./branding";

describe("NavBarBranding", () => {
  it("draws the logo, with its tile taking the theme's colour", () => {
    render(<NavBarBranding />);
    const logo = screen.getByRole("img", { name: /ministry mapper logo/i });
    expect(logo).toHaveClass("size-8");
    expect(logo).toHaveClass("bg-(--logo-tile)");
  });

  it("should render naming text when provided", () => {
    render(<NavBarBranding naming="Test App" />);
    expect(screen.getByText("Test App")).toBeInTheDocument();
  });

  it("should not render naming text when not provided", () => {
    const { container } = render(<NavBarBranding />);
    const navbarText = container.querySelector(".font-bold");
    expect(navbarText).not.toBeInTheDocument();
  });

  it("should have correct styling classes", () => {
    const { container } = render(<NavBarBranding naming="Test" />);
    const brand = container.querySelector(".brand-wrap");
    expect(brand).toHaveClass("flex", "items-center");
  });
});
