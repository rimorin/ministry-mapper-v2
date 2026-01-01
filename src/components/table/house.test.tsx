import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HouseStatus from "./house";
import { STATUS_CODES } from "../../utils/constants";

describe("HouseStatus", () => {
  it("renders invalid status icon", () => {
    render(<HouseStatus status={STATUS_CODES.INVALID} type={[]} />);
    expect(screen.getByText("✖️")).toBeInTheDocument();
  });

  it("renders done status icon", () => {
    render(<HouseStatus status={STATUS_CODES.DONE} type={[]} />);
    expect(screen.getByText("✅")).toBeInTheDocument();
  });

  it("renders do not call status icon", () => {
    render(<HouseStatus status={STATUS_CODES.DO_NOT_CALL} type={[]} />);
    expect(screen.getByText("🚫")).toBeInTheDocument();
  });

  it("renders not home count when status is not home", () => {
    render(
      <HouseStatus status={STATUS_CODES.NOT_HOME} nhcount="5" type={[]} />
    );
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders empty for default status", () => {
    const { container } = render(
      <HouseStatus status={STATUS_CODES.DEFAULT} type={[]} />
    );
    expect(container.textContent).toBe("");
  });

  it("renders empty for unknown status", () => {
    const { container } = render(<HouseStatus status="unknown" type={[]} />);
    expect(container.textContent).toBe("");
  });
});
