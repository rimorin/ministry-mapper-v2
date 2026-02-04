import { describe, it, expect } from "vitest";
import {
  getPolygonCenter,
  getPolygonCenterAsObject,
  isValidCoordinate,
  getDefaultMapCenter
} from "./maphelpers";
import { DEFAULT_COORDINATES } from "../constants";

describe("isValidCoordinate", () => {
  it("should return true for valid coordinates", () => {
    expect(isValidCoordinate({ lat: 1.3521, lng: 103.8198 })).toBe(true);
    expect(isValidCoordinate({ lat: 0, lng: 0 })).toBe(true);
    expect(isValidCoordinate({ lat: -90, lng: -180 })).toBe(true);
  });

  it("should return false for invalid coordinates", () => {
    expect(isValidCoordinate(null)).toBe(false);
    expect(isValidCoordinate(undefined)).toBe(false);
    expect(isValidCoordinate({})).toBe(false);
    expect(isValidCoordinate({ lat: "1.3521", lng: 103.8198 })).toBe(false);
    expect(isValidCoordinate({ lat: 1.3521, lng: "103.8198" })).toBe(false);
    expect(isValidCoordinate({ lat: 1.3521 })).toBe(false);
    expect(isValidCoordinate({ lng: 103.8198 })).toBe(false);
  });
});

describe("getPolygonCenter", () => {
  it("should calculate center of a triangle", () => {
    const coordinates = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 3 },
      { lat: 3, lng: 0 }
    ];

    const [lat, lng] = getPolygonCenter(coordinates);
    expect(lat).toBe(1); // (0 + 0 + 3) / 3 = 1
    expect(lng).toBe(1); // (0 + 3 + 0) / 3 = 1
  });

  it("should calculate center of a square", () => {
    const coordinates = [
      { lat: 1, lng: 1 },
      { lat: 1, lng: 3 },
      { lat: 3, lng: 3 },
      { lat: 3, lng: 1 }
    ];

    const [lat, lng] = getPolygonCenter(coordinates);
    expect(lat).toBe(2); // (1 + 1 + 3 + 3) / 4 = 2
    expect(lng).toBe(2); // (1 + 3 + 3 + 1) / 4 = 2
  });

  it("should handle real Singapore coordinates", () => {
    const coordinates = [
      { lat: 1.29027, lng: 103.851959 },
      { lat: 1.29027, lng: 103.852959 },
      { lat: 1.29127, lng: 103.851959 }
    ];

    const [lat, lng] = getPolygonCenter(coordinates);
    expect(lat).toBeCloseTo(1.29061, 4);
    expect(lng).toBeCloseTo(103.852292, 4);
  });
});

describe("getPolygonCenterAsObject", () => {
  it("should return center as object with lat/lng properties", () => {
    const coordinates = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 3 },
      { lat: 3, lng: 0 }
    ];

    const center = getPolygonCenterAsObject(coordinates);
    expect(center).toHaveProperty("lat");
    expect(center).toHaveProperty("lng");
    expect(center.lat).toBe(1);
    expect(center.lng).toBe(1);
  });

  it("should match getPolygonCenter results", () => {
    const coordinates = [
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
      { lat: 5, lng: 6 }
    ];

    const [tupleLatLat, tupleLng] = getPolygonCenter(coordinates);
    const objectCenter = getPolygonCenterAsObject(coordinates);

    expect(objectCenter.lat).toBe(tupleLatLat);
    expect(objectCenter.lng).toBe(tupleLng);
  });
});

describe("getDefaultMapCenter", () => {
  describe("with polygon coordinates", () => {
    it("should return polygon center for valid polygon (3+ points)", () => {
      const polygon = [
        { lat: 1, lng: 1 },
        { lat: 1, lng: 3 },
        { lat: 3, lng: 1 }
      ];

      const center = getDefaultMapCenter(polygon);

      expect(center.lat).toBeCloseTo(1.67, 1);
      expect(center.lng).toBeCloseTo(1.67, 1);
    });

    it("should fallback to Singapore for invalid polygon (< 3 points)", () => {
      const invalidPolygon = [
        { lat: 1, lng: 1 },
        { lat: 1, lng: 3 }
      ];

      const center = getDefaultMapCenter(invalidPolygon);

      expect(center).toEqual(DEFAULT_COORDINATES.Singapore);
    });

    it("should filter out invalid coordinates in polygon", () => {
      const mixedPolygon = [
        { lat: 1, lng: 1 },
        { lat: "invalid", lng: 2 }, // Invalid
        { lat: 1, lng: 3 },
        { lat: 3, lng: 1 }
      ];

      const center = getDefaultMapCenter(
        mixedPolygon as Array<{ lat: number; lng: number }>
      );

      // Should use only 3 valid coordinates
      expect(center.lat).toBeCloseTo(1.67, 1);
      expect(center.lng).toBeCloseTo(1.67, 1);
    });
  });

  describe("with single coordinate object", () => {
    it("should return the coordinate itself if valid", () => {
      const coordinate = { lat: 1.3521, lng: 103.8198 };

      const center = getDefaultMapCenter(coordinate);

      expect(center).toEqual(coordinate);
    });

    it("should fallback to Singapore if coordinate is invalid", () => {
      const invalidCoordinate = { lat: "1.3521", lng: 103.8198 };

      const center = getDefaultMapCenter(
        invalidCoordinate as unknown as { lat: number; lng: number }
      );

      expect(center).toEqual(DEFAULT_COORDINATES.Singapore);
    });
  });

  describe("fallback priority", () => {
    it("should prioritize valid polygon over default", () => {
      const polygon = [
        { lat: 1, lng: 1 },
        { lat: 1, lng: 3 },
        { lat: 3, lng: 1 }
      ];

      const center = getDefaultMapCenter(polygon);

      // Should use polygon center
      expect(center.lat).toBeCloseTo(1.67, 1);
      expect(center.lng).toBeCloseTo(1.67, 1);
    });

    it("should prioritize valid coordinate over default", () => {
      const coordinate = { lat: 2.5, lng: 2.5 };

      const center = getDefaultMapCenter(coordinate);

      // Should use coordinate
      expect(center).toEqual(coordinate);
    });

    it("should fallback to Singapore when all inputs invalid", () => {
      const center = getDefaultMapCenter(undefined);

      expect(center).toEqual(DEFAULT_COORDINATES.Singapore);
    });
  });

  describe("edge cases", () => {
    it("should handle empty array", () => {
      const center = getDefaultMapCenter([]);

      expect(center).toEqual(DEFAULT_COORDINATES.Singapore);
    });

    it("should handle null coordinates", () => {
      const center = getDefaultMapCenter(null as unknown as undefined);

      expect(center).toEqual(DEFAULT_COORDINATES.Singapore);
    });

    it("should handle undefined coordinates and origin", () => {
      const center = getDefaultMapCenter();

      expect(center).toEqual(DEFAULT_COORDINATES.Singapore);
    });

    it("should handle negative coordinates", () => {
      const coordinate = { lat: -33.8688, lng: 151.2093 }; // Sydney

      const center = getDefaultMapCenter(coordinate);

      expect(center).toEqual(coordinate);
    });

    it("should handle zero coordinates", () => {
      const coordinate = { lat: 0, lng: 0 };

      const center = getDefaultMapCenter(coordinate);

      expect(center).toEqual(coordinate);
    });
  });
});
