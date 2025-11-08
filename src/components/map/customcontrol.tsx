import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-leaflet";
import L from "leaflet";

const CustomControl: React.FC<{
  position: L.ControlPosition;
  children: ReactNode;
}> = ({ position, children }) => {
  const map = useMap();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const control = L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create("div");
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        setContainer(div);
        return div;
      },
      onRemove: () => setContainer(null)
    });

    const instance = new control({ position });
    map.addControl(instance);

    return () => {
      map.removeControl(instance);
      setContainer(null);
    };
  }, [map, position]);

  return container ? createPortal(children, container) : null;
};

export default CustomControl;
