import { describe, it, expect } from "vitest";
import getDirection from "./directiongenerator";
import { DEFAULT_COORDINATES } from "../constants";

describe("getDirection", () => {
  describe("Basic functionality", () => {
    it("should generate Google Maps URL with default Singapore coordinates", () => {
      const result = getDirection();
      const expectedLat = DEFAULT_COORDINATES.Singapore.lat;
      const expectedLng = DEFAULT_COORDINATES.Singapore.lng;
      const expectedDestination = `${expectedLat},${expectedLng}`;
      const expectedUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(expectedDestination)}`;

      expect(result).toBe(expectedUrl);
    });

    it("should generate Google Maps URL with provided coordinates", () => {
      const coordinates = { lat: 40.7128, lng: -74.006 }; // New York City
      const result = getDirection(coordinates);
      const expectedDestination = "40.7128,-74.006";
      const expectedUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(expectedDestination)}`;

      expect(result).toBe(expectedUrl);
    });

    it("should use Malaysia coordinates when provided", () => {
      const result = getDirection(DEFAULT_COORDINATES.Malaysia);
      const expectedLat = DEFAULT_COORDINATES.Malaysia.lat;
      const expectedLng = DEFAULT_COORDINATES.Malaysia.lng;
      const expectedDestination = `${expectedLat},${expectedLng}`;
      const expectedUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(expectedDestination)}`;

      expect(result).toBe(expectedUrl);
    });
  });

  describe("URL structure validation", () => {
    it("should return valid URL", () => {
      const result = getDirection();
      expect(() => new URL(result)).not.toThrow();
    });

    it("should have correct protocol", () => {
      const result = getDirection();
      const url = new URL(result);
      expect(url.protocol).toBe("https:");
    });

    it("should have correct hostname", () => {
      const result = getDirection();
      const url = new URL(result);
      expect(url.hostname).toBe("www.google.com");
    });

    it("should have correct pathname", () => {
      const result = getDirection();
      const url = new URL(result);
      expect(url.pathname).toBe("/maps/dir/");
    });

    it("should have api parameter set to 1", () => {
      const result = getDirection();
      const url = new URL(result);
      expect(url.searchParams.get("api")).toBe("1");
    });

    it("should have destination parameter", () => {
      const result = getDirection();
      const url = new URL(result);
      expect(url.searchParams.has("destination")).toBe(true);
    });
  });

  describe("Coordinate handling", () => {
    it("should handle positive coordinates", () => {
      const coordinates = { lat: 51.5074, lng: 0.1278 }; // London
      const result = getDirection(coordinates);
      expect(result).toContain("51.5074%2C0.1278");
    });

    it("should handle negative coordinates", () => {
      const coordinates = { lat: -33.8688, lng: 151.2093 }; // Sydney
      const result = getDirection(coordinates);
      expect(result).toContain("-33.8688%2C151.2093");
    });

    it("should handle zero coordinates", () => {
      const coordinates = { lat: 0, lng: 0 }; // Equator/Prime Meridian
      const result = getDirection(coordinates);
      expect(result).toContain("0%2C0");
    });

    it("should handle decimal coordinates", () => {
      const coordinates = { lat: 35.6762, lng: 139.6503 }; // Tokyo
      const result = getDirection(coordinates);
      expect(result).toContain("35.6762%2C139.6503");
    });

    it("should handle high precision coordinates", () => {
      const coordinates = { lat: 48.858844, lng: 2.294351 }; // Eiffel Tower
      const result = getDirection(coordinates);
      expect(result).toContain("48.858844%2C2.294351");
    });
  });

  describe("URL encoding", () => {
    it("should properly encode coordinates with special characters", () => {
      const coordinates = { lat: 1.23, lng: 4.56 };
      const result = getDirection(coordinates);
      const url = new URL(result);
      const destination = url.searchParams.get("destination");
      expect(destination).toBe("1.23,4.56");
    });

    it("should handle URL encoding for negative coordinates", () => {
      const coordinates = { lat: -12.34, lng: -56.78 };
      const result = getDirection(coordinates);
      expect(result).toContain(encodeURIComponent("-12.34,-56.78"));
    });

    it("should encode comma separator", () => {
      const coordinates = { lat: 1.5, lng: 2.5 };
      const result = getDirection(coordinates);
      // The comma should be encoded as %2C
      expect(result).toContain("1.5%2C2.5");
    });
  });

  describe("Edge cases", () => {
    it("should handle extreme latitude values", () => {
      const coordinates = { lat: 90, lng: 0 }; // North Pole
      const result = getDirection(coordinates);
      expect(result).toContain("90%2C0");
    });

    it("should handle extreme longitude values", () => {
      const coordinates = { lat: 0, lng: 180 }; // International Date Line
      const result = getDirection(coordinates);
      expect(result).toContain("0%2C180");
    });

    it("should handle minimum latitude", () => {
      const coordinates = { lat: -90, lng: 0 }; // South Pole
      const result = getDirection(coordinates);
      expect(result).toContain("-90%2C0");
    });

    it("should handle minimum longitude", () => {
      const coordinates = { lat: 0, lng: -180 };
      const result = getDirection(coordinates);
      expect(result).toContain("0%2C-180");
    });

    it("should handle very small decimal values", () => {
      const coordinates = { lat: 0.000001, lng: 0.000001 };
      const result = getDirection(coordinates);
      expect(result).toContain("0.000001%2C0.000001");
    });
  });

  describe("Default coordinates integration", () => {
    it("should use Singapore coordinates by default", () => {
      const result = getDirection();
      const expectedLat = DEFAULT_COORDINATES.Singapore.lat;
      const expectedLng = DEFAULT_COORDINATES.Singapore.lng;
      expect(result).toContain(`${expectedLat}%2C${expectedLng}`);
    });

    it("should match default coordinates structure", () => {
      expect(DEFAULT_COORDINATES.Singapore).toHaveProperty("lat");
      expect(DEFAULT_COORDINATES.Singapore).toHaveProperty("lng");
      expect(typeof DEFAULT_COORDINATES.Singapore.lat).toBe("number");
      expect(typeof DEFAULT_COORDINATES.Singapore.lng).toBe("number");
    });

    it("should work with all available default coordinates", () => {
      const singaporeResult = getDirection(DEFAULT_COORDINATES.Singapore);
      const malaysiaResult = getDirection(DEFAULT_COORDINATES.Malaysia);

      expect(singaporeResult).toContain("google.com/maps/dir/");
      expect(malaysiaResult).toContain("google.com/maps/dir/");
      expect(singaporeResult).not.toBe(malaysiaResult);
    });
  });

  describe("Function behavior", () => {
    it("should return string", () => {
      const result = getDirection();
      expect(typeof result).toBe("string");
    });

    it("should return non-empty string", () => {
      const result = getDirection();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should be pure function - same input gives same output", () => {
      const coordinates = { lat: 1.23, lng: 4.56 };
      const result1 = getDirection(coordinates);
      const result2 = getDirection(coordinates);
      expect(result1).toBe(result2);
    });

    it("should handle undefined explicitly", () => {
      const result = getDirection(undefined);
      expect(result).toContain(DEFAULT_COORDINATES.Singapore.lat.toString());
      expect(result).toContain(DEFAULT_COORDINATES.Singapore.lng.toString());
    });
  });

  describe("Real-world coordinates", () => {
    it("should generate URL for Singapore coordinates", () => {
      const result = getDirection(DEFAULT_COORDINATES.Singapore);
      const url = new URL(result);
      const destination = url.searchParams.get("destination");
      expect(destination).toBe(
        `${DEFAULT_COORDINATES.Singapore.lat},${DEFAULT_COORDINATES.Singapore.lng}`
      );
    });

    it("should generate URL for Malaysia coordinates", () => {
      const result = getDirection(DEFAULT_COORDINATES.Malaysia);
      const url = new URL(result);
      const destination = url.searchParams.get("destination");
      expect(destination).toBe(
        `${DEFAULT_COORDINATES.Malaysia.lat},${DEFAULT_COORDINATES.Malaysia.lng}`
      );
    });

    it("should work with typical territory coordinates", () => {
      // Simulate typical territory coordinates
      const territoryCoords = { lat: 1.3521, lng: 103.8198 }; // Singapore downtown
      const result = getDirection(territoryCoords);

      expect(result).toContain("google.com/maps/dir/");
      expect(result).toContain("api=1");
      expect(result).toContain("1.3521%2C103.8198");
    });
  });

  describe("Google Maps API compliance", () => {
    it("should follow Google Maps Directions API URL format", () => {
      const result = getDirection();
      const url = new URL(result);

      // Check required components for Google Maps Directions
      expect(url.hostname).toBe("www.google.com");
      expect(url.pathname).toBe("/maps/dir/");
      expect(url.searchParams.get("api")).toBe("1");
      expect(url.searchParams.has("destination")).toBe(true);
    });

    it("should not include origin parameter (letting Google Maps detect current location)", () => {
      const result = getDirection();
      const url = new URL(result);
      expect(url.searchParams.has("origin")).toBe(false);
    });

    it("should be compatible with mobile and desktop Google Maps", () => {
      const result = getDirection();
      expect(result).toMatch(
        /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/
      );
    });
  });

  describe("Type safety and interface", () => {
    it("should accept coordinate objects with lat and lng properties", () => {
      const coords: { lat: number; lng: number } = { lat: 1.0, lng: 2.0 };
      expect(() => getDirection(coords)).not.toThrow();
    });

    it("should work with coordinate interface matching", () => {
      interface Coordinates {
        lat: number;
        lng: number;
      }

      const coords: Coordinates = { lat: 3.1416, lng: 2.7183 };
      const result = getDirection(coords);
      expect(result).toContain("3.1416%2C2.7183");
    });
  });

  describe("Performance and optimization", () => {
    it("should execute quickly", () => {
      const start = performance.now();
      getDirection();
      const end = performance.now();
      expect(end - start).toBeLessThan(10); // Should complete in less than 10ms
    });

    it("should handle multiple calls efficiently", () => {
      const coordinates = [
        { lat: 1, lng: 2 },
        { lat: 3, lng: 4 },
        { lat: 5, lng: 6 }
      ];

      const results = coordinates.map((coord) => getDirection(coord));
      expect(results).toHaveLength(3);
      expect(new Set(results).size).toBe(3); // All should be unique
    });
  });
});
