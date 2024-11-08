import { describe, it, expect } from "vitest";
import processPropertyNumber from "./processpropertyno";
import { TERRITORY_TYPES } from "../constants";

describe("processPropertyNumber", () => {
  it("should return an empty string if unitNo is empty", () => {
    expect(processPropertyNumber("", TERRITORY_TYPES.SINGLE_STORY)).toBe("");
  });

  it("should return the unitNo in uppercase for SINGLE_STORY property type", () => {
    expect(processPropertyNumber("a1", TERRITORY_TYPES.SINGLE_STORY)).toBe(
      "A1"
    );
  });

  it("should return the unitNo as a number string for other property types", () => {
    expect(processPropertyNumber("001", "OTHER_TYPE")).toBe("1");
  });

  it("should trim the unitNo before processing", () => {
    expect(processPropertyNumber("  002  ", "OTHER_TYPE")).toBe("2");
  });
});
