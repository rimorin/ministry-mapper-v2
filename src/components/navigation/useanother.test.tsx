import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UseAnotherButton from "./useanother";

describe("UseAnotherButton", () => {
  it("renders use another account button", () => {
    render(<UseAnotherButton handleClick={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /use another account/i })
    ).toBeInTheDocument();
  });

  it("calls handleClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<UseAnotherButton handleClick={handleClick} />);

    const button = screen.getByRole("button", { name: /use another account/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders with secondary variant", () => {
    render(<UseAnotherButton handleClick={vi.fn()} />);
    const button = screen.getByRole("button", { name: /use another account/i });
    expect(button).toHaveClass("btn-secondary");
  });
});
