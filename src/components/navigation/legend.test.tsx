import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Legend from "./legend";

describe("Legend", () => {
  const mockHideFunction = vi.fn();

  afterEach(() => {
    mockHideFunction.mockClear();
  });

  it("should render when showLegend is true", () => {
    render(<Legend showLegend={true} hideFunction={mockHideFunction} />);
    expect(screen.getByText(/navigation.legend/i)).toBeInTheDocument();
  });

  it("should not render when showLegend is false", () => {
    render(<Legend showLegend={false} hideFunction={mockHideFunction} />);
    expect(screen.queryByText(/navigation.legend/i)).not.toBeInTheDocument();
  });

  it("should display legend table with correct symbols", () => {
    render(<Legend showLegend={true} hideFunction={mockHideFunction} />);
    expect(screen.getByText("✅")).toBeInTheDocument();
    expect(screen.getByText("🚫")).toBeInTheDocument();
  });

  it("should display legend descriptions", () => {
    render(<Legend showLegend={true} hideFunction={mockHideFunction} />);
    expect(screen.getByText(/address.done/i)).toBeInTheDocument();
    expect(screen.getByText(/address.doNotCall/i)).toBeInTheDocument();
    expect(screen.getByText(/address.notHome/i)).toBeInTheDocument();
  });

  it("should call hideFunction when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<Legend showLegend={true} hideFunction={mockHideFunction} />);

    const closeButton = screen.getByRole("button");
    await user.click(closeButton);

    expect(mockHideFunction).toHaveBeenCalledTimes(1);
  });

  it("should have table headers", () => {
    render(<Legend showLegend={true} hideFunction={mockHideFunction} />);
    expect(screen.getByText(/common.symbol/i)).toBeInTheDocument();
    expect(screen.getByText(/common.description/i)).toBeInTheDocument();
  });
});
