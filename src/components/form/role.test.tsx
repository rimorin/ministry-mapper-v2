import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import UserRoleField from "./role";
import { USER_ACCESS_LEVELS } from "../../utils/constants";

describe("UserRoleField", () => {
  const defaultProps = {
    handleRoleChange: vi.fn(),
    role: USER_ACCESS_LEVELS.CONDUCTOR.CODE
  };

  it("renders all role buttons in update mode", () => {
    render(<UserRoleField {...defaultProps} isUpdate={true} />);

    expect(
      screen.getByRole("button", { name: "No Access" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Read-only" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Conductor" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
  });

  it("omits No Access in create mode", () => {
    render(<UserRoleField {...defaultProps} isUpdate={false} />);

    expect(
      screen.queryByRole("button", { name: "No Access" })
    ).not.toBeInTheDocument();
  });

  it("marks the active role as pressed", () => {
    render(
      <UserRoleField
        {...defaultProps}
        role={USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE}
      />
    );

    expect(screen.getByRole("button", { name: "Admin" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Conductor" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("calls handleRoleChange with the selected role", async () => {
    const handleRoleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <UserRoleField {...defaultProps} handleRoleChange={handleRoleChange} />
    );

    await user.click(screen.getByRole("button", { name: "Read-only" }));

    expect(handleRoleChange).toHaveBeenCalledWith(
      USER_ACCESS_LEVELS.READ_ONLY.CODE
    );
  });

  it("keeps the Tailwind toggle layout", () => {
    const { container } = render(<UserRoleField {...defaultProps} />);

    expect(container.querySelector('[data-slot="toggle-group"]')).toHaveClass(
      "flex",
      "flex-nowrap",
      "gap-0",
      "justify-center",
      "w-full"
    );
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("uses update mode by default", () => {
    render(
      <UserRoleField
        handleRoleChange={defaultProps.handleRoleChange}
        role={defaultProps.role}
      />
    );

    expect(
      screen.getByRole("button", { name: "No Access" })
    ).toBeInTheDocument();
  });
});
