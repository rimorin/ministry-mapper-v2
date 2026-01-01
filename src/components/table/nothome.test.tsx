import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import NotHomeIcon from "./nothome";

describe("NotHomeIcon", () => {
  it("renders without badge when nhcount is not provided", () => {
    const { container } = render(<NotHomeIcon />);

    const envelope = container.querySelector(".nothome-envelope");
    expect(envelope).toBeInTheDocument();

    const badge = container.querySelector(".badge-nothome");
    expect(badge).not.toBeInTheDocument();
  });

  it("renders with badge when nhcount is provided", () => {
    const { container } = render(<NotHomeIcon nhcount="3" />);

    const badge = container.querySelector(".badge-nothome");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("3");
  });

  it("applies default parent class", () => {
    const { container } = render(<NotHomeIcon />);

    const parent = container.querySelector(".parent-nothome");
    expect(parent).toBeInTheDocument();
  });

  it("applies custom class when provided", () => {
    const { container } = render(<NotHomeIcon classProp="custom-class" />);

    const parent = container.querySelector(".parent-nothome");
    expect(parent).toHaveClass("parent-nothome", "custom-class");
  });

  it("renders envelope image with correct src", () => {
    const { container } = render(<NotHomeIcon />);

    const envelope = container.querySelector(
      ".nothome-envelope"
    ) as HTMLImageElement;
    expect(envelope).toBeInTheDocument();
    expect(envelope?.src).toContain("envelope.svg");
  });
});
