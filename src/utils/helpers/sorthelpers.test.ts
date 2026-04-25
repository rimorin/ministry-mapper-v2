import { describe, it, expect } from "vitest";
import { sortByCode, sortBySequence } from "./sorthelpers";

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
