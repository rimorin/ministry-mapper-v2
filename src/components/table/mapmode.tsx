import { latlongInterface, territorySingleProps } from "../../utils/interface";
import {
  DEFAULT_AGGREGATES,
  DEFAULT_COORDINATES,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import { AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import HouseStatus from "./house";
import { MapCurrentTarget } from "../utils/mapcurrenttarget";
import CurrentLocationMarker from "../statics/currentlocator";
const TerritoryMapView = ({
  mapCoordinates,
  mapId,
  houses,
  aggregates,
  policy,
  handleHouseUpdate
}: territorySingleProps) => {
  const [currentLocation, setCurrentLocation] = useState<latlongInterface>();

  const [center, setCenter] = useState(
    mapCoordinates || DEFAULT_COORDINATES.Singapore
  );
  const [isLocating, setIsLocating] = useState(false);

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
  return (
    <div
      className={`${
        policy?.userRole === USER_ACCESS_LEVELS.TERRITORY_SERVANT.CODE ||
        policy?.userRole === USER_ACCESS_LEVELS.CONDUCTOR.CODE
          ? "map-body-admin"
          : "map-body"
      }`}
    >
      <Map
        mapId={`map-houses-${mapId}`}
        center={center}
        defaultCenter={mapCoordinates}
        defaultZoom={16}
        fullscreenControl={false}
        streetViewControl={false}
        clickableIcons={false}
        gestureHandling="greedy"
        onCenterChanged={(center) => {
          setCenter({
            lat: center.detail.center.lat,
            lng: center.detail.center.lng
          });
        }}
      >
        <MapCurrentTarget
          onClick={() => {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition((pos) => {
              setCenter({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              });
              setIsLocating(false);
            });
          }}
          isLocating={isLocating}
        />
        {currentLocation && (
          <AdvancedMarker
            position={{
              lat: currentLocation.lat,
              lng: currentLocation.lng
            }}
            draggable={false}
          >
            <CurrentLocationMarker />
          </AdvancedMarker>
        )}
        {houses &&
          houses.units.map((element, index) => {
            // if coordinate lat or lng is not available, don't render the marker
            if (!element.coordinates?.lat || !element.coordinates?.lng)
              return null;

            const houseType =
              element.type?.map((type) => type.code).join(", ") || "";

            return (
              <AdvancedMarker
                key={`house-${index}`}
                position={{
                  lat:
                    element.coordinates?.lat ||
                    DEFAULT_COORDINATES.Singapore.lat,
                  lng:
                    element.coordinates?.lng ||
                    DEFAULT_COORDINATES.Singapore.lng
                }}
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
                    fontSize: "14px", // Increased font size
                    color: "#fff", // Changed font color to white
                    border: "2px solid white", // Add a white border for better contrast
                    boxShadow: "0 0 5px rgba(0,0,0,0.7)" // Increased shadow for better visibility
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-5px", // Move the text slightly above the circle
                      left: "-5px", // Move the text slightly to the left of the circle
                      fontSize: "10px", // Increased font size
                      padding: "1px 3px",
                      backgroundColor: "rgba(0, 0, 0, 0.5)", // Added semi-transparent background
                      color: "#fff" // Changed font color to white
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
          })}
      </Map>
    </div>
  );
};

export default TerritoryMapView;
