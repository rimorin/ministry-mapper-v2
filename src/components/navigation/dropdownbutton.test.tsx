import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenericDropdownButton, GenericDropdownItem } from "./dropdownbutton";

describe("GenericDropdownButton", () => {
  it("renders dropdown button with label", () => {
    render(
      <GenericDropdownButton label="Test Menu">
        <div />
      </GenericDropdownButton>
    );
    expect(
      screen.getByRole("button", { name: /test menu/i })
    ).toBeInTheDocument();
  });

  it("renders children items", async () => {
    const user = userEvent.setup();
    render(
      <GenericDropdownButton label="Menu">
        <GenericDropdownItem>Item 1</GenericDropdownItem>
        <GenericDropdownItem>Item 2</GenericDropdownItem>
      </GenericDropdownButton>
    );

    const button = screen.getByRole("button", { name: /menu/i });
    await user.click(button);

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <GenericDropdownButton label="Menu" className="custom-dropdown">
        <div />
      </GenericDropdownButton>
    );
    const button = screen.getByRole("button", { name: /menu/i });
    expect(button.parentElement).toHaveClass("custom-dropdown");
  });

  it("applies custom variant", () => {
    render(
      <GenericDropdownButton label="Menu" variant="primary">
        <div />
      </GenericDropdownButton>
    );
    const button = screen.getByRole("button", { name: /menu/i });
    expect(button).toHaveClass("btn-primary");
  });

  it("applies custom size", () => {
    render(
      <GenericDropdownButton label="Menu" size="lg">
        <div />
      </GenericDropdownButton>
    );
    const button = screen.getByRole("button", { name: /menu/i });
    expect(button).toHaveClass("btn-lg");
  });

  it("calls onClick when button is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <GenericDropdownButton label="Menu" onClick={handleClick}>
        <div />
      </GenericDropdownButton>
    );

    const button = screen.getByRole("button", { name: /menu/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalled();
  });
});

describe("GenericDropdownItem", () => {
  it("renders dropdown item with children", async () => {
    const user = userEvent.setup();
    render(
      <GenericDropdownButton label="Menu">
        <GenericDropdownItem>Test Item</GenericDropdownItem>
      </GenericDropdownButton>
    );

    const button = screen.getByRole("button", { name: /menu/i });
    await user.click(button);

    expect(screen.getByText("Test Item")).toBeInTheDocument();
  });

  it("calls onClick when item is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <GenericDropdownButton label="Menu">
        <GenericDropdownItem onClick={handleClick}>
          Click Me
        </GenericDropdownItem>
      </GenericDropdownButton>
    );

    const button = screen.getByRole("button", { name: /menu/i });
    await user.click(button);

    const item = screen.getByText("Click Me");
    await user.click(item);

    expect(handleClick).toHaveBeenCalled();
  });
});
