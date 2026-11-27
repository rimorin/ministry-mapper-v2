import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(__dirname, "locales");

const flatKeys = (obj: Record<string, unknown>, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object"
      ? flatKeys(value as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  );

const keysFor = (locale: string) =>
  flatKeys(
    JSON.parse(readFileSync(join(dir, locale, "translation.json"), "utf8"))
  ).sort();

describe("translation files", () => {
  const english = keysFor("en");
  const others = readdirSync(dir).filter((locale) => locale !== "en");

  it("has all eight locales", () => {
    expect(others.sort()).toEqual(["es", "id", "ja", "ko", "ms", "ta", "zh"]);
  });

  it.each(others)("%s has exactly the English keys", (locale) => {
    expect(keysFor(locale)).toEqual(english);
  });
});
