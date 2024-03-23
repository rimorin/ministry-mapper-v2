import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useState, useCallback, useEffect } from "react";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import {
  AppBar,
  Dialog,
  DialogContent,
  IconButton,
  Toolbar,
  Typography,
  keyframes
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlaceIcon from "@mui/icons-material/Place";
import { AdvancedMarker, Map, MapMouseEvent } from "@vis.gl/react-google-maps";

const upDown = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;
const shake = keyframes`
  10%, 90% {
    transform: translate3d(-0.5px, 0, 0);
  }
  
  20%, 80% {
    transform: translate3d(1px, 0, 0);
  }

  30%, 50%, 70% {
    transform: translate3d(-2px, 0, 0);
  }

  40%, 60% {
    transform: translate3d(2px, 0, 0);
  }
`;
const Directions = NiceModal.create(() => {
  const modal = useModal();
  const [marker, setMarker] = useState({
    lat: 1.4345403508916295,
    lng: 103.80321216564363
  });
  const [currentLocation, setCurrentLocation] = useState({
    lat: 0,
    lng: 0
  });
  const onMapClick = useCallback((event: MapMouseEvent) => {
    setMarker({
      lat: event.detail.latLng?.lat as number,
      lng: event.detail.latLng?.lng as number
    });
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCurrentLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    });
  }, []);
  return (
    <Dialog
      open={modal.visible}
      onClose={() => modal.hide()}
      onTransitionExited={() => modal.remove()}
      fullScreen
    >
      {/* <DialogTitle>Direction</DialogTitle> */}
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => modal.hide()}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Directions
          </Typography>
        </Toolbar>
      </AppBar>
      <DialogContent>
        <Map
          mapId={"bf51a910020fa25a"}
          defaultCenter={{ lat: marker.lat, lng: marker.lng }}
          defaultZoom={16}
          onClick={onMapClick}
        >
          <AdvancedMarker position={{ lat: marker.lat, lng: marker.lng }}>
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
            <DirectionsWalkIcon
              // color=""
              fontSize="small"
              sx={{
                animation: `${shake} 2.5s cubic-bezier(.36,.07,.19,.97) both infinite`,
                transform: "translate3d(0, 0, 0)",
                backfaceVisibility: "hidden",
                perspective: "1000px"
              }}
            />
          </AdvancedMarker>
        </Map>
      </DialogContent>
      {/* </ModalDialog> */}
    </Dialog>
  );
});

export default Directions;
