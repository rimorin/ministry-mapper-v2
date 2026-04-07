import { describe, it, expect } from "vitest";
import { resolveLocalized } from "./resolveLocalized";

describe("resolveLocalized", () => {
  it("returns a plain string unchanged", () => {
    expect(resolveLocalized("hello", "zh")).toBe("hello");
  });

  it("returns the exact locale match", () => {
    expect(resolveLocalized({ en: "Hello", zh: "你好" }, "zh")).toBe("你好");
  });

  it("falls back to 'en' when the requested locale is missing", () => {
    expect(resolveLocalized({ en: "Hello" }, "zh")).toBe("Hello");
  });

  it("falls back to the first available key when 'en' is also missing", () => {
    expect(resolveLocalized({ ms: "Helo", ta: "வணக்கம்" }, "zh")).toBe("Helo");
  });

  it("returns an empty string for null", () => {
    expect(resolveLocalized(null, "en")).toBe("");
  });

  it("returns an empty string for undefined", () => {
    expect(resolveLocalized(undefined, "en")).toBe("");
  });

  it("returns an empty string for an empty locale map", () => {
    expect(resolveLocalized({}, "en")).toBe("");
  });

  it("uses a custom fallback locale when specified", () => {
    expect(resolveLocalized({ zh: "你好" }, "ms", "zh")).toBe("你好");
  });

  it("strips language subtag to match base locale (e.g. zh-TW → zh)", () => {
    expect(resolveLocalized({ en: "Hello", zh: "你好" }, "zh-TW")).toBe("你好");
  });

  it("prefers exact subtag match over stripped base locale", () => {
    expect(
      resolveLocalized({ en: "Hello", zh: "你好", "zh-TW": "繁體" }, "zh-TW")
    ).toBe("繁體");
  });
});
