import { useEffect, useState, useCallback, FormEvent } from "react";
import {
  ControlPosition,
  MapControl,
  useMap,
  useMapsLibrary
} from "@vis.gl/react-google-maps";
import {
  Container,
  Form,
  InputGroup,
  ListGroup,
  Button
} from "react-bootstrap";
import { DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION } from "../../utils/constants";
import { GmapAutocompleteProps } from "../../utils/interface";

export const GmapAutocomplete = ({
  onPlaceSelect,
  origin = DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION
}: GmapAutocompleteProps) => {
  const map = useMap();
  const places = useMapsLibrary("places");

  const [sessionToken, setSessionToken] =
    useState<google.maps.places.AutocompleteSessionToken>();
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);
  const [predictionResults, setPredictionResults] = useState<
    Array<google.maps.places.AutocompletePrediction>
  >([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!places || !map) return;

    setAutocompleteService(new places.AutocompleteService());
    setPlacesService(new places.PlacesService(map));
    setSessionToken(new places.AutocompleteSessionToken());

    return () => setAutocompleteService(null);
  }, [map, places]);

  const fetchPredictions = useCallback(
    async (value: string) => {
      if (!autocompleteService || !value || value.length < 3) {
        setPredictionResults([]);
        return;
      }

      const response = await autocompleteService.getPlacePredictions({
        input: value,
        sessionToken,
        componentRestrictions: { country: origin }
      });
      setPredictionResults(response.predictions);
    },
    [autocompleteService, sessionToken, origin]
  );

  const onInputChange = useCallback(
    (event: FormEvent<HTMLInputElement>) => {
      const value = (event.target as HTMLInputElement).value;
      setInputValue(value);

      const timerId = setTimeout(() => fetchPredictions(value), 300);
      return () => clearTimeout(timerId);
    },
    [fetchPredictions]
  );

  const handleSuggestionClick = useCallback(
    (placeId: string) => {
      if (!places || !placesService) return;

      placesService.getDetails(
        {
          placeId,
          fields: ["geometry", "name", "formatted_address"],
          sessionToken
        },
        (placeDetails) => {
          onPlaceSelect(placeDetails);
          setPredictionResults([]);
          setInputValue(placeDetails?.formatted_address ?? "");
          setSessionToken(new places.AutocompleteSessionToken());
        }
      );
    },
    [onPlaceSelect, places, placesService, sessionToken]
  );

  const handleClearInput = () => {
    setInputValue("");
    setPredictionResults([]);
  };

  return (
    <MapControl position={ControlPosition.INLINE_START_BLOCK_START}>
      <Container className="map-autocomplete-container">
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Search for a place"
            value={inputValue}
            onInput={onInputChange}
            className="map-autocomplete-input"
            aria-label="Search for a place"
            aria-autocomplete="list"
            aria-controls="autocomplete-results"
            autoComplete="off"
          />
          {inputValue && (
            <Button
              variant="light"
              onClick={handleClearInput}
              className="map-autocomplete-clear-btn"
              aria-label="Clear search"
            >
              ✕
            </Button>
          )}
        </InputGroup>
        {predictionResults.length > 0 && (
          <ListGroup as="ul" id="autocomplete-results">
            {predictionResults.map(({ place_id, description }) => (
              <ListGroup.Item
                as="li"
                action
                key={place_id}
                onClick={() => handleSuggestionClick(place_id)}
                role="option"
              >
                {description}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Container>
    </MapControl>
  );
};
