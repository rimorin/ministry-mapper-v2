import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@/utils/test";
import MemberPicker from "./member-picker";
import type { CongregationMember } from "../../utils/helpers/getcongregationmembers";

const screenSize = vi.hoisted(() => ({ isMobile: false }));

vi.mock("../../hooks/use-mobile", () => ({
  getIsMobile: () => screenSize.isMobile
}));

const member = (id: string, name: string, email: string) =>
  ({ id, name, email, role: "publisher", maps: [] }) as CongregationMember;

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

    it("closes on Done", async () => {
      render(
        <MemberPicker members={members} value={[]} onValueChange={vi.fn()} />
      );
      await userEvent.click(
        screen.getByRole("button", { name: /Search members/i })
      );
      const panel = await screen.findByRole("dialog");

      await userEvent.click(
        within(panel).getByRole("button", { name: "Done" })
      );

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });
  });
});
