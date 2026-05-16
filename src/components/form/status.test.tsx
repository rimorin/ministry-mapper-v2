import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import HHStatusField from "./status";
import { STATUS_CODES } from "../../utils/constants";

describe("HHStatusField", () => {
  const defaultProps = {
    handleGroupChange: vi.fn(),
    changeValue: STATUS_CODES.DEFAULT
  };

  it("renders all status buttons", () => {
    render(<HHStatusField {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Not Done" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Not Home" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DNC" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invalid" })).toBeInTheDocument();
  });

  it("marks the active status as pressed", () => {
    render(
      <HHStatusField {...defaultProps} changeValue={STATUS_CODES.DO_NOT_CALL} />
    );

    expect(screen.getByRole("button", { name: "DNC" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Done" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("calls handleGroupChange with the selected status", async () => {
    const handleGroupChange = vi.fn();
    const user = userEvent.setup();

    render(
      <HHStatusField {...defaultProps} handleGroupChange={handleGroupChange} />
    );

    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(handleGroupChange).toHaveBeenCalledWith(STATUS_CODES.DONE);
  });

  it("renders as a stacked label and full-width toggle group", () => {
    const { container } = render(<HHStatusField {...defaultProps} />);

    expect(container.firstElementChild).toHaveClass(
      "flex",
      "flex-col",
      "gap-1.5"
    );
    expect(container.querySelector('[data-slot="toggle-group"]')).toHaveClass(
      "flex",
      "w-full"
    );
  });
});
