import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { latlongInterface } from "../../utils/interface";

/**
 * MapController manages map position and handles user interactions
 * Uses flag to prevent infinite loops from programmatic vs user-initiated moves
 */
export const MapController: React.FC<{
  center?: latlongInterface | null;
  onCenterChange?: (center: latlongInterface) => void;
  onMapClick?: () => void;
  trigger?: number;
}> = ({ center, onCenterChange, onMapClick, trigger }) => {
  const map = useMap();
  const isProgrammaticMove = useRef(false);

  useEffect(() => {
    if (center) {
      isProgrammaticMove.current = true;
      map.setView([center.lat, center.lng], map.getZoom());
      setTimeout(() => (isProgrammaticMove.current = false), 100);
    }
  }, [center, map, trigger]);

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
