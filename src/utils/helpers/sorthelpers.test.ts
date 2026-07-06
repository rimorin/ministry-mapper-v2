import { describe, it, expect } from "vitest";
import {
  sortByCode,
  sortBySequence,
  sortByProgress,
  sortByProximity
} from "./sorthelpers";
import { addressDetails } from "../interface";

const buildMap = (overrides: Partial<addressDetails>): addressDetails =>
  ({
    id: "id",
    aggregates: { display: "0%", value: 0, notDone: 0, notHome: 0 },
    coordinates: { lat: 0, lng: 0 },
    hasLocation: true,
    ...overrides
  }) as addressDetails;

describe("sortByCode", () => {
  it("sorts strings alphabetically", () => {
    const input = [{ code: "B" }, { code: "A" }, { code: "C" }];
    expect(sortByCode(input).map((x) => x.code)).toEqual(["A", "B", "C"]);
  });

  it("sorts codes with mixed letters and zero-padded numbers correctly", () => {
    const input = [{ code: "M1A" }, { code: "M02" }, { code: "M01" }];
    expect(sortByCode(input).map((x) => x.code)).toEqual(["M01", "M02", "M1A"]);
  });

  it("handles missing code with empty string fallback", () => {
    const input = [{ code: "B" }, {}, { code: "A" }];
    expect(sortByCode(input).map((x) => x.code)).toEqual([undefined, "A", "B"]);
  });

  it("does not mutate the original array", () => {
    const input = [{ code: "B" }, { code: "A" }];
    const original = [...input];
    sortByCode(input);
    expect(input).toEqual(original);
  });
});

describe("sortBySequence", () => {
  it("sorts items by ascending sequence number", () => {
    const input = [{ sequence: 3 }, { sequence: 1 }, { sequence: 2 }];
    expect(sortBySequence(input).map((x) => x.sequence)).toEqual([1, 2, 3]);
  });

  it("handles missing sequence with zero fallback", () => {
    const input = [{ sequence: 2 }, {}, { sequence: 1 }];
    expect(sortBySequence(input).map((x) => x.sequence)).toEqual([
      undefined,
      1,
      2
    ]);
  });

  it("does not mutate the original array", () => {
    const input = [{ sequence: 2 }, { sequence: 1 }];
    const original = [...input];
    sortBySequence(input);
    expect(input).toEqual(original);
  });
});

describe("sortByProgress", () => {
  it("sorts maps by ascending progress (least complete first)", () => {
    const input = [
      buildMap({
        id: "a",
        aggregates: { display: "75%", value: 75, notDone: 0, notHome: 0 }
      }),
      buildMap({
        id: "b",
        aggregates: { display: "10%", value: 10, notDone: 0, notHome: 0 }
      }),
      buildMap({
        id: "c",
        aggregates: { display: "50%", value: 50, notDone: 0, notHome: 0 }
      })
    ];
    expect(sortByProgress(input).map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the original array", () => {
    const input = [
      buildMap({
        id: "a",
        aggregates: { display: "50%", value: 50, notDone: 0, notHome: 0 }
      }),
      buildMap({
        id: "b",
        aggregates: { display: "10%", value: 10, notDone: 0, notHome: 0 }
      })
    ];
    const original = [...input];
    sortByProgress(input);
    expect(input).toEqual(original);
  });
});

describe("sortByProximity", () => {
  it("returns the list unchanged when origin is null", () => {
    const input = [buildMap({ id: "a" }), buildMap({ id: "b" })];
    expect(sortByProximity(input, null)).toBe(input);
  });

  it("sorts maps by ascending distance from the given origin", () => {
    const input = [
      buildMap({ id: "far", coordinates: { lat: 10, lng: 10 } }),
      buildMap({ id: "near", coordinates: { lat: 0.01, lng: 0.01 } }),
      buildMap({ id: "mid", coordinates: { lat: 1, lng: 1 } })
    ];
    expect(sortByProximity(input, { lat: 0, lng: 0 }).map((x) => x.id)).toEqual(
      ["near", "mid", "far"]
    );
  });

  it("sorts maps without a saved location to the end", () => {
    const input = [
      buildMap({
        id: "unlocated",
        hasLocation: false,
        coordinates: { lat: 0, lng: 0 }
      }),
      buildMap({ id: "far", coordinates: { lat: 10, lng: 10 } }),
      buildMap({ id: "near", coordinates: { lat: 0.01, lng: 0.01 } })
    ];
    expect(sortByProximity(input, { lat: 0, lng: 0 }).map((x) => x.id)).toEqual(
      ["near", "far", "unlocated"]
    );
  });

  it("does not mutate the original array", () => {
    const input = [
      buildMap({ id: "a", coordinates: { lat: 5, lng: 5 } }),
      buildMap({ id: "b", coordinates: { lat: 1, lng: 1 } })
    ];
    const original = [...input];
    sortByProximity(input, { lat: 0, lng: 0 });
    expect(input).toEqual(original);
  });

  it("attaches the computed distance in meters to each located item", () => {
    const input = [buildMap({ id: "a", coordinates: { lat: 1, lng: 1 } })];
    const [result] = sortByProximity(input, { lat: 0, lng: 0 });
    expect(result.distanceMeters).toBeGreaterThan(0);
  });

  it("leaves distanceMeters undefined for items without a saved location", () => {
    const input = [buildMap({ id: "a", hasLocation: false })];
    const [result] = sortByProximity(input, { lat: 0, lng: 0 });
    expect(result.distanceMeters).toBeUndefined();
  });
});
