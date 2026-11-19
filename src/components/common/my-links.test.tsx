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
    expect(
      screen.getAllByText("T-01 · Assigned by Alpha Conductor")
    ).toHaveLength(2);
    expect(screen.queryByText(/Alpha Congregation/)).toBeNull();
  });

  it("names the congregation when the links span more than one", () => {
    show({
      links: [
        link({ id: "a" }),
        link({ id: "b", congregation_name: "Beta Congregation" })
      ]
    });

    expect(
      screen.getByText(
        "T-01 · Alpha Congregation · Assigned by Alpha Conductor"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("T-01 · Beta Congregation · Assigned by Alpha Conductor")
    ).toBeInTheDocument();
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
