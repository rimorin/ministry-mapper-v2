import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen, waitFor, within } from "@/utils/test";
import MemberPicker from "./member-picker";
import type { CongregationMember } from "../../utils/helpers/getcongregationmembers";

const screenSize = vi.hoisted(() => ({ isMobile: false }));

vi.mock("../../hooks/use-mobile", () => ({
  getIsMobile: () => screenSize.isMobile
}));

const member = (id: string, name: string, email: string) =>
  ({
    id,
    name,
    email,
    role: "publisher",
    maps: [],
    groups: []
  }) as CongregationMember;

const members = [
  member("m1", "Mei Ling Tan", "meiling@example.test"),
  member("m2", "Wei Jie Ong", "weijie@example.test")
];

describe("MemberPicker", () => {
  beforeEach(() => {
    screenSize.isMobile = false;
  });

  it("searches from the field itself on a wide screen", () => {
    render(
      <MemberPicker members={members} value={[]} onValueChange={vi.fn()} />
    );

    expect(
      screen.getByRole("combobox", { name: /Search members/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("leaves the chosen out of the field where the form lists them", () => {
    render(
      <MemberPicker
        members={members}
        value={[members[0]]}
        onValueChange={vi.fn()}
        roster
      />
    );

    expect(
      screen.getByRole("combobox", { name: /Search members/i })
    ).toBeInTheDocument();
    expect(screen.queryByText("Mei Ling Tan")).not.toBeInTheDocument();
  });

  it("lists people by name and email, not by map, when picking a group", async () => {
    render(
      <MemberPicker
        members={members}
        value={[]}
        onValueChange={vi.fn()}
        roster
      />
    );

    await userEvent.click(
      screen.getByRole("combobox", { name: /Search members/i })
    );

    expect(await screen.findByText("weijie@example.test")).toBeInTheDocument();
    expect(screen.queryByText("Without a map")).not.toBeInTheDocument();
    expect(screen.queryByText(/No map assigned/)).not.toBeInTheDocument();
  });

  it("offers the groups above the list on a wide screen", async () => {
    render(
      <MemberPicker
        members={[
          { ...members[0], groups: ["Group 3"] },
          { ...members[1], groups: ["Group 5"] }
        ]}
        value={[]}
        onValueChange={vi.fn()}
      />
    );

    await userEvent.click(
      screen.getByRole("combobox", { name: /Search members/i })
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Group 5 1" })
    );

    await waitFor(() =>
      expect(screen.queryByText("Mei Ling Tan")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Wei Jie Ong")).toBeInTheDocument();
  });

  describe("on a phone", () => {
    beforeEach(() => {
      screenSize.isMobile = true;
    });

    it("shows a field that opens the panel, not a search box", () => {
      render(
        <MemberPicker members={members} value={[]} onValueChange={vi.fn()} />
      );

      expect(
        screen.getByRole("button", { name: /Search members/i })
      ).toBeInTheDocument();
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });

    it("names who is already chosen in the field", () => {
      render(
        <MemberPicker
          members={members}
          value={[members[0]]}
          onValueChange={vi.fn()}
        />
      );

      expect(
        within(
          screen.getByRole("button", { name: /Search members/i })
        ).getByText("Mei Ling Tan")
      ).toBeInTheDocument();
    });

    it("opens a panel with the search and everyone listed", async () => {
      render(
        <MemberPicker members={members} value={[]} onValueChange={vi.fn()} />
      );

      await userEvent.click(
        screen.getByRole("button", { name: /Search members/i })
      );

      const panel = await screen.findByRole("dialog");
      expect(
        within(panel).getByRole("combobox", { name: /Search members/i })
      ).toBeInTheDocument();
      expect(within(panel).getByText("Mei Ling Tan")).toBeInTheDocument();
      expect(within(panel).getByText("Wei Jie Ong")).toBeInTheDocument();
    });

    it("narrows the list as the person types, by name or email", async () => {
      render(
        <MemberPicker members={members} value={[]} onValueChange={vi.fn()} />
      );
      await userEvent.click(
        screen.getByRole("button", { name: /Search members/i })
      );
      const panel = await screen.findByRole("dialog");

      await userEvent.type(within(panel).getByRole("combobox"), "weijie@");

      await waitFor(() =>
        expect(
          within(panel).queryByText("Mei Ling Tan")
        ).not.toBeInTheDocument()
      );
      expect(within(panel).getByText("Wei Jie Ong")).toBeInTheDocument();
    });

    it("picks a person and stays open for the next", async () => {
      const onValueChange = vi.fn();
      render(
        <MemberPicker
          members={members}
          value={[]}
          onValueChange={onValueChange}
        />
      );
      await userEvent.click(
        screen.getByRole("button", { name: /Search members/i })
      );
      const panel = await screen.findByRole("dialog");

      await userEvent.click(within(panel).getByText("Mei Ling Tan"));

      expect(onValueChange.mock.calls[0][0]).toEqual([members[0]]);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const openPanel = async (
      people: CongregationMember[],
      onMap?: { map: string; link?: string }
    ) => {
      render(
        <MemberPicker
          members={people}
          value={[]}
          onValueChange={vi.fn()}
          onMap={onMap}
        />
      );
      await userEvent.click(
        screen.getByRole("button", { name: /Search members/i })
      );
      return screen.findByRole("dialog");
    };
    const holding = (person: CongregationMember, ...maps: string[]) => ({
      ...person,
      maps: maps.map((name, index) => ({
        link: `link-${index}`,
        map: `map-${name}`,
        name
      }))
    });

    it("lists who has no map before who is working one, and says what they hold", async () => {
      const panel = await openPanel([
        holding(members[0], "Blk 301", "Blk 305"),
        members[1]
      ]);

      const groups = within(panel)
        .getAllByText(/^(Without a map|Working a map)$/)
        .map((node) => node.textContent);
      expect(groups).toEqual(["Without a map", "Working a map"]);
      expect(within(panel).getByText("No map assigned")).toBeInTheDocument();
      expect(
        within(panel).getByText("2 maps: Blk 301, Blk 305")
      ).toBeInTheDocument();
    });

    it("shows an email only for people who share a name", async () => {
      const panel = await openPanel([
        ...members,
        member("m3", "Mei Ling Tan", "other@example.test")
      ]);

      expect(
        within(panel).getByText(/meiling@example\.test/)
      ).toBeInTheDocument();
      expect(
        within(panel).getByText(/other@example\.test/)
      ).toBeInTheDocument();
      expect(
        within(panel).queryByText(/weijie@example\.test/)
      ).not.toBeInTheDocument();
    });

    it("does not offer someone who already holds this map on another link", async () => {
      const panel = await openPanel([holding(members[0], "Blk 301")], {
        map: "map-Blk 301"
      });

      expect(
        within(panel).getByText("Already working this map")
      ).toBeInTheDocument();
      expect(within(panel).getByRole("option")).toHaveAttribute(
        "aria-disabled",
        "true"
      );
    });

    it("still offers someone who holds the map on the link being changed", async () => {
      const panel = await openPanel([holding(members[0], "Blk 301")], {
        map: "map-Blk 301",
        link: "link-0"
      });

      expect(
        within(panel).queryByText("Already working this map")
      ).not.toBeInTheDocument();
    });

    it("says when the person is staff", async () => {
      const panel = await openPanel([
        { ...members[0], role: "conductor" },
        members[1]
      ]);

      expect(within(panel).getByText("Conductor")).toBeInTheDocument();
      expect(within(panel).queryByText("Publisher")).not.toBeInTheDocument();
    });

    it("names the task in the panel's heading", async () => {
      const panel = await openPanel(members);

      expect(
        within(panel).getByRole("heading", { name: "Send to their account" })
      ).toBeInTheDocument();
    });

    describe("with groups", () => {
      const grouped = [
        { ...members[0], groups: ["Group 3"] },
        { ...members[1], groups: ["Group 5"] },
        {
          ...member("m3", "Siti Rahman", "siti@example.test"),
          groups: ["Group 3", "Mandarin"]
        }
      ];
      const openGrouped = async (props: { roster?: boolean } = {}) => {
        render(
          <MemberPicker
            members={grouped}
            value={[]}
            onValueChange={vi.fn()}
            {...props}
          />
        );
        await userEvent.click(
          screen.getByRole("button", { name: /Search members/i })
        );
        return screen.findByRole("dialog");
      };
      const chip = (panel: HTMLElement, name: string) =>
        within(panel).getByRole("button", { name: new RegExp(`^${name}`) });

      beforeEach(() => {
        localStorage.clear();
      });

      it("narrows the list to the group chosen", async () => {
        const panel = await openGrouped();

        await userEvent.click(chip(panel, "Group 3"));

        expect(within(panel).getByText("Mei Ling Tan")).toBeInTheDocument();
        expect(within(panel).getByText("Siti Rahman")).toBeInTheDocument();
        expect(
          within(panel).queryByText("Wei Jie Ong")
        ).not.toBeInTheDocument();
      });

      it("counts in each group the people the search found", async () => {
        const panel = await openGrouped();

        await userEvent.type(within(panel).getByRole("combobox"), "tan");

        expect(chip(panel, "All")).toHaveAccessibleName("All 1");
        expect(chip(panel, "Group 3")).toHaveAccessibleName("Group 3 1");
        expect(chip(panel, "Group 5")).toHaveAccessibleName("Group 5 0");
      });

      it("offers the other groups when the chosen one has no match", async () => {
        const panel = await openGrouped();
        await userEvent.click(chip(panel, "Group 3"));

        await userEvent.type(within(panel).getByRole("combobox"), "wei");
        expect(
          within(panel).getByText("No one in Group 3 matches.")
        ).toBeInTheDocument();
        await userEvent.click(
          within(panel).getByRole("button", { name: "Search all groups" })
        );

        expect(within(panel).getByText("Wei Jie Ong")).toBeInTheDocument();
        expect(chip(panel, "All")).toHaveAttribute("aria-pressed", "true");
      });

      it("says which groups each person is in while none is chosen", async () => {
        const panel = await openGrouped();

        expect(
          within(panel).getByText("No map assigned · Group 3, Mandarin")
        ).toBeInTheDocument();
      });

      it("opens on the group last chosen", async () => {
        const first = await openGrouped();
        await userEvent.click(chip(first, "Group 5"));
        cleanup();

        const panel = await openGrouped();

        expect(chip(panel, "Group 5")).toHaveAttribute("aria-pressed", "true");
        expect(
          within(panel).queryByText("Mei Ling Tan")
        ).not.toBeInTheDocument();
      });

      it("starts each opening with an empty search", async () => {
        const panel = await openGrouped();
        await userEvent.type(within(panel).getByRole("combobox"), "tan");
        await userEvent.click(
          within(panel).getByRole("button", { name: /Continue/ })
        );
        await waitFor(() =>
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        );

        await userEvent.click(
          screen.getByRole("button", { name: /Search members/i })
        );
        const reopened = await screen.findByRole("dialog");

        expect(within(reopened).getByRole("combobox")).toHaveValue("");
        expect(chip(reopened, "All")).toHaveAccessibleName("All 3");
      });

      it("offers no groups where it picks a group's own members", async () => {
        const panel = await openGrouped({ roster: true });

        expect(
          within(panel).queryByRole("group", { name: "Filter by group" })
        ).not.toBeInTheDocument();
      });

      it("offers no groups where nobody is in one", async () => {
        render(
          <MemberPicker members={members} value={[]} onValueChange={vi.fn()} />
        );
        await userEvent.click(
          screen.getByRole("button", { name: /Search members/i })
        );
        const panel = await screen.findByRole("dialog");

        expect(
          within(panel).queryByRole("group", { name: "Filter by group" })
        ).not.toBeInTheDocument();
      });
    });

    it("closes on Continue", async () => {
      render(
        <MemberPicker members={members} value={[]} onValueChange={vi.fn()} />
      );
      await userEvent.click(
        screen.getByRole("button", { name: /Search members/i })
      );
      const panel = await screen.findByRole("dialog");

      await userEvent.click(
        within(panel).getByRole("button", { name: "Continue" })
      );

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });
  });
});
