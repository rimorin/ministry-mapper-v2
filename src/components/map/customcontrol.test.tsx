import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MapContainer } from "react-leaflet";
import CustomControl from "./customcontrol";

describe("CustomControl", () => {
  it("renders without crashing inside MapContainer", () => {
    const { container } = render(
      <MapContainer center={[51.505, -0.09]} zoom={13}>
        <CustomControl position="topright">
          <div>Test Control</div>
        </CustomControl>
      </MapContainer>
    );
    expect(container).toBeInTheDocument();
  });

  it("renders children content", () => {
    const { getByText } = render(
      <MapContainer center={[51.505, -0.09]} zoom={13}>
        <CustomControl position="topleft">
          <div>Custom Content</div>
        </CustomControl>
      </MapContainer>
    );
    expect(getByText("Custom Content")).toBeInTheDocument();
  });

  it("accepts different control positions", () => {
    const positions: L.ControlPosition[] = [
      "topleft",
      "topright",
      "bottomleft",
      "bottomright"
    ];

    positions.forEach((position) => {
      const { container } = render(
        <MapContainer center={[51.505, -0.09]} zoom={13}>
          <CustomControl position={position}>
            <div>{position}</div>
          </CustomControl>
        </MapContainer>
      );
      expect(container).toBeInTheDocument();
    });
  });
});
