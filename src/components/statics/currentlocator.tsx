import { memo } from "react";

const CurrentLocationMarker = () => (
  <div style={{ position: "relative", width: "12px", height: "12px" }}>
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        backgroundColor: "#0000FF", // Bright blue
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "black",
        fontSize: "10px",
        border: "2px solid white", // Add a white border for better contrast
        boxShadow: "0 0 3px rgba(0,0,0,0.5)", // Add a shadow for better visibility
        animation: "pulse 2s infinite" // Add pulse animation
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "2px solid rgba(0, 0, 255, 0.5)", // Blue border
          transform: "translate(-50%, -50%)",
          animation: "ripple 2s infinite"
        }}
      />
    </div>
  </div>
);

export default memo(CurrentLocationMarker);
