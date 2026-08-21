import { describe, it, expect } from "vitest";
import { buildProgressMarkerHtml, buildMarkerClasses } from "./marker";

describe("buildProgressMarkerHtml", () => {
  it("passes progress through as a custom property", () => {
    expect(buildProgressMarkerHtml("99%", 99)).toContain("--progress:99");
  });

  it("flattens the track at both extremes, where a gradient would seam", () => {
    const full = buildProgressMarkerHtml("100%", 100);
    expect(full).toContain("--progress:100");
    expect(full).toContain('data-fill="full"');

    const empty = buildProgressMarkerHtml("0%", 0);
    expect(empty).toContain("--progress:0");
    expect(empty).toContain('data-fill="empty"');
  });

  it("keeps the gradient for every value in between", () => {
    for (const v of [1, 50, 99]) {
      expect(buildProgressMarkerHtml(`${v}%`, v)).toContain(
        'data-fill="partial"'
      );
    }
  });

  it("renders the display string verbatim", () => {
    expect(buildProgressMarkerHtml("91%", 91)).toContain(
      '<span class="map-progress-value">91%</span>'
    );
  });

  it("includes the track element the ring is painted on", () => {
    expect(buildProgressMarkerHtml("50%", 50)).toContain(
      'class="map-progress-track"'
    );
  });

  it("includes both dials, which CSS reveals per state", () => {
    const html = buildProgressMarkerHtml("50%", 50);
    expect(html).toContain('data-dial="assignment"');
    expect(html).toContain('data-dial="personal"');
  });

  it("orders the dials before the value so the number paints on top", () => {
    const html = buildProgressMarkerHtml("100%", 100);
    expect(html.indexOf('data-dial="personal"')).toBeLessThan(
      html.indexOf("map-progress-value")
    );
  });
});

describe("buildMarkerClasses", () => {
  it("returns nothing when no state applies", () => {
    expect(buildMarkerClasses(false, false, false)).toBe("");
  });

  it("returns a single state on its own", () => {
    expect(buildMarkerClasses(false, true, false)).toBe(
      "marker-has-assignments"
    );
    expect(buildMarkerClasses(false, false, true)).toBe("marker-has-personal");
    expect(buildMarkerClasses(true, false, false)).toBe("marker-selected");
  });

  it("composes every state so their rings can stack", () => {
    expect(buildMarkerClasses(true, true, true)).toBe(
      "marker-selected marker-has-assignments marker-has-personal"
    );
  });
});
