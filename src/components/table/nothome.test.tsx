import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotHomeIcon from "./nothome";

describe("NotHomeIcon", () => {
  it("renders without badge when nhcount is not provided", () => {
    const { container } = render(<NotHomeIcon />);

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("renders with badge when nhcount is provided", () => {
    render(<NotHomeIcon nhcount="3" />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("applies default parent class", () => {
    const { container } = render(<NotHomeIcon />);

    expect(
      container.querySelector("span.relative.inline-flex")
    ).toBeInTheDocument();
  });

  it("applies custom class when provided", () => {
    const { container } = render(<NotHomeIcon iconClassName="size-6" />);

    expect(container.querySelector("svg.size-6")).toBeInTheDocument();
  });

  it("renders envelope icon with amber styling", () => {
    const { container } = render(<NotHomeIcon />);

    expect(container.querySelector("svg.text-amber-500")).toBeInTheDocument();
  });
});
