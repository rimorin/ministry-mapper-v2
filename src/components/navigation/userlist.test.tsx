import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, userEvent, waitFor } from "../../utils/test";
import UserListing from "./userlist";
import { userDetails } from "../../utils/interface";

const groups = vi.hoisted(() => vi.fn());

vi.mock(
  "../../utils/helpers/getcongregationmembers",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("../../utils/helpers/getcongregationmembers")
    >()),
    getCongregationGroups: groups
  })
);

vi.mock("./grouplist", () => ({
  default: ({ congregation }: { congregation: string }) => (
    <p>Groups of {congregation}</p>
  )
}));

const person = (name: string, role: string): userDetails => ({
  name,
  email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
  role,
  roleId: `role-${name}`,
  userId: `user-${name}`,
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
  beforeEach(() => {
    groups.mockReset();
    groups.mockResolvedValue([]);
  });

  it("is a list of users, with no tabs, where the publisher role is off", () => {
    open();

    expect(groups).not.toHaveBeenCalled();
    expect(screen.getByText("Select Member")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Invite" })
    ).not.toBeInTheDocument();
  });

  describe("as People", () => {
    const openPeople = (onInvite = vi.fn()) => {
      render(
        <UserListing
          showListing
          hideFunction={vi.fn()}
          users={users}
          people={{ congregation: "cong1", onInvite }}
        />
      );
      return onInvite;
    };

    it("opens on the members, with a Groups tab beside them", async () => {
      const user = userEvent.setup();
      openPeople();

      expect(screen.getByText("People")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Members" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(names()).toHaveLength(5);

      await user.click(screen.getByRole("tab", { name: "Groups" }));
      expect(screen.getByText("Groups of cong1")).toBeInTheDocument();
      // Each tab carries its own action; Invite belongs to Members. The
      // Members panel leaves after its tab is switched away from.
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: "Invite" })
        ).not.toBeInTheDocument()
      );
    });

    it("says which groups each member is in", async () => {
      groups.mockResolvedValue([
        { id: "g1", name: "Group 3", members: ["user-Ann Admin"] },
        { id: "g2", name: "Mandarin", members: ["user-Ann Admin"] }
      ]);
      openPeople();

      expect(await screen.findByText("Group 3")).toBeInTheDocument();
      expect(screen.getByText("Mandarin")).toBeInTheDocument();
      expect(screen.getByText("ann.admin@example.com")).toBeInTheDocument();
    });

    it("reads the groups again once a member's dialog is done with", async () => {
      const user = userEvent.setup();
      render(
        <UserListing
          showListing
          hideFunction={vi.fn()}
          handleSelect={vi.fn().mockResolvedValue(undefined)}
          users={users}
          people={{ congregation: "cong1", onInvite: vi.fn() }}
        />
      );
      await waitFor(() => expect(groups).toHaveBeenCalledTimes(1));

      await user.click(
        screen.getByRole("button", { name: /ann\.admin@example\.com/ })
      );

      await waitFor(() => expect(groups).toHaveBeenCalledTimes(2));
    });

    it("invites from its own button", async () => {
      const user = userEvent.setup();
      const onInvite = openPeople();

      await user.click(screen.getByRole("button", { name: "Invite" }));

      expect(onInvite).toHaveBeenCalled();
    });
  });

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
