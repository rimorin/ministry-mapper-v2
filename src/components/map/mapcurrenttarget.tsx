import { Image } from "react-bootstrap";
import { getAssetUrl } from "../../utils/helpers/assetpath";
import { MapControlProps } from "../../utils/interface";

export const MapCurrentTarget: React.FC<MapControlProps> = ({ onClick }) => (
  <div className="map-current-target-container">
    <div className="map-control-button">
      <Image
        src={getAssetUrl("target.svg")}
        alt="Current target"
        width={24}
        height={24}
        style={{ cursor: "pointer" }}
        onClick={onClick}
      />
    </div>
  </div>
);
