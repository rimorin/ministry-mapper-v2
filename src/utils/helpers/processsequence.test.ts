import { describe, it, expect } from "vitest";
import processSequence from "./processsequence";

describe("processSequence", () => {
  it("should remove special characters and trim spaces with default isMulti (false)", () => {
    expect(processSequence("abc, 123, @#$")).toBe("abc,123,");
  });

  it("should remove non-numeric characters and trim spaces when isMulti is true", () => {
    expect(processSequence("abc, 123, @#$", true)).toBe(",123,");
  });

  it("should return an empty string when input is empty", () => {
    expect(processSequence("")).toBe("");
  });

  it("should handle sequences with only special characters", () => {
    expect(processSequence("@#$, %^&")).toBe(",");
  });

  it("should handle sequences with numeric and alphabetic characters", () => {
    expect(processSequence("abc123, 456def")).toBe("abc123,456def");
  });

  it("should handle sequences with numeric characters when isMulti is true", () => {
    expect(processSequence("123, 456", true)).toBe("123,456");
  });

  it("should handle sequences with alphabetic characters when isMulti is true", () => {
    expect(processSequence("abc, def", true)).toBe(",");
  });

  it("should handle sequences with hyphens", () => {
    expect(processSequence("abc-123, 456-def")).toBe("abc-123,456-def");
  });

  it("should handle sequences with hyphens when isMulti is true", () => {
    expect(processSequence("123-abc, def-456", true)).toBe("123-,-456");
  });

  it("should handle sequences with mixed special characters", () => {
    expect(processSequence("abc@123, 456#def")).toBe("abc123,456def");
  });

  it("should handle sequences with mixed special characters when isMulti is true", () => {
    expect(processSequence("123@abc, def#456", true)).toBe("123,456");
  });

  it("should handle sequences with spaces only", () => {
    expect(processSequence(" ,  , ")).toBe(",,");
  });

  it("should handle sequences with spaces only when isMulti is true", () => {
    expect(processSequence(" ,  , ", true)).toBe(",,");
  });

  it("should handle sequences with empty items", () => {
    expect(processSequence("abc,,def")).toBe("abc,,def");
  });

  it("should handle sequences with empty items when isMulti is true", () => {
    expect(processSequence("123,,456", true)).toBe("123,,456");
  });
});
