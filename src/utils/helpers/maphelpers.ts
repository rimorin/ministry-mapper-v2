import { latlongInterface } from "../interface";
import { DEFAULT_COORDINATES } from "../constants";

/**
 * Validate if a coordinate has valid lat/lng numbers
 */
export const isValidCoordinate = (
  coord: unknown
): coord is latlongInterface => {
  return (
    !!coord &&
    typeof coord === "object" &&
    "lat" in coord &&
    "lng" in coord &&
    typeof coord.lat === "number" &&
    typeof coord.lng === "number"
  );
};

/**
 * Calculate the centroid of a polygon from its coordinates
 * @returns Tuple [lat, lng] for use with Leaflet Marker positions
 */
export const getPolygonCenter = (
  coordinates: latlongInterface[]
): [number, number] => {
  const latSum = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
  const lngSum = coordinates.reduce((sum, coord) => sum + coord.lng, 0);
  return [latSum / coordinates.length, lngSum / coordinates.length];
};

/**
 * Calculate the centroid of a polygon from its coordinates
 * @returns Object {lat, lng} for use with map center or other purposes
 */
export const getPolygonCenterAsObject = (
  coordinates: latlongInterface[]
): latlongInterface => {
  const [lat, lng] = getPolygonCenter(coordinates);
  return { lat, lng };
};

/**
 * Get default map center from coordinates
 * @param coordinates - Optional polygon coordinates array or single coordinate
 * @returns Default center coordinates
 */
export const getDefaultMapCenter = (
  coordinates?: latlongInterface[] | latlongInterface
): latlongInterface => {
  // Handle array of coordinates (polygon)
  if (Array.isArray(coordinates) && coordinates.length >= 3) {
    const validCoords = coordinates.filter(isValidCoordinate);
    if (validCoords.length >= 3) {
      return getPolygonCenterAsObject(validCoords);
    }
  }

  // Handle single coordinate object
  if (
    coordinates &&
    !Array.isArray(coordinates) &&
    isValidCoordinate(coordinates)
  ) {
    return coordinates;
  }

  // Ultimate fallback
  return DEFAULT_COORDINATES.Singapore;
};
