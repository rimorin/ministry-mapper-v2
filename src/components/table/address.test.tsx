import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AddressStatus from "./address";
import { STATUS_CODES } from "../../utils/constants";

describe("AddressStatus", () => {
  it("renders invalid status", () => {
    const { container } = render(
      <AddressStatus status={STATUS_CODES.INVALID} type={[]} />
    );

    expect(container.querySelector(".text-violet-500")).toBeInTheDocument();
  });

  it("renders done status", () => {
    const { container } = render(
      <AddressStatus status={STATUS_CODES.DONE} type={[]} />
    );

    expect(container.querySelector(".text-green-500")).toBeInTheDocument();
  });

  it("renders do not call status", () => {
    const { container } = render(
      <AddressStatus status={STATUS_CODES.DO_NOT_CALL} type={[]} />
    );

    expect(container.querySelector(".text-red-500")).toBeInTheDocument();
  });

  it("renders not home icon when status is not home", () => {
    const { container } = render(
      <AddressStatus status={STATUS_CODES.NOT_HOME} nhcount="3" type={[]} />
    );

    expect(
      container.querySelector(".relative.inline-flex")
    ).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders note icon when note exists", () => {
    const { container } = render(
      <AddressStatus status={STATUS_CODES.DONE} note="Test note" type={[]} />
    );

    expect(container.querySelector(".text-amber-500")).toBeInTheDocument();
  });

  it("renders household type badges", () => {
    const types = [
      { id: "1", code: "CH" },
      { id: "2", code: "EN" }
    ];
    const { container } = render(
      <AddressStatus status={STATUS_CODES.DEFAULT} type={types} />
    );

    expect(container.querySelectorAll("span.min-w-5")).toHaveLength(2);
    expect(screen.getByText("CH")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  it("filters out default option from household types", () => {
    const types = [
      { id: "1", code: "CH" },
      { id: "2", code: "EN" },
      { id: "default", code: "DEFAULT" }
    ];

    render(
      <AddressStatus
        status={STATUS_CODES.DEFAULT}
        type={types}
        defaultOption="default"
      />
    );

    expect(screen.getByText("CH")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.queryByText("DEFAULT")).not.toBeInTheDocument();
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

    expect(container.querySelector("span.min-w-5")).not.toBeInTheDocument();
  });

  it("does not render badge when type is empty", () => {
    const { container } = render(
      <AddressStatus status={STATUS_CODES.DEFAULT} type={[]} />
    );

    expect(container.querySelector("span.min-w-5")).not.toBeInTheDocument();
  });

  it("shows overflow count in badge when types exceed visible limit", () => {
    const types = [
      { id: "1", code: "CH" },
      { id: "2", code: "EN" },
      { id: "3", code: "ML" },
      { id: "4", code: "BD" }
    ];

    render(<AddressStatus status={STATUS_CODES.DEFAULT} type={types} />);

    expect(screen.getByText("CH")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("does not show overflow when types are exactly at visible limit", () => {
    const types = [
      { id: "1", code: "CH" },
      { id: "2", code: "EN" }
    ];

    render(<AddressStatus status={STATUS_CODES.DEFAULT} type={types} />);

    expect(screen.getByText("CH")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
  });

  it("combines multiple status indicators", () => {
    const types = [{ id: "1", code: "CH" }];
    const { container } = render(
      <AddressStatus status={STATUS_CODES.DONE} note="Test note" type={types} />
    );

    expect(container.querySelector(".text-green-500")).toBeInTheDocument();
    expect(container.querySelector(".text-amber-500")).toBeInTheDocument();
    expect(screen.getByText("CH")).toBeInTheDocument();
  });
});
