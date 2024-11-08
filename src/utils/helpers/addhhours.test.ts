import { describe, it, expect } from "vitest";
import addHours from "./addhours";

describe("addHours", () => {
  it("should add hours to the current date", () => {
    const currentDate = new Date();
    const result = new Date(addHours(5));
    const expectedDate = new Date(currentDate.getTime() + 5 * 60 * 60 * 1000);
    expect(result.getTime()).toBeCloseTo(expectedDate.getTime(), -2);
  });

  it("should add hours to a specified date", () => {
    const date = new Date("2023-01-01T00:00:00Z");
    const result = new Date(addHours(10, date));
    const expectedDate = new Date("2023-01-01T10:00:00Z");
    expect(result.toISOString()).toBe(expectedDate.toISOString());
  });

  it("should handle adding zero hours", () => {
    const date = new Date("2023-01-01T00:00:00Z");
    const result = new Date(addHours(0, date));
    expect(result.toISOString()).toBe(date.toISOString());
  });

  it("should handle negative hours", () => {
    const date = new Date("2023-01-01T10:00:00Z");
    const result = new Date(addHours(-5, date));
    const expectedDate = new Date("2023-01-01T05:00:00Z");
    expect(result.toISOString()).toBe(expectedDate.toISOString());
  });
});
