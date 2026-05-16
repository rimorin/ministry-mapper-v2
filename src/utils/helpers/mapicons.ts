import { divIcon } from "leaflet";

export const currentLocationIcon = divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="-20 -20 40 40">
    <circle r="18" class="loc-ripple-ring" fill="rgba(26,115,232,0.2)"/>
    <circle r="18" class="loc-ripple-ring loc-ripple-ring-2" fill="rgba(26,115,232,0.2)"/>
    <circle r="10" fill="white"/>
    <circle r="7" fill="#1A73E8"/>
  </svg>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

export const destinationIcon = divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="38">
    <path d="M12 1C7.03 1 3 5.03 3 10c0 6.5 9 21 9 21s9-14.5 9-21c0-4.97-4.03-9-9-9z"
          fill="#dc3545" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="3.5" fill="white" opacity="0.9"/>
  </svg>`,
  className: "",
  iconSize: [28, 38],
  iconAnchor: [14, 38]
});

export const addressMarkerIcon = divIcon({
  html: '<div class="address-marker"/>',
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});
