import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CircularProgress from "./circularprogress";

describe("CircularProgress", () => {
  const defaultProps = {
    size: 100,
    progress: 50,
    strokeWidth: 8,
    highlightColor: "#007bff",
    backgroundColor: "#f0f0f0",
    hasAssignments: false,
    hasPersonal: false,
    isSelected: false
  };

  it("renders without crashing", () => {
    const { container } = render(<CircularProgress {...defaultProps} />);
    expect(
      container.querySelector(".circular-progress-container")
    ).toBeInTheDocument();
  });

  it("renders with correct size", () => {
    const { container } = render(
      <CircularProgress {...defaultProps} size={120} />
    );
    const containerDiv = container.querySelector(
      ".circular-progress-container"
    );
    expect(containerDiv).toHaveStyle({ width: "120px", height: "120px" });
  });

  it("renders with background color", () => {
    const { container } = render(
      <CircularProgress {...defaultProps} backgroundColor="#ff0000" />
    );
    const containerDiv = container.querySelector(
      ".circular-progress-container"
    );
    expect(containerDiv).toHaveStyle({ backgroundColor: "#ff0000" });
  });

  it("renders children content", () => {
    render(
      <CircularProgress {...defaultProps}>
        <span>42</span>
      </CircularProgress>
    );
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows selected ring when isSelected is true", () => {
    const { container } = render(
      <CircularProgress {...defaultProps} isSelected={true} />
    );
    expect(
      container.querySelector(".selected-marker-ring")
    ).toBeInTheDocument();
  });

  it("does not show selected ring when isSelected is false", () => {
    const { container } = render(
      <CircularProgress {...defaultProps} isSelected={false} />
    );
    expect(
      container.querySelector(".selected-marker-ring")
    ).not.toBeInTheDocument();
  });

  it("shows assignments indicator when hasAssignments is true", () => {
    const { container } = render(
      <CircularProgress {...defaultProps} hasAssignments={true} />
    );
    expect(
      container.querySelector(".circular-progress-assignments")
    ).toBeInTheDocument();
  });

  it("shows personal indicator when hasPersonal is true", () => {
    const { container } = render(
      <CircularProgress {...defaultProps} hasPersonal={true} />
    );
    expect(
      container.querySelector(".circular-progress-personal")
    ).toBeInTheDocument();
  });

  it("calculates progress correctly", () => {
    const { container } = render(
      <CircularProgress {...defaultProps} progress={75} />
    );
    const progressCircle = container.querySelector(
      ".circular-progress-highlight"
    );
    expect(progressCircle).toBeInTheDocument();
  });

  it("renders SVG with correct dimensions", () => {
    const { container } = render(
      <CircularProgress {...defaultProps} size={150} />
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "150");
    expect(svg).toHaveAttribute("height", "150");
  });
});
