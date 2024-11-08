import { describe, it, expect } from "vitest";
import isValidTerritoryCode from "./checkterritorycd";

describe("isValidTerritoryCode", () => {
  it("should return false for code with special characters", () => {
    expect(isValidTerritoryCode("ABC@123")).toBe(false);
  });

  it("should return true for alphanumeric code", () => {
    expect(isValidTerritoryCode("ABC123")).toBe(true);
  });

  it("should return true for code with spaces and dashes", () => {
    expect(isValidTerritoryCode("ABC-123 456")).toBe(true);
  });
});
