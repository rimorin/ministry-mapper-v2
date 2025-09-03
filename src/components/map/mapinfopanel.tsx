import { ControlPosition, MapControl } from "@vis.gl/react-google-maps";
import { Card } from "react-bootstrap";

interface ControlPanelProps {
  lat: number;
  lng: number;
  name?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  lat,
  lng,
  name
}) => {
  return (
    <MapControl position={ControlPosition.LEFT_BOTTOM}>
      <Card
        style={{
          width: "14rem",
          margin: "24px",
          fontSize: "0.8rem"
        }}
      >
        {name && <Card.Header>{name}</Card.Header>}
        <Card.Body>
          <div
            style={{
              maxWidth: "90%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            Latitude: {lat}
          </div>
          <div
            style={{
              maxWidth: "90%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            Longitude: {lng}
          </div>
        </Card.Body>
      </Card>
    </MapControl>
  );
};
