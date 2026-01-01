import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ModeToggle from "./maptoggle";

vi.mock("../../utils/helpers/assetpath", () => ({
  getAssetUrl: vi.fn((path: string) => `/assets/${path}`)
}));

describe("ModeToggle", () => {
  it("should render list icon when in map view", () => {
    render(<ModeToggle isMapView={true} />);
    const icon = screen.getByRole("img", { name: /list view/i });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("src", "/assets/list.svg");
  });

  it("should render map icon when in list view", () => {
    render(<ModeToggle isMapView={false} />);
    const icon = screen.getByRole("img", { name: /map view/i });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("src", "/assets/maplocation.svg");
  });

  it("should have correct dimensions", () => {
    render(<ModeToggle isMapView={true} />);
    const icon = screen.getByRole("img");
    expect(icon).toHaveAttribute("width", "24");
    expect(icon).toHaveAttribute("height", "24");
  });

  it("should toggle between icons based on isMapView prop", () => {
    const { rerender } = render(<ModeToggle isMapView={true} />);
    expect(screen.getByRole("img", { name: /list view/i })).toBeInTheDocument();

    rerender(<ModeToggle isMapView={false} />);
    expect(screen.getByRole("img", { name: /map view/i })).toBeInTheDocument();
  });
});
