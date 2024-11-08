import { MapControl, ControlPosition } from "@vis.gl/react-google-maps";
import { Image } from "react-bootstrap";
interface MapControlProps {
  onClick: () => void;
  isLocating?: boolean;
}

export const MapCurrentTarget: React.FC<MapControlProps> = ({
  onClick,
  isLocating = false
}) => {
  return (
    <MapControl position={ControlPosition.INLINE_END_BLOCK_END}>
      <Image
        src="https://assets.ministry-mapper.com/target.svg"
        alt="Current target"
        style={{
          cursor: "pointer",
          marginRight: "20px",
          animation: isLocating ? "spinLocator 2s linear infinite" : ""
        }}
        onClick={onClick}
      />
    </MapControl>
  );
};
