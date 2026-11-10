import { describe, expect, it } from "vitest";

import { fireEvent, render, screen } from "@/utils/test";
import AssistantChart from "./assistant-chart";

const label = (column: string) =>
  ({
    week: "Week",
    visits: "Visits",
    reached: "Reached",
    territory: "Territory"
  })[column] ?? column;

const weeks = [
  { week: "2026-10-19", visits: 0, reached: 0 },
  { week: "2026-10-26", visits: 5, reached: 3 },
  { week: "2026-11-02", visits: 7, reached: 5 }
];

const chart = (props: Partial<Parameters<typeof AssistantChart>[0]>) =>
  render(
    <AssistantChart
      rows={weeks}
      chart={{ type: "line", x: "week", y: ["visits"] }}
      columnLabel={label}
      valueLabel={(value) => value}
      locale="en"
      animate={false}
      {...props}
    />
  );

describe("AssistantChart", () => {
  it("draws a trend that says what it shows and reads out each point from the keyboard", () => {
    chart({});

    expect(screen.getByText("Visits by week")).toBeInTheDocument();
    const plot = screen.getByRole("img", {
      name: /Line chart of Visits by week, 3 points from Oct 19, 2026 to Nov 2, 2026/
    });
    // The last value is labelled at the end of the line.
    expect(screen.getByText("7")).toBeInTheDocument();

    fireEvent.focus(plot);
    fireEvent.keyDown(plot, { key: "ArrowLeft" });
    expect(screen.getByText("Oct 26, 2026")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    fireEvent.keyDown(plot, { key: "Escape" });
    expect(screen.queryByText("Oct 26, 2026")).toBeNull();
  });

  it("names every series in a legend when there are several", () => {
    chart({ chart: { type: "line", x: "week", y: ["visits", "reached"] } });

    expect(screen.getByText("By week")).toBeInTheDocument();
    expect(screen.getByText("Visits")).toBeInTheDocument();
    expect(screen.getByText("Reached")).toBeInTheDocument();
  });

  it("compares rows as bars, each with its value", () => {
    chart({
      rows: [
        { territory: "T02", visits: 3 },
        { territory: "T01", visits: 12 }
      ],
      chart: { type: "bar", x: "territory", y: ["visits"] }
    });

    expect(
      screen.getByRole("listitem", { name: "T01: 12 Visits" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: "T02: 3 Visits" })
    ).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    // Largest first.
    expect(
      screen
        .getAllByRole("listitem")
        .map((item) => item.getAttribute("aria-label"))
    ).toEqual(["T01: 12 Visits", "T02: 3 Visits"]);
  });
});
