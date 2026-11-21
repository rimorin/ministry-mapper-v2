import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../utils/test";
import UserListing from "./userlist";
import { userDetails } from "../../utils/interface";

const person = (name: string, role: string): userDetails => ({
  name,
  email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
  role,
  roleId: `role-${name}`,
  verified: true
});

const users = [
  person("Ann Admin", "administrator"),
  person("Carl Conductor", "conductor"),
  person("Cora Conductor", "conductor"),
  person("Pat Publisher", "publisher"),
  person("Rae Reader", "read_only")
];

const open = (list = users, handleSelect = vi.fn()) => {
  render(
    <UserListing
      showListing
      hideFunction={vi.fn()}
      handleSelect={handleSelect}
      users={list}
    />
  );
  return handleSelect;
};

const names = () =>
  screen
    .getAllByRole("button", { name: /@example\.com/ })
    .map((row) => row.querySelector("[data-slot=item-title]")?.textContent);

describe("UserListing", () => {
  it("lists everyone until a filter is chosen", () => {
    open();
    expect(names()).toHaveLength(5);
  });

  it("lists by role, most access first, then by name", () => {
    open([...users].reverse());
    expect(names()).toEqual(users.map((entry) => entry.name));
  });

  it("narrows to the role chosen and back again", async () => {
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole("button", { name: /Publisher\s*1/ }));
    expect(names()).toEqual(["Pat Publisher"]);

    await user.click(screen.getByRole("button", { name: /All\s*5/ }));
    expect(names()).toHaveLength(5);
  });

  it("searches by name or email, and counts roles among those found", async () => {
    const user = userEvent.setup();
    open();

    await user.type(screen.getByRole("searchbox"), "CONDUCTOR@");
    expect(names()).toEqual(["Carl Conductor", "Cora Conductor"]);
    expect(
      screen.getByRole("button", { name: /Conductor\s*2/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Publisher\s*0/ })
    ).toBeInTheDocument();
  });

  it("says so when nobody matches", async () => {
    const user = userEvent.setup();
    open();

    await user.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("offers no role filter when everyone holds the same role", () => {
    open(users.filter((entry) => entry.role === "conductor"));
    expect(screen.queryByRole("button", { name: /^All/ })).toBeNull();
  });

  it("selects the person tapped", async () => {
    const user = userEvent.setup();
    const handleSelect = open();

    await user.click(screen.getByRole("button", { name: /Pat Publisher/ }));
    expect(handleSelect).toHaveBeenCalledWith(
      "role-Pat Publisher",
      expect.anything()
    );
  });
});
