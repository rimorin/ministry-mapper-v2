import React, { useEffect, useState } from "react";
import { DEFAULT_COORDINATES, USER_ACCESS_LEVELS } from "../../utils/constants";
import {
  AdvancedMarker,
  ControlPosition,
  Map as Gmap,
  MapControl
} from "@vis.gl/react-google-maps";
import CurrentLocationMarker from "../statics/currentlocator";
import {
  addressDetails,
  latlongInterface,
  MapViewProps
} from "../../utils/interface";
import { Card, Table } from "react-bootstrap";
import AddressMarker from "./mapmarker";
import AssignmentButtonGroup from "./assignmentbtn";
import { getUser } from "../../utils/pocketbase";
import ComponentAuthorizer from "./authorizer";
import MapPlaceholder from "../statics/placeholder";

const MapView: React.FC<MapViewProps> = ({ sortedAddressList, policy }) => {
  const defaultCenter =
    sortedAddressList[0]?.coordinates || DEFAULT_COORDINATES;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentLocation, setCurrentLocation] = useState<latlongInterface>();
  const [center, setCenter] = useState<latlongInterface>();
  const [selectedAddress, setSelectedAddress] = useState<addressDetails | null>(
    null
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
    setIsLoading(false);

    return () => {
      setIsLoading(true);
      setSelectedAddress(null);
    };
  }, []);

  // if loading show a placeholder with the appropriate height
  if (isLoading) {
    return <MapPlaceholder policy={policy} rows={6} columns={3} />;
  }

  if (sortedAddressList.length === 0) {
    return <div>No addresses found</div>;
  }

  return (
    <div className="map-view-admin">
      <Gmap
        mapId={`map-territory`}
        center={center}
        defaultCenter={defaultCenter}
        defaultZoom={18}
        cameraControlOptions={{
          position: ControlPosition.RIGHT_TOP
        }}
        fullscreenControl={false}
        streetViewControl={false}
        clickableIcons={false}
        gestureHandling="greedy"
        onCenterChanged={(center) => setCenter(center.detail.center)}
      >
        {currentLocation && (
          <AdvancedMarker position={currentLocation} draggable={false}>
            <CurrentLocationMarker />
          </AdvancedMarker>
        )}
        {sortedAddressList &&
          sortedAddressList.map((addressElement) => {
            const isSelected = selectedAddress?.id === addressElement.id;
            return (
              <AddressMarker
                key={`map-marker-${addressElement.id}`}
                addressElement={addressElement}
                isSelected={isSelected}
                onClick={() => {
                  setSelectedAddress(addressElement);
                  setCenter(addressElement.coordinates);
                }}
              />
            );
          })}
        {selectedAddress && (
          <MapControl position={ControlPosition.RIGHT_BOTTOM}>
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
                      key={`marker-assignments-${selectedAddress.id}`}
                      addressElement={selectedAddress}
                      policy={policy}
                      userId={getUser("id") as string}
                    />
                  </div>
                </ComponentAuthorizer>
              </Card.Body>
            </Card>
          </MapControl>
        )}
      </Gmap>
    </div>
  );
};

export default MapView;
