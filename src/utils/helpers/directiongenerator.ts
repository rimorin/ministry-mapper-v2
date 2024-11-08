import { DEFAULT_COORDINATES } from "../constants";

const isIOS = (): boolean => {
  // Fallback to newer UserAgentData API if available
  if ("userAgentData" in navigator) {
    const userAgentData = navigator as unknown as {
      userAgentData: { platform: string };
    };
    return userAgentData.userAgentData.platform.toLowerCase() === "ios";
  }

  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad/.test(userAgent);
};

const getDirection = (coordinates = DEFAULT_COORDINATES.Singapore) => {
  const { lat, lng } = coordinates;
  const destination = `${lat},${lng}`;

  if (isIOS()) {
    // Apple Maps URL scheme
    return `maps://maps.google.com/maps?daddr=${destination}&ll=${destination}`;
  }
  // Google Maps URL
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
};

export default getDirection;
