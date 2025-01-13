import { DEFAULT_COORDINATES } from "../constants";

const getDirection = (coordinates = DEFAULT_COORDINATES.Singapore) => {
  const { lat, lng } = coordinates;
  const destination = `${lat},${lng}`;
  // Google Maps URL
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
};

export default getDirection;
