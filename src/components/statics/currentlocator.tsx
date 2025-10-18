import { memo } from "react";

const CurrentLocationMarker = () => (
  <div style={{ position: "relative", width: "12px", height: "12px" }}>
    <div className="current-location-marker">
      <div className="current-location-ripple" />
    </div>
  </div>
);

export default memo(CurrentLocationMarker);
