import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import UserRoleField from "./role";
import { USER_ACCESS_LEVELS } from "../../utils/constants";

const { flag } = vi.hoisted(() => ({ flag: { publisherRole: true } }));

vi.mock("../../hooks/usePublisherRoleEnabled", () => ({
  default: () => flag.publisherRole
}));

describe("UserRoleField", () => {
  beforeEach(() => {
    flag.publisherRole = true;
  });

  const defaultProps = {
    handleRoleChange: vi.fn(),
    role: USER_ACCESS_LEVELS.CONDUCTOR.CODE
  };

  it("offers the access levels, and not removal", () => {
    render(<UserRoleField {...defaultProps} />);

    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Publisher",
      "Read Only",
      "Conductor",
      "Admin"
    ]);
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

    await user.click(screen.getByRole("button", { name: "Read Only" }));

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

  it("offers the publisher role and says what it is limited to", () => {
    render(
      <UserRoleField
        {...defaultProps}
        role={USER_ACCESS_LEVELS.PUBLISHER.CODE}
      />
    );

    expect(screen.getByRole("button", { name: "Publisher" })).toBeVisible();
    expect(
      screen.getByText(
        "A publisher only sees and works the maps given to their account."
      )
    ).toBeInTheDocument();
  });

  it("leaves the publisher role out where it is switched off", () => {
    flag.publisherRole = false;
    render(<UserRoleField {...defaultProps} />);

    expect(
      screen.queryByRole("button", { name: "Publisher" })
    ).not.toBeInTheDocument();
  });

  it("still shows the role on a person who holds it while it is off", () => {
    flag.publisherRole = false;
    render(
      <UserRoleField
        {...defaultProps}
        role={USER_ACCESS_LEVELS.PUBLISHER.CODE}
      />
    );

    expect(screen.getByRole("button", { name: "Publisher" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it.each([
    [
      USER_ACCESS_LEVELS.READ_ONLY.CODE,
      "Can view territories and maps, but cannot change anything."
    ],
    [
      USER_ACCESS_LEVELS.CONDUCTOR.CODE,
      "Can update maps and give them out to publishers."
    ],
    [
      USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE,
      "Can manage everything: territories, maps, members and settings."
    ]
  ])("describes role %s under the selector", (role, hint) => {
    render(<UserRoleField {...defaultProps} role={role} />);

    expect(screen.getByText(hint)).toBeInTheDocument();
  });
});
