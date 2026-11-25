import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/utils/test";
import MyLinks from "./my-links";
import type { MyLink } from "../../hooks/useMyLinks";

const inAnHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

const link = (overrides: Partial<MyLink>): MyLink => ({
  id: "link1",
  type: "normal",
  expiry_date: inAnHour(),
  assigner: "Alpha Conductor",
  map_description: "Blk 100A",
  territory: "T-01",
  congregation_name: "Alpha Congregation",
  partners: [],
  ...overrides
});

const show = (props: Partial<React.ComponentProps<typeof MyLinks>> = {}) =>
  render(
    <MyLinks
      links={[]}
      isLoading={false}
      hasFailed={false}
      onRefresh={vi.fn()}
      {...props}
    />
  );

describe("MyLinks", () => {
  it("says what is left on a map, and when it carries an instruction", () => {
    show({
      links: [
        link({
          id: "working",
          map_description: "Blk 301",
          not_done: 14,
          not_home: 4,
          total: 28,
          progress: 35,
          pinned: 1
        })
      ]
    });

    expect(screen.getByText("14 not done · 4 not home")).toBeInTheDocument();
    expect(screen.getByText("35%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "35"
    );
    expect(screen.getByText("Read the instructions first")).toBeInTheDocument();
  });

  it("says a finished map is done, and leaves out a count of nothing", () => {
    show({
      links: [
        link({
          id: "done",
          not_done: 0,
          not_home: 0,
          total: 20,
          progress: 100
        }),
        link({
          id: "nohome",
          not_done: 0,
          not_home: 2,
          total: 20,
          progress: 90
        })
      ]
    });

    expect(screen.getByText("All done")).toBeInTheDocument();
    expect(screen.getByText("2 not home")).toBeInTheDocument();
    expect(screen.queryByText(/0 not done/)).toBeNull();
  });

  it("says nothing of a map whose homes have not been counted", () => {
    show({ links: [link({ id: "new", total: 0, progress: 0 })] });

    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText("All done")).toBeNull();
    expect(screen.queryByText("Read the instructions first")).toBeNull();
  });

  it("links each map to its link page, grouped by type", () => {
    show({
      links: [
        link({ id: "normal1" }),
        link({
          id: "personal1",
          type: "personal",
          map_description: { en: "Sunset Road" }
        })
      ]
    });

    expect(screen.getByRole("link", { name: /Blk 100A/ })).toHaveAttribute(
      "href",
      "/map/normal1"
    );
    expect(screen.getByRole("link", { name: /Sunset Road/ })).toHaveAttribute(
      "href",
      "/map/personal1"
    );
    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual(["Assigned", "Personal territory"]);
    // One congregation: naming it on every card would only repeat itself.
    expect(screen.getAllByText("T-01")).toHaveLength(2);
    expect(screen.queryByText(/Alpha Congregation/)).toBeNull();
  });

  it("names the congregation when the links span more than one", () => {
    show({
      links: [
        link({ id: "a" }),
        link({ id: "b", congregation_name: "Beta Congregation" })
      ]
    });

    expect(screen.getByText("T-01 · Alpha Congregation")).toBeInTheDocument();
    expect(screen.getByText("T-01 · Beta Congregation")).toBeInTheDocument();
  });

  it("names who assigned each map only when more than one person did", () => {
    show({
      links: [link({ id: "a" }), link({ id: "b", assigner: "Beta Conductor" })]
    });

    expect(
      screen.getByText("T-01 · Assigned by Alpha Conductor")
    ).toBeInTheDocument();
    expect(
      screen.getByText("T-01 · Assigned by Beta Conductor")
    ).toBeInTheDocument();
  });

  it("leaves out the section heading when there is only one kind of map", () => {
    show({ links: [link({ id: "a" }), link({ id: "b" })] });

    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });

  it("keeps the maps on screen when a refresh fails, and offers to try again", async () => {
    const onRefresh = vi.fn();
    show({
      links: [link({})],
      isStale: true,
      updatedAt: new Date(2026, 10, 29, 10, 42),
      onRefresh
    });

    expect(screen.getByRole("link", { name: /Blk 100A/ })).toBeInTheDocument();
    expect(screen.getByText(/Couldn't refresh/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Check again" }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("names the partners on a shared link, and nobody on one held alone", () => {
    show({
      links: [
        link({ id: "shared", partners: ["Sam Lee", "Rita Tan"] }),
        link({ id: "alone", map_description: "Blk 200" })
      ]
    });

    expect(screen.getAllByText(/^With /)).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: /Blk 100A.*With Sam Lee, Rita Tan/ })
    ).toBeInTheDocument();
  });

  it("says so when nothing is assigned", () => {
    show({});

    expect(screen.getByText("No maps right now")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Check again" })
    ).not.toBeInTheDocument();
  });

  it("offers to check again when the links could not be loaded", async () => {
    const onRefresh = vi.fn();
    show({ hasFailed: true, onRefresh });

    expect(
      screen.getByText("Your maps could not be loaded.")
    ).toBeInTheDocument();
    expect(screen.queryByText("No maps right now")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Check again" }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("tells its container when a link is followed", async () => {
    const onOpen = vi.fn();
    show({ links: [link({})], onOpen });

    await userEvent.click(screen.getByRole("link", { name: /Blk 100A/ }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
