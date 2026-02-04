import { territorySingleProps } from "../../utils/interface";
import { DEFAULT_AGGREGATES, DEFAULT_COORDINATES } from "../../utils/constants";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { divIcon } from "leaflet";
import { useState } from "react";
import { currentLocationIcon } from "../../utils/helpers/mapicons";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import { MapController } from "../map/mapcontroller";
import CustomControl from "../map/customcontrol";
import useGeolocation from "../../hooks/useGeolocation";

const TerritoryMapView = ({
  houses,
  policy,
  addressDetails,
  handleHouseUpdate
}: territorySingleProps) => {
  const mapCoordinates = addressDetails?.coordinates;
  const aggregates = addressDetails?.aggregates;
  const { currentLocation } = useGeolocation();
  const [center, setCenter] = useState(
    mapCoordinates || DEFAULT_COORDINATES.Singapore
  );

  const houseMarkers = () =>
    houses?.units.map((element, index) => {
      if (!element.coordinates?.lat || !element.coordinates?.lng) return null;

      const houseType = element.type?.map((type) => type.code).join(", ") || "";
      const className =
        policy?.getUnitColor(
          element,
          aggregates.value || DEFAULT_AGGREGATES.value
        ) || "";

      // Use data attributes to pass status info to CSS
      // CSS renders status icons (✅, ✖️, 🚫, nhcount) via ::after pseudo-elements
      // This avoids string concatenation and conditional logic in JS
      const houseIcon = divIcon({
        html: `<div data-id="${element.id}" data-floor="${element.floor}" data-status="${element.status}" data-nhcount="${element.nhcount}" class="map-marker ${className}">
          <div class="map-marker-label">${houseType}</div>
        </div>`,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      return (
        <Marker
          key={`housemark-${element.id}-${index}`}
          position={[element.coordinates.lat, element.coordinates.lng]}
          icon={houseIcon}
          eventHandlers={{
            click: (e) => {
              const markerElement = e.sourceTarget.getElement();
              const targetElement =
                markerElement?.querySelector("[data-id]") || markerElement;
              handleHouseUpdate({
                ...e,
                currentTarget: targetElement
              } as unknown as React.MouseEvent<HTMLElement>);
            }
          }}
        />
      );
    });

  return (
    <div className={policy.isFromAdmin() ? "map-body-admin" : "gmap-body"}>
      <MapContainer
        center={[mapCoordinates.lat, mapCoordinates.lng]}
        zoom={17}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapController
          center={center}
          onCenterChange={setCenter}
          zoomLevel={17}
        />
        {currentLocation && (
          <>
            <CustomControl position="topright">
              <MapCurrentTarget
                onClick={() => {
                  setCenter({ ...currentLocation });
                }}
              />
            </CustomControl>
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={currentLocationIcon}
            />
          </>
        )}
        {houseMarkers()}
      </MapContainer>
    </div>
  );
};

export default TerritoryMapView;
