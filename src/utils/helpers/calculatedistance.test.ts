import { describe, it, expect } from "vitest";
import { calculateDistance } from "./calculatedistance";

describe("calculateDistance", () => {
  it("should calculate distance between two points correctly", () => {
    // Distance between New York City and Los Angeles (approx 3936 km)
    const nyLat = 40.7128;
    const nyLon = -74.006;
    const laLat = 34.0522;
    const laLon = -118.2437;

    const distance = calculateDistance(nyLat, nyLon, laLat, laLon);
    expect(distance).toBeGreaterThan(3900000); // > 3900 km
    expect(distance).toBeLessThan(4000000); // < 4000 km
  });

  it("should return 0 for same location", () => {
    const lat = 40.7128;
    const lon = -74.006;

    const distance = calculateDistance(lat, lon, lat, lon);
    expect(distance).toBe(0);
  });

  it("should calculate short distances accurately", () => {
    // Two points approximately 100 meters apart
    const lat1 = 1.3521;
    const lon1 = 103.8198;
    const lat2 = 1.353;
    const lon2 = 103.8198;

    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(110);
  });
});
