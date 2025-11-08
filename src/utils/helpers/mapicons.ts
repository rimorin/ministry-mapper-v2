import { divIcon } from "leaflet";

export const currentLocationIcon = divIcon({
  html: '<div class="current-location-marker-ripple"/>',
  className: "current-location-marker",
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export const destinationIcon = divIcon({
  html: '<div class="destination-marker"/>',
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

export const addressMarkerIcon = divIcon({
  html: '<div class="address-marker"/>',
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});
