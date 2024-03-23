import React, { useRef, useEffect, useState } from "react";
import {
  ControlPosition,
  MapControl,
  useMapsLibrary
} from "@vis.gl/react-google-maps";
import { Input } from "@mui/material";

interface Props {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
}

// This is an example of the classic "Place Autocomplete" widget.
// https://developers.google.com/maps/documentation/javascript/place-autocomplete
export const PlaceAutocompleteClassic = ({ onPlaceSelect }: Props) => {
  const [placeAutocomplete, setPlaceAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary("places");

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ["geometry", "name", "formatted_address"]
    };

    setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener("place_changed", () => {
      onPlaceSelect(placeAutocomplete.getPlace());
    });
  }, [onPlaceSelect, placeAutocomplete]);

  return (
    <MapControl position={ControlPosition.TOP}>
      {" "}
      <div className="autocomplete-control">
        <div className="autocomplete-container">
          <Input
            inputRef={inputRef}
            sx={{
              width: "100%",
              // padding: "0.5rem",
              // borderRadius: "0.5rem",
              border: "1px solid #ccc",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}
          />
        </div>
      </div>
    </MapControl>
  );
};
