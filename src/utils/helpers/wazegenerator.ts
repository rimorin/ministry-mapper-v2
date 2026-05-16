import { DEFAULT_COORDINATES } from "../constants";

const getWazeDirection = (coordinates = DEFAULT_COORDINATES.Singapore) => {
  const { lat, lng } = coordinates;
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
};

export default getWazeDirection;
