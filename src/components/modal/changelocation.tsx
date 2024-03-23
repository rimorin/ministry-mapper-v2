import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { firestore } from "../../firebase";
import PlaceIcon from "@mui/icons-material/Place";
import { ChangeMapLocationModalProps } from "../../utils/interface";
import { doc, updateDoc } from "firebase/firestore";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  keyframes
} from "@mui/material";
import {
  AdvancedMarker,
  ControlPosition,
  Map,
  MapControl,
  MapMouseEvent,
  useMapsLibrary
} from "@vis.gl/react-google-maps";
import { PlaceAutocompleteClassic } from "../utils/mapAutocomplete";
import MapHandler from "../utils/mapHandler";
import MyLocationIcon from "@mui/icons-material/MyLocation";

const upDown = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;
const expandShrink = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
`;

const ChangeMapLocation = NiceModal.create(
  ({ congregation, mapId, location, name }: ChangeMapLocationModalProps) => {
    const [currentLocation, setCurrentLocation] = useState({
      lat: location?.latitude || 0,
      lng: location?.longitude || 0
    });
    const [mapLocation, setMapLocation] = useState({
      lat: location?.latitude || 0,
      lng: location?.longitude || 0
    });
    const [selectedPlace, setSelectedPlace] =
      useState<google.maps.places.PlaceResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const places = useMapsLibrary("places");
    const modal = useModal();
    const [placeAutocomplete, setPlaceAutocomplete] =
      useState<google.maps.places.Autocomplete | null>(null);

    const ControlPanel = () => {
      return (
        <div className="control-panel">
          <h3>{name}</h3>

          <p>
            {/* lat long information */}
            <strong>Current Location:</strong> {mapLocation.lat},{" "}
            {mapLocation.lng}
          </p>
        </div>
      );
    };

    const onMapClick = useCallback((event: MapMouseEvent) => {
      setMapLocation({
        lat: event.detail.latLng?.lat as number,
        lng: event.detail.latLng?.lng as number
      });
    }, []);

    useEffect(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        // if current location is not set, set it to the current location
        if (!currentLocation.lat && !currentLocation.lng) {
          setCurrentLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        }
      });

      if (!inputRef.current) return;
      if (!places) return;
      setPlaceAutocomplete(
        new places.Autocomplete(inputRef.current, {
          fields: ["geometry", "name", "formatted_address"]
        })
      );
    }, []);

    useEffect(() => {
      if (!placeAutocomplete) return;

      placeAutocomplete.addListener("place_changed", () => {
        if (!placeAutocomplete.getPlace()) return;
        setMapLocation({
          lat:
            (placeAutocomplete
              .getPlace()
              .geometry?.location?.lat() as number) || 0,
          lng:
            (placeAutocomplete
              .getPlace()
              .geometry?.location?.lng() as number) || 0
        });
        // get lat and lng
      });
    }, [placeAutocomplete]);
    return (
      <Dialog open={modal.visible} onClose={() => modal.hide()} fullScreen>
        <DialogTitle align="center">Change Location</DialogTitle>
        <DialogContent dividers>
          <Map
            mapId={"bf51a910020fa25a"}
            defaultCenter={{
              lat: currentLocation.lat,
              lng: currentLocation.lng
            }}
            onCenterChanged={(center) => {
              setCurrentLocation({
                lat: center.detail.center.lat,
                lng: center.detail.center.lng
              });
            }}
            // center={{
            //   lat: currentLocation.lat,
            //   lng: currentLocation.lng
            // }}
            // onCenterChanged={(center) => {
            //   setCurrentLocation({
            //     lat: center.detail.center.lat,
            //     lng: center.detail.center.lng
            //   });
            // }}
            defaultZoom={16}
            onClick={onMapClick}
            // disable full screen button
            fullscreenControl={false}
            streetViewControl={false}
          >
            <ControlPanel />
            <PlaceAutocompleteClassic
              onPlaceSelect={(place) => {
                if (place && place.geometry && place.geometry.location) {
                  setMapLocation({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                  });
                  setSelectedPlace(place);
                }
              }}
            />
            <MapControl position={ControlPosition.INLINE_END_BLOCK_END}>
              <IconButton
                sx={{
                  // position: "absolute",
                  // top: 10,
                  right: 10
                }}
                color="default"
                onClick={() => {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setCurrentLocation({
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude
                    });
                    // set google map location to current location
                    setMapLocation({
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude
                    });
                  });
                }}
              >
                <MyLocationIcon />
              </IconButton>
            </MapControl>

            <AdvancedMarker
              position={{ lat: mapLocation.lat, lng: mapLocation.lng }}
            >
              <PlaceIcon
                fontSize="large"
                sx={{
                  animation: `${upDown} 2s ease-in-out infinite`,
                  // strong red color
                  color: "#ff0000"
                }}
              />
            </AdvancedMarker>
            <AdvancedMarker
              position={{
                lat: currentLocation.lat,
                lng: currentLocation.lng
              }}
            >
              <MyLocationIcon
                fontSize="small"
                sx={{
                  animation: `${expandShrink} 2s linear infinite`,
                  backfaceVisibility: "hidden",
                  perspective: "1000px"
                }}
              />
            </AdvancedMarker>
            <MapHandler place={selectedPlace} />
          </Map>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={() => modal.hide()} color="primary">
            Cancel
          </Button>
          <Button
            autoFocus
            onClick={() => {
              updateDoc(
                doc(firestore, `congregations/${congregation}/maps`, mapId),
                {
                  location: {
                    latitude: mapLocation.lat,
                    longitude: mapLocation.lng
                  }
                }
              )
                .then(() => {
                  modal.hide();
                })
                .catch((error) => {
                  // errorHandler(error);
                  alert(error);
                });
            }}
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
        {/* <ModalFooter
          handleClick={modal.hide}
          userAccessLevel={footerSaveAcl}
          // isSaving={isSaving}
          submitLabel="Change"
        /> */}
      </Dialog>
    );
  }
);

export default ChangeMapLocation;
