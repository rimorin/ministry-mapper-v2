import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ErrorBoundaryFallback from "./errorboundary";

describe("ErrorBoundaryFallback", () => {
  const mockError = new Error("Test error message");
  const mockReset = vi.fn();

  it("renders error title", () => {
    render(
      <ErrorBoundaryFallback error={mockError} resetErrorBoundary={mockReset} />
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("renders error description", () => {
    render(
      <ErrorBoundaryFallback error={mockError} resetErrorBoundary={mockReset} />
    );

    expect(screen.getByText(/we encountered an error/i)).toBeInTheDocument();
  });

  it("calls resetErrorBoundary when retry button clicked", async () => {
    const user = userEvent.setup();
    render(
      <ErrorBoundaryFallback error={mockError} resetErrorBoundary={mockReset} />
    );

    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("shows component name when provided", () => {
    const originalMode = import.meta.env.MODE;
    import.meta.env.MODE = "development";

    render(
      <ErrorBoundaryFallback
        error={mockError}
        resetErrorBoundary={mockReset}
        componentName="TestComponent"
      />
    );

    expect(screen.getByText(/TestComponent/)).toBeInTheDocument();

    import.meta.env.MODE = originalMode;
  });

  it("renders go to home button", () => {
    render(
      <ErrorBoundaryFallback error={mockError} resetErrorBoundary={mockReset} />
    );

    expect(
      screen.getByRole("button", { name: /go to home/i })
    ).toBeInTheDocument();
  });
});
