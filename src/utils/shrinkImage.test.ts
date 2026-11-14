import { describe, expect, it } from "vitest";
import { isPhoto, shrinkImage } from "./shrinkImage";

describe("shrinkImage", () => {
  it("takes JPEG, PNG and WebP only", () => {
    expect(isPhoto(new Blob([], { type: "image/jpeg" }))).toBe(true);
    expect(isPhoto(new Blob([], { type: "image/webp" }))).toBe(true);
    expect(isPhoto(new Blob([], { type: "image/svg+xml" }))).toBe(false);
    expect(isPhoto(new Blob([], { type: "application/pdf" }))).toBe(false);
  });

  it("refuses a file that is not a photo before reading it", async () => {
    await expect(
      shrinkImage(new Blob(["<svg/>"], { type: "image/svg+xml" }))
    ).rejects.toThrow("Not a JPEG, PNG or WebP");
  });
});
