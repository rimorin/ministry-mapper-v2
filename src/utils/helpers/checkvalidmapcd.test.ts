import { describe, it, expect } from "vitest";
import isValidMapCode from "./checkvalidmapcd";

describe("isValidMapCode", () => {
  it("should return false for empty map code", () => {
    expect(isValidMapCode("")).toBe(false);
  });

  it("should return false for non-numeric map code", () => {
    expect(isValidMapCode("ABC123")).toBe(false);
  });

  it("should return false for map code shorter than minimum length", () => {
    expect(isValidMapCode("123")).toBe(false);
  });

  it("should return false for map code with special characters", () => {
    expect(isValidMapCode("123@456")).toBe(false);
  });

  it("should return true for valid map code", () => {
    expect(isValidMapCode("123456")).toBe(true);
  });
});
