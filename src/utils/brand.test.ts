import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { BRAND_URL } from "./constants";

// npm run brand keeps these in step; this catches a hand edit that doesn't.
const read = (file: string) => readFileSync(file, "utf-8");
const brand = JSON.parse(read("brand/brand.json"));
const linked = /https:\/\/assets\.ministry-mapper\.com\/brand\/[^/"]+\//g;

describe("logo files", () => {
  it("points index.html only at the current logo folder", () => {
    const html = read("index.html");
    const folders = new Set(html.match(linked));

    expect([...folders]).toEqual([`${BRAND_URL}/`]);
    for (const file of [
      "favicon.ico",
      "favicon.svg",
      "apple-touch-icon-180x180.png",
      "maskable-icon-512x512.png"
    ]) {
      expect(html).toContain(`${BRAND_URL}/${file}`);
    }
  });

  it("gives the manifest its icons from the current logo folder", () => {
    const manifest = JSON.parse(read("public/site.webmanifest"));
    const sources = manifest.icons.map((icon: { src: string }) => icon.src);

    expect(sources.length).toBeGreaterThan(0);
    for (const src of sources)
      expect(src.startsWith(`${BRAND_URL}/`)).toBe(true);
    expect(
      manifest.icons.some(
        (icon: { purpose?: string }) => icon.purpose === "maskable"
      )
    ).toBe(true);
  });

  it("builds the tab icon from the master logo, in both tile colours", () => {
    const master = read("brand/logo.svg");
    const favicon = read("brand/favicon.svg");
    const firstShape = master.match(
      /<(path|rect|circle|ellipse|polygon)\b[^>]*>/
    );

    expect(firstShape).not.toBeNull();
    expect(favicon).toContain(firstShape![0]);
    expect(favicon).toContain(brand.tile.light);
    expect(favicon).toContain(brand.tile.dark);
  });

  it("colours the in-app tile as brand.json says", () => {
    const tiles = [
      ...read("src/index.css").matchAll(/--logo-tile:\s*(#[0-9a-f]+);/gi)
    ].map((match) => match[1].toLowerCase());

    expect(tiles).toEqual([
      brand.tile.light.toLowerCase(),
      brand.tile.dark.toLowerCase()
    ]);
  });
});
