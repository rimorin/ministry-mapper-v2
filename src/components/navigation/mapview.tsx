import "leaflet/dist/leaflet.css";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { DEFAULT_COORDINATES, USER_ACCESS_LEVELS } from "../../utils/constants";
import { currentLocationIcon } from "../../utils/helpers/mapicons";
import {
  addressDetails,
  latlongInterface,
  MapViewProps
} from "../../utils/interface";
import { Card, Table } from "react-bootstrap";
import AddressMarker from "../map/marker";
import AssignmentButtonGroup from "./assignmentbtn";
import { getUser } from "../../utils/pocketbase";
import ComponentAuthorizer from "./authorizer";
import MapPlaceholder from "../statics/placeholder";
import { MapController } from "../map/mapcontroller";
import CustomControl from "../map/customcontrol";
import useGeolocation from "../../hooks/useGeolocation";

const RING_LEGEND = [
  { color: "var(--mm-success)", labelKey: "navigation.normalRing" },
  { color: "var(--mm-warning)", labelKey: "navigation.personalRing" },
  { color: "#00f", labelKey: "navigation.progressRing" }
] as const;

const MapView: React.FC<MapViewProps> = ({ sortedAddressList, policy }) => {
  const { t } = useTranslation();
  const [isLoading] = useState(false);
  const { currentLocation } = useGeolocation();
  const [center, setCenter] = useState<latlongInterface>();
  const [selectedAddress, setSelectedAddress] = useState<addressDetails | null>(
    null
  );

  if (isLoading) return <MapPlaceholder policy={policy} rows={6} columns={3} />;
  if (!sortedAddressList.length) return <div>No addresses found</div>;

  const defaultCenter = sortedAddressList[0].coordinates || DEFAULT_COORDINATES;

  return (
    <div className="map-view-admin">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={18}
        style={{ height: "100%", width: "100%" }}
        zoomControl
        scrollWheelZoom
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapController
          center={center}
          onCenterChange={setCenter}
          onMapClick={() => setSelectedAddress(null)}
          zoomLevel={18}
        />
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={currentLocationIcon}
          />
        )}
        {sortedAddressList.map((addressElement) => (
          <AddressMarker
            key={addressElement.id}
            addressElement={addressElement}
            isSelected={selectedAddress?.id === addressElement.id}
            onClick={() => {
              setSelectedAddress(addressElement);
              setCenter(addressElement.coordinates);
            }}
          />
        ))}
        <CustomControl position="topright">
          <Card className="marker-info-card marker-legend-card">
            <Card.Header className="text-center py-1">
              <b>{t("navigation.markerGuide")}</b>
            </Card.Header>
            <Card.Body className="p-1">
              {RING_LEGEND.map(({ color, labelKey }) => (
                <div
                  key={color}
                  className="d-flex align-items-center gap-1 px-1"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <circle
                      cx="8"
                      cy="8"
                      r="5"
                      fill="none"
                      style={{ stroke: color }}
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="small">{t(labelKey)}</span>
                </div>
              ))}
            </Card.Body>
          </Card>
        </CustomControl>
        {selectedAddress && (
          <CustomControl position="bottomright">
            <Card className="marker-info-card">
              <Card.Header className="text-center py-2">
                <b>{selectedAddress.name}</b>
              </Card.Header>
              <Card.Body className="p-1">
                <Table size="sm" hover responsive className="mb-1">
                  <thead>
                    <tr>
                      <th className="text-center small">Not Done</th>
                      <th className="text-center small">Not Home</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center small">
                        {selectedAddress.aggregates.notDone}
                      </td>
                      <td className="text-center small">
                        {selectedAddress.aggregates.notHome}
                      </td>
                    </tr>
                  </tbody>
                </Table>
                <ComponentAuthorizer
                  requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                  userPermission={policy.userRole}
                >
                  <div className="text-center">
                    <AssignmentButtonGroup
                      key={selectedAddress.id}
                      addressElement={selectedAddress}
                      policy={policy}
                      userId={getUser("id") as string}
                    />
                  </div>
                </ComponentAuthorizer>
              </Card.Body>
            </Card>
          </CustomControl>
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
