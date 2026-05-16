import { describe, it, expect } from "vitest";
import { render, screen } from "../../utils/test";
import ModeToggle from "./maptoggle";

describe("ModeToggle", () => {
  it("should render list icon when in map view", () => {
    render(<ModeToggle isMapView={true} />);
    const icon = screen.getByLabelText(/list view/i);
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("lucide-list");
  });

  it("should render map icon when in list view", () => {
    render(<ModeToggle isMapView={false} />);
    const icon = screen.getByLabelText(/map view/i);
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("lucide-navigation");
  });

  it("should have correct dimensions", () => {
    render(<ModeToggle isMapView={true} />);
    const icon = screen.getByLabelText(/list view/i);
    expect(icon).toHaveAttribute("width", "24");
    expect(icon).toHaveAttribute("height", "24");
  });

  it("should toggle between icons based on isMapView prop", () => {
    const { rerender } = render(<ModeToggle isMapView={true} />);
    expect(screen.getByLabelText(/list view/i)).toBeInTheDocument();

    rerender(<ModeToggle isMapView={false} />);
    expect(screen.getByLabelText(/map view/i)).toBeInTheDocument();
  });
});
