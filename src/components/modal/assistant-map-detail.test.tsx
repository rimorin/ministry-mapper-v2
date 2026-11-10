import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/utils/test";
import AssistantMapDetail from "./assistant-map-detail";

const row = {
  map_id: "m950",
  map: "950A Marsiling Delta",
  territory: "M09",
  territory_name: "Marsiling",
  type: "multi",
  floors: "2 to 13",
  units_per_floor: 8,
  homes: 96,
  progress: 40,
  not_done: 50,
  done: 30,
  not_home: 10,
  at_try_limit: 4,
  dnc: 3,
  invalid: 3,
  not_counted: 2,
  household_types: "Chinese 70, Malay 26",
  last_visit: "2026-11-05",
  visits_30_days: 12,
  last_reset: "2026-06-01",
  unread_messages: 2,
  pinned: ["Skip the 3rd floor this week"],
  homes_with_notes: 5,
  active_links: 1,
  links: [{ publisher: "Sis Ong", expires: "2026-11-08 10:00" }],
  has_location: true
};

describe("AssistantMapDetail", () => {
  it("lays out the map, its homes, activity, messages and links", async () => {
    const onShowHomes = vi.fn();
    const onShowOnMap = vi.fn();
    render(
      <AssistantMapDetail
        row={row}
        onShowHomes={onShowHomes}
        onShowOnMap={onShowOnMap}
      />
    );
    expect(screen.getByText("950A Marsiling Delta")).toBeInTheDocument();
    expect(
      screen.getByText(
        /M09 · Marsiling · Floors 2 to 13, 8 units a floor · 96 homes/
      )
    ).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("(4 at the limit)")).toBeInTheDocument();
    expect(
      screen.getByText("2 homes have a household type that is not counted.")
    ).toBeInTheDocument();
    expect(screen.getByText("Chinese 70, Malay 26")).toBeInTheDocument();
    // Dates read in the admin's language, at the congregation's own time.
    expect(screen.getByText(/Last visit Nov 5, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/until Nov 8, 2026, 10:00/)).toBeInTheDocument();
    expect(
      screen.getByText("Skip the 3rd floor this week")
    ).toBeInTheDocument();
    expect(screen.getByText("Sis Ong")).toBeInTheDocument();
    expect(screen.queryByText("This map has no location yet.")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Show homes" }));
    expect(onShowHomes).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Show on map" }));
    expect(onShowOnMap).toHaveBeenCalled();
  });

  it("gives a read-only helper the link count, and flags a missing location", () => {
    render(
      <AssistantMapDetail
        row={{ ...row, links: undefined, has_location: false }}
        onShowHomes={vi.fn()}
        onShowOnMap={vi.fn()}
      />
    );
    expect(screen.queryByText("Sis Ong")).toBeNull();
    expect(screen.getByText("1 active link")).toBeInTheDocument();
    expect(
      screen.getByText("This map has no location yet.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show on map" })).toBeNull();
  });
});
