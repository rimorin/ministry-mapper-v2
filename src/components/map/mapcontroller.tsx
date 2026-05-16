import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { latlongInterface } from "../../utils/interface";

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
    }
  }, [center, map, trigger, zoomLevel]);

  useMapEvents({
    moveend: () => {
      if (isProgrammaticMove.current) {
        isProgrammaticMove.current = false;
        return;
      }
      if (onCenterChange) {
        const { lat, lng } = map.getCenter();
        onCenterChange({ lat, lng });
      }
    },
    click: () => onMapClick?.()
  });

  return null;
};
