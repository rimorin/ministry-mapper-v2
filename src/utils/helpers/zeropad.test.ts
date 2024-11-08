import { describe, it, expect } from "vitest";
import ZeroPad from "./zeropad";

describe("ZeroPad", () => {
  it("should pad the number with leading zeros", () => {
    expect(ZeroPad("5", 3)).toBe("005");
  });

  it("should return the number as is if it already has the required length", () => {
    expect(ZeroPad("123", 3)).toBe("123");
  });

  it("should return the number as is if it is longer than the required length", () => {
    expect(ZeroPad("12345", 3)).toBe("12345");
  });
});
