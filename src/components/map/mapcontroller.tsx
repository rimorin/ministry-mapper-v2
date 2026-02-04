import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { latlongInterface } from "../../utils/interface";

/**
 * MapController manages map position and handles user interactions
 * Uses flag to prevent infinite loops from programmatic vs user-initiated moves
 * Only applies initial zoom once, preserving user's manual zoom adjustments
 */
export const MapController: React.FC<{
  center?: latlongInterface | null;
  onCenterChange?: (center: latlongInterface) => void;
  onMapClick?: () => void;
  trigger?: number;
  zoomLevel?: number;
}> = ({ center, onCenterChange, onMapClick, trigger, zoomLevel = 18 }) => {
  const map = useMap();
  const isProgrammaticMove = useRef(false);
  const hasInitialZoom = useRef(false);

  useEffect(() => {
    if (center) {
      isProgrammaticMove.current = true;
      if (!hasInitialZoom.current) {
        map.setView([center.lat, center.lng], zoomLevel);
        hasInitialZoom.current = true;
      } else {
        map.panTo([center.lat, center.lng]);
      }
      setTimeout(() => (isProgrammaticMove.current = false), 100);
    }
  }, [center, map, trigger, zoomLevel]);

  useMapEvents({
    moveend: () => {
      if (onCenterChange && !isProgrammaticMove.current) {
        const { lat, lng } = map.getCenter();
        onCenterChange({ lat, lng });
      }
    },
    click: () => onMapClick?.()
  });

  return null;
};
