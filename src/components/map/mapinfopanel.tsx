import { ControlPosition, MapControl } from "@vis.gl/react-google-maps";
import { Card } from "react-bootstrap";
import { ControlPanelProps } from "../../utils/interface";

export const ControlPanel: React.FC<ControlPanelProps> = ({
  lat,
  lng,
  name
}) => {
  return (
    <MapControl position={ControlPosition.LEFT_BOTTOM}>
      <Card className="map-control-panel">
        {name && <Card.Header>{name}</Card.Header>}
        <Card.Body>
          <div className="map-control-panel-coordinate">Latitude: {lat}</div>
          <div className="map-control-panel-coordinate">Longitude: {lng}</div>
        </Card.Body>
      </Card>
    </MapControl>
  );
};
