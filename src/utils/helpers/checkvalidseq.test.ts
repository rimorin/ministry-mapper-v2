import { describe, it, expect } from "vitest";
import isValidMapSequence from "./checkvalidseq";

describe("isValidMapSequence", () => {
  it("should return false for empty sequence", () => {
    expect(isValidMapSequence("")).toBe(false);
  });

  it("should return false for sequence with special characters", () => {
    expect(isValidMapSequence("123, @45")).toBe(false);
  });

  it("should return true for valid numeric sequence", () => {
    expect(isValidMapSequence("123, 456")).toBe(true);
  });

  it("should return true for valid alphanumeric sequence", () => {
    expect(isValidMapSequence("1A, 2B, 3C")).toBe(true);
  });

  it("should return true for sequence with hyphens", () => {
    expect(isValidMapSequence("1-A, 2-B")).toBe(true);
  });

  it("should return false for sequence with asterisks", () => {
    expect(isValidMapSequence("*, 1A, 2B")).toBe(false);
  });

  it("should return false for sequence with invalid special characters", () => {
    expect(isValidMapSequence("1A!, 2B#")).toBe(false);
  });
});
