import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AddressStatus from "./address";
import { STATUS_CODES } from "../../utils/constants";

describe("AddressStatus", () => {
  it("renders invalid status", () => {
    render(<AddressStatus status={STATUS_CODES.INVALID} type={[]} />);
    expect(screen.getByText("✖️")).toBeInTheDocument();
  });

  it("renders done status", () => {
    render(<AddressStatus status={STATUS_CODES.DONE} type={[]} />);
    expect(screen.getByText("✅")).toBeInTheDocument();
  });

  it("renders do not call status", () => {
    render(<AddressStatus status={STATUS_CODES.DO_NOT_CALL} type={[]} />);
    expect(screen.getByText("🚫")).toBeInTheDocument();
  });

  it("renders not home icon when status is not home", () => {
    const { container } = render(
      <AddressStatus status={STATUS_CODES.NOT_HOME} nhcount="3" type={[]} />
    );

    const nothomeIcon = container.querySelector(".parent-nothome");
    expect(nothomeIcon).toBeInTheDocument();
  });

  it("renders note icon when note exists", () => {
    const { container } = render(
      <AddressStatus status={STATUS_CODES.DONE} note="Test note" type={[]} />
    );
    expect(container.textContent).toContain("🗒️");
  });

  it("renders household type badges", () => {
    const types = [
      { id: "1", code: "CH" },
      { id: "2", code: "EN" }
    ];
    const { container } = render(
      <AddressStatus status={STATUS_CODES.DEFAULT} type={types} />
    );

    const badge = container.querySelector(".badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("CH, EN");
  });

  it("filters out default option from household types", () => {
    const types = [
      { id: "1", code: "CH" },
      { id: "2", code: "EN" },
      { id: "default", code: "DEFAULT" }
    ];
    const { container } = render(
      <AddressStatus
        status={STATUS_CODES.DEFAULT}
        type={types}
        defaultOption="default"
      />
    );

    const badge = container.querySelector(".badge");
    expect(badge).toHaveTextContent("CH, EN");
    expect(badge).not.toHaveTextContent("DEFAULT");
  });

  it("does not render badge when only default option exists", () => {
    const types = [{ id: "default", code: "DEFAULT" }];
    const { container } = render(
      <AddressStatus
        status={STATUS_CODES.DEFAULT}
        type={types}
        defaultOption="default"
      />
    );

    const badge = container.querySelector(".badge");
    expect(badge).not.toBeInTheDocument();
  });

  it("does not render badge when type is empty", () => {
    const { container } = render(
      <AddressStatus status={STATUS_CODES.DEFAULT} type={[]} />
    );

    const badge = container.querySelector(".badge");
    expect(badge).not.toBeInTheDocument();
  });

  it("combines multiple status indicators", () => {
    const types = [{ id: "1", code: "CH" }];
    const { container } = render(
      <AddressStatus status={STATUS_CODES.DONE} note="Test note" type={types} />
    );

    expect(container.textContent).toContain("✅");
    expect(container.textContent).toContain("🗒️");
    expect(screen.getByText("CH")).toBeInTheDocument();
  });
});
