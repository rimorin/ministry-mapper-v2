import { latlongInterface } from "../interface";
import { DEFAULT_COORDINATES } from "../constants";

export const getNextSequence = (sequences: number[]): number =>
  Math.max(0, ...sequences) + 1;

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

export const getPolygonCenterAsObject = (
  coordinates: latlongInterface[]
): latlongInterface => {
  const [lat, lng] = getPolygonCenter(coordinates);
  return { lat, lng };
};

export const getDefaultMapCenter = (
  coordinates?: latlongInterface[] | latlongInterface
): latlongInterface => {
  if (Array.isArray(coordinates) && coordinates.length >= 3) {
    const validCoords = coordinates.filter(isValidCoordinate);
    if (validCoords.length >= 3) {
      return getPolygonCenterAsObject(validCoords);
    }
  }

  if (
    coordinates &&
    !Array.isArray(coordinates) &&
    isValidCoordinate(coordinates)
  ) {
    return coordinates;
  }

  return DEFAULT_COORDINATES.Singapore;
};

export const formatDistance = (meters: number): string =>
  meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;

export const formatDuration = (seconds: number): string => {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} h ${rem} min` : `${hrs} h`;
};
