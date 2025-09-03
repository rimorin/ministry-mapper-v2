import { MapControl, ControlPosition } from "@vis.gl/react-google-maps";
import { Image } from "react-bootstrap";
import { getAssetUrl } from "../../utils/helpers/assetpath";

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
        src={getAssetUrl("target.svg")}
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
