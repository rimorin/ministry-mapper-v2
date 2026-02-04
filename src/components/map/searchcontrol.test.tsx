import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MapContainer } from "react-leaflet";
import { SearchControl } from "./searchcontrol";

// Mock leaflet-geosearch
vi.mock("leaflet-geosearch", () => ({
  GeoSearchControl: vi.fn(() => ({
    addTo: vi.fn(),
    remove: vi.fn()
  })),
  LocationIQProvider: vi.fn()
}));

describe("SearchControl", () => {
  const mockOnLocationSelect = vi.fn();
  const testOrigin = "SG";

  it("renders without crashing inside MapContainer", () => {
    const { container } = render(
      <MapContainer center={[1.3521, 103.8198]} zoom={13}>
        <SearchControl
          onLocationSelect={mockOnLocationSelect}
          origin={testOrigin}
        />
      </MapContainer>
    );
    expect(container).toBeInTheDocument();
  });

  it("accepts origin parameter", () => {
    const { container } = render(
      <MapContainer center={[1.3521, 103.8198]} zoom={13}>
        <SearchControl onLocationSelect={mockOnLocationSelect} origin="MY" />
      </MapContainer>
    );
    expect(container).toBeInTheDocument();
  });

  it("accepts onLocationSelect callback", () => {
    const customCallback = vi.fn();
    const { container } = render(
      <MapContainer center={[1.3521, 103.8198]} zoom={13}>
        <SearchControl onLocationSelect={customCallback} origin={testOrigin} />
      </MapContainer>
    );
    expect(container).toBeInTheDocument();
  });
});
