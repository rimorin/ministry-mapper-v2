import React, { useEffect, useState } from "react";
import { DEFAULT_COORDINATES, USER_ACCESS_LEVELS } from "../../utils/constants";
import {
  AdvancedMarker,
  ControlPosition,
  Map as Gmap,
  MapControl
} from "@vis.gl/react-google-maps";
import CurrentLocationMarker from "../statics/currentlocator";
import { addressDetails, latlongInterface } from "../../utils/interface";
import { Policy } from "../../utils/policies";
import { Card, Table } from "react-bootstrap";
import AddressMarker from "./mapmarker";
import AssignmentButtonGroup from "./assignmentbtn";
import { pb } from "../../utils/pocketbase";
import ComponentAuthorizer from "./authorizer";

interface MapListingProps {
  sortedAddressList: addressDetails[];
  policy: Policy;
}

const MapView: React.FC<MapListingProps> = ({ sortedAddressList, policy }) => {
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
  }, [sortedAddressList]);

  // if loading show a message else show the map
  if (isLoading) {
    return <div>Loading...</div>;
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
            <Card
              style={{
                width: "18rem",
                fontSize: "0.8rem"
              }}
            >
              <Card.Header className="text-center">
                <b>{selectedAddress.name}</b>
              </Card.Header>
              <Card.Body>
                <Table hover>
                  <thead>
                    <tr>
                      <td className="text-center">Not Done</td>
                      <td className="text-center">Not Home</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center">
                        {selectedAddress.aggregates.notDone}
                      </td>
                      <td className="text-center">
                        {selectedAddress.aggregates.notHome}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                userPermission={policy.userRole}
              >
                <Card.Footer className="text-center">
                  <AssignmentButtonGroup
                    key={`marker-assignments-${selectedAddress.id}`}
                    addressElement={selectedAddress}
                    policy={policy}
                    userId={pb.authStore?.record?.id as string}
                  />
                </Card.Footer>
              </ComponentAuthorizer>
            </Card>
          </MapControl>
        )}
      </Gmap>
    </div>
  );
};

export default MapView;
