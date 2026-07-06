import { addressDetails, latlongInterface } from "../interface";
import { calculateDistance } from "./calculatedistance";

const sortByCode = <T>(items: T[]): T[] =>
  [...items].sort((a, b) =>
    ((a as { code?: string }).code ?? "").localeCompare(
      (b as { code?: string }).code ?? ""
    )
  );

const sortBySequence = <T>(items: T[]): T[] =>
  [...items].sort(
    (a, b) =>
      ((a as { sequence?: number }).sequence ?? 0) -
      ((b as { sequence?: number }).sequence ?? 0)
  );

const sortByProgress = (items: addressDetails[]): addressDetails[] =>
  [...items].sort((a, b) => a.aggregates.value - b.aggregates.value);

const sortByProximity = (
  items: addressDetails[],
  from: latlongInterface | null
): addressDetails[] => {
  if (!from) return items;
  return items
    .map((item) => ({
      item,
      distance: item.hasLocation
        ? calculateDistance(
            from.lat,
            from.lng,
            item.coordinates.lat,
            item.coordinates.lng
          )
        : Number.MAX_VALUE
    }))
    .sort((a, b) => a.distance - b.distance)
    .map(({ item, distance }) => ({
      ...item,
      distanceMeters: item.hasLocation ? distance : undefined
    }));
};

export { sortByCode, sortBySequence, sortByProgress, sortByProximity };
