import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import HHNotHomeField from "./nothome";
import { NOT_HOME_STATUS_CODES } from "../../utils/constants";

describe("HHNotHomeField", () => {
  const defaultProps = {
    handleGroupChange: vi.fn(),
    changeValue: NOT_HOME_STATUS_CODES.DEFAULT
  };

  it("renders the label and all try buttons", () => {
    render(<HHNotHomeField {...defaultProps} />);

    expect(screen.getByText(/Number of tries/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1st" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2nd" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3rd" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "4th" })).toBeInTheDocument();
  });

  it("marks the active try as pressed", () => {
    render(
      <HHNotHomeField
        {...defaultProps}
        changeValue={NOT_HOME_STATUS_CODES.THIRD_TRY}
      />
    );

    expect(screen.getByRole("button", { name: "3rd" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "1st" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("calls handleGroupChange with the selected try", async () => {
    const handleGroupChange = vi.fn();
    const user = userEvent.setup();

    render(
      <HHNotHomeField {...defaultProps} handleGroupChange={handleGroupChange} />
    );

    await user.click(screen.getByRole("button", { name: "2nd" }));

    expect(handleGroupChange).toHaveBeenCalledWith(
      NOT_HOME_STATUS_CODES.SECOND_TRY
    );
  });

  it("renders as a stacked label and full-width toggle group", () => {
    const { container } = render(<HHNotHomeField {...defaultProps} />);

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
