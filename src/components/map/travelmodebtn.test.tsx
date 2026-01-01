import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TravelModeButtons from "./travelmodebtn";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue
  })
}));

describe("TravelModeButtons", () => {
  const mockOnTravelModeChange = vi.fn();

  const defaultProps = {
    travelMode: "WALKING" as const,
    onTravelModeChange: mockOnTravelModeChange,
    isLoading: false
  };

  beforeEach(() => {
    mockOnTravelModeChange.mockClear();
  });

  it("renders without crashing", () => {
    render(<TravelModeButtons {...defaultProps} />);
    expect(screen.getByLabelText("Walk")).toBeInTheDocument();
    expect(screen.getByLabelText("Drive")).toBeInTheDocument();
  });

  it("displays walking mode as active", () => {
    render(<TravelModeButtons {...defaultProps} travelMode="WALKING" />);
    const walkButton = screen.getByLabelText("Walk");
    expect(walkButton).toHaveClass("active");
    expect(walkButton).toHaveAttribute("aria-pressed", "true");
  });

  it("displays driving mode as active", () => {
    render(<TravelModeButtons {...defaultProps} travelMode="DRIVING" />);
    const driveButton = screen.getByLabelText("Drive");
    expect(driveButton).toHaveClass("active");
    expect(driveButton).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onTravelModeChange when walk button is clicked", async () => {
    const user = userEvent.setup();
    render(<TravelModeButtons {...defaultProps} travelMode="DRIVING" />);

    await user.click(screen.getByLabelText("Walk"));
    expect(mockOnTravelModeChange).toHaveBeenCalledWith("WALKING");
  });

  it("calls onTravelModeChange when drive button is clicked", async () => {
    const user = userEvent.setup();
    render(<TravelModeButtons {...defaultProps} travelMode="WALKING" />);

    await user.click(screen.getByLabelText("Drive"));
    expect(mockOnTravelModeChange).toHaveBeenCalledWith("DRIVING");
  });

  it("disables buttons when isLoading is true", () => {
    render(<TravelModeButtons {...defaultProps} isLoading={true} />);
    expect(screen.getByLabelText("Walk")).toBeDisabled();
    expect(screen.getByLabelText("Drive")).toBeDisabled();
  });

  it("shows spinner when loading and mode is active", () => {
    const { container } = render(
      <TravelModeButtons
        {...defaultProps}
        travelMode="WALKING"
        isLoading={true}
      />
    );
    expect(container.querySelector(".spinner-border")).toBeInTheDocument();
  });

  it("renders mode icons", () => {
    render(<TravelModeButtons {...defaultProps} />);
    expect(screen.getByText("🚶")).toBeInTheDocument();
    expect(screen.getByText("🚗")).toBeInTheDocument();
  });

  it("applies correct CSS classes", () => {
    const { container } = render(<TravelModeButtons {...defaultProps} />);
    expect(
      container.querySelector(".travel-mode-button-group")
    ).toBeInTheDocument();
  });
});
