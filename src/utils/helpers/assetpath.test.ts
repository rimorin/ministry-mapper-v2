import { describe, it, expect } from "vitest";
import { getAssetUrl } from "./assetpath";

describe("getAssetUrl", () => {
  const BASE_URL = "https://assets.ministry-mapper.com";

  describe("Basic functionality", () => {
    it("should return correct URL for a simple filename", () => {
      const filename = "logo.png";
      const result = getAssetUrl(filename);
      expect(result).toBe(`${BASE_URL}/logo.png`);
    });

    it("should return correct URL for SVG files", () => {
      const filename = "target.svg";
      const result = getAssetUrl(filename);
      expect(result).toBe(`${BASE_URL}/target.svg`);
    });

    it("should return correct URL for icon files", () => {
      const filename = "favicon-32x32.png";
      const result = getAssetUrl(filename);
      expect(result).toBe(`${BASE_URL}/favicon-32x32.png`);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string filename", () => {
      const filename = "";
      const result = getAssetUrl(filename);
      expect(result).toBe(`${BASE_URL}/`);
    });

    it("should handle filename with spaces", () => {
      const filename = "my file.png";
      const result = getAssetUrl(filename);
      expect(result).toBe(`${BASE_URL}/my file.png`);
    });

    it("should handle filename with special characters", () => {
      const filename = "file-name_with.special@chars.png";
      const result = getAssetUrl(filename);
      expect(result).toBe(`${BASE_URL}/file-name_with.special@chars.png`);
    });

    it("should handle filename starting with slash", () => {
      const filename = "/logo.png";
      const result = getAssetUrl(filename);
      expect(result).toBe(`${BASE_URL}//logo.png`);
    });

    it("should handle filename with query parameters", () => {
      const filename = "logo.png?v=1.0";
      const result = getAssetUrl(filename);
      expect(result).toBe(`${BASE_URL}/logo.png?v=1.0`);
    });

    it("should handle filename with hash/fragment", () => {
      const filename = "logo.png#section";
      const result = getAssetUrl(filename);
      expect(result).toBe(`${BASE_URL}/logo.png#section`);
    });
  });

  describe("Real-world usage examples", () => {
    it("should generate correct URL for target.svg", () => {
      const result = getAssetUrl("target.svg");
      expect(result).toBe("https://assets.ministry-mapper.com/target.svg");
    });

    it("should generate correct URL for gmaps.svg", () => {
      const result = getAssetUrl("gmaps.svg");
      expect(result).toBe("https://assets.ministry-mapper.com/gmaps.svg");
    });

    it("should generate correct URL for language.svg", () => {
      const result = getAssetUrl("language.svg");
      expect(result).toBe("https://assets.ministry-mapper.com/language.svg");
    });

    it("should generate correct URL for android-chrome-192x192.png", () => {
      const result = getAssetUrl("android-chrome-192x192.png");
      expect(result).toBe(
        "https://assets.ministry-mapper.com/android-chrome-192x192.png"
      );
    });

    it("should generate correct URL for favicon-32x32.png", () => {
      const result = getAssetUrl("favicon-32x32.png");
      expect(result).toBe(
        "https://assets.ministry-mapper.com/favicon-32x32.png"
      );
    });

    it("should generate correct URL for plus.svg", () => {
      const result = getAssetUrl("plus.svg");
      expect(result).toBe("https://assets.ministry-mapper.com/plus.svg");
    });

    it("should generate correct URL for envelope.svg", () => {
      const result = getAssetUrl("envelope.svg");
      expect(result).toBe("https://assets.ministry-mapper.com/envelope.svg");
    });

    it("should generate correct URL for question.svg", () => {
      const result = getAssetUrl("question.svg");
      expect(result).toBe("https://assets.ministry-mapper.com/question.svg");
    });

    it("should generate correct URL for top-arrow.svg", () => {
      const result = getAssetUrl("top-arrow.svg");
      expect(result).toBe("https://assets.ministry-mapper.com/top-arrow.svg");
    });

    it("should generate correct URL for logo.png", () => {
      const result = getAssetUrl("logo.png");
      expect(result).toBe("https://assets.ministry-mapper.com/logo.png");
    });
  });

  describe("Type safety", () => {
    it("should accept string parameter", () => {
      const filename: string = "test.png";
      const result = getAssetUrl(filename);
      expect(typeof result).toBe("string");
    });

    it("should return string type", () => {
      const result = getAssetUrl("test.png");
      expect(typeof result).toBe("string");
    });
  });

  describe("URL validation", () => {
    it("should return valid URL format", () => {
      const result = getAssetUrl("test.png");
      expect(result).toMatch(/^https:\/\/assets\.ministry-mapper\.com\/.+/);
    });

    it("should be parseable as URL object", () => {
      const result = getAssetUrl("test.png");
      expect(() => new URL(result)).not.toThrow();
    });

    it("should have correct protocol", () => {
      const result = getAssetUrl("test.png");
      const url = new URL(result);
      expect(url.protocol).toBe("https:");
    });

    it("should have correct hostname", () => {
      const result = getAssetUrl("test.png");
      const url = new URL(result);
      expect(url.hostname).toBe("assets.ministry-mapper.com");
    });

    it("should have correct pathname", () => {
      const filename = "test.png";
      const result = getAssetUrl(filename);
      const url = new URL(result);
      expect(url.pathname).toBe(`/${filename}`);
    });
  });

  describe("Performance and consistency", () => {
    it("should return consistent results for same input", () => {
      const filename = "test.png";
      const result1 = getAssetUrl(filename);
      const result2 = getAssetUrl(filename);
      expect(result1).toBe(result2);
    });

    it("should handle multiple calls efficiently", () => {
      const filenames = ["test1.png", "test2.svg", "test3.jpg"];
      const results = filenames.map(getAssetUrl);

      expect(results).toHaveLength(3);
      expect(results[0]).toBe("https://assets.ministry-mapper.com/test1.png");
      expect(results[1]).toBe("https://assets.ministry-mapper.com/test2.svg");
      expect(results[2]).toBe("https://assets.ministry-mapper.com/test3.jpg");
    });
  });
});
