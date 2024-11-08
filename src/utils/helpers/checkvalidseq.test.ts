import { describe, it, expect } from "vitest";
import isValidMapSequence from "./checkvalidseq";
import { TERRITORY_TYPES } from "../constants";

describe("isValidMapSequence", () => {
  it("should return false for empty sequence", () => {
    expect(isValidMapSequence("")).toBe(false);
  });

  it("should return false for sequence with special characters", () => {
    expect(isValidMapSequence("123, @45")).toBe(false);
  });

  it("should return true for valid single story sequence", () => {
    expect(isValidMapSequence("123, 456")).toBe(true);
  });

  it("should return false for multiple stories sequence with non-numeric characters", () => {
    expect(
      isValidMapSequence("123, ABC", TERRITORY_TYPES.MULTIPLE_STORIES)
    ).toBe(false);
  });

  it("should return true for valid multiple stories sequence", () => {
    expect(
      isValidMapSequence("123, 456", TERRITORY_TYPES.MULTIPLE_STORIES)
    ).toBe(true);
  });
});
