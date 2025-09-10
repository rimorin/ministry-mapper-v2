import { latlongInterface, territorySingleProps } from "../../utils/interface";
import { DEFAULT_AGGREGATES, DEFAULT_COORDINATES } from "../../utils/constants";
import { AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import { useEffect, useState, useMemo } from "react";
import HouseStatus from "./house";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import CurrentLocationMarker from "../statics/currentlocator";
const TerritoryMapView = ({
  houses,
  policy,
  addressDetails,
  handleHouseUpdate
}: territorySingleProps) => {
  const mapCoordinates = addressDetails?.coordinates;
  const mapId = addressDetails?.id;
  const aggregates = addressDetails?.aggregates;
  const [currentLocation, setCurrentLocation] = useState<latlongInterface>();

  const [center, setCenter] = useState(
    mapCoordinates || DEFAULT_COORDINATES.Singapore
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    }
  }, []);

  const houseMarkers = useMemo(() => {
    return houses?.units.map((element, index) => {
      if (!element.coordinates?.lat || !element.coordinates?.lng) return null;

      const houseType = element.type?.map((type) => type.code).join(", ") || "";

      return (
        <AdvancedMarker
          key={`housemark-${element.id}-${index}`}
          position={element.coordinates}
          draggable={false}
          onClick={handleHouseUpdate}
        >
          <div
            data-id={element.id}
            data-floor={element.floor}
            className={`${policy?.getUnitColor(
              element,
              aggregates.value || DEFAULT_AGGREGATES.value
            )}`}
            style={{
              position: "relative",
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              color: "#fff",
              border: "2px solid white",
              boxShadow: "0 0 5px rgba(0,0,0,0.7)"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-5px",
                left: "-5px",
                fontSize: "10px",
                padding: "1px 3px",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                color: "#fff"
              }}
            >
              {houseType}
            </div>
            <HouseStatus
              type={element.type}
              note={element.note}
              status={element.status}
              nhcount={element.nhcount}
              defaultOption={policy?.defaultType}
            />
          </div>
        </AdvancedMarker>
      );
    });
  }, [houses, policy, aggregates, handleHouseUpdate]);

  return (
    <div className={policy.isFromAdmin() ? "map-body-admin" : "gmap-body"}>
      <Map
        mapId={`map-houses-${mapId}`}
        center={center}
        defaultCenter={mapCoordinates}
        defaultZoom={16}
        fullscreenControl={false}
        streetViewControl={false}
        clickableIcons={false}
        gestureHandling="greedy"
        onCenterChanged={(center) => setCenter(center.detail.center)}
      >
        <MapCurrentTarget onClick={() => setCenter(mapCoordinates)} />
        {currentLocation && (
          <AdvancedMarker position={currentLocation} draggable={false}>
            <CurrentLocationMarker />
          </AdvancedMarker>
        )}
        {houseMarkers}
      </Map>
    </div>
  );
};

export default TerritoryMapView;
