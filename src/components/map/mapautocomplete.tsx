import { useEffect, useState, useCallback, FormEvent, useRef } from "react";
import {
  ControlPosition,
  MapControl,
  useMapsLibrary
} from "@vis.gl/react-google-maps";
import {
  Container,
  Form,
  InputGroup,
  ListGroup,
  Button
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION } from "../../utils/constants";
import { GmapAutocompleteProps } from "../../utils/interface";
import errorHandler from "../../utils/helpers/errorhandler";

export const GmapAutocomplete = ({
  onPlaceSelect,
  origin = DEFAULT_MAP_DIRECTION_CONGREGATION_LOCATION
}: GmapAutocompleteProps) => {
  const { t } = useTranslation();
  const places = useMapsLibrary("places");
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [suggestions, setSuggestions] = useState<
    Array<google.maps.places.AutocompleteSuggestion>
  >([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedValue, setSelectedValue] = useState("");

  useEffect(() => {
    if (!places || !inputValue || inputValue === selectedValue) {
      setSuggestions([]);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = places;

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    // Debounce the API call
    const timerId = setTimeout(() => {
      const request: google.maps.places.AutocompleteRequest = {
        input: inputValue,
        sessionToken: sessionTokenRef.current!,
        ...(origin && { includedRegionCodes: [origin] })
      };

      AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
        .then((res) => {
          setSuggestions(res.suggestions.filter((s) => s.placePrediction));
        })
        .catch((error) => {
          errorHandler(error);
          setSuggestions([]);
        });
    }, 300);

    return () => clearTimeout(timerId);
  }, [places, inputValue, origin, selectedValue]);

  const onInputChange = useCallback(
    (event: FormEvent<HTMLInputElement>) => {
      const value = (event.target as HTMLInputElement).value;
      setInputValue(value);
      if (value !== selectedValue) {
        setSelectedValue("");
      }
    },
    [selectedValue]
  );

  const handleSuggestionClick = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!places || !suggestion.placePrediction) return;

      const place = suggestion.placePrediction.toPlace();

      try {
        await place.fetchFields({
          fields: ["location", "displayName", "formattedAddress"]
        });

        const address = place.formattedAddress || "";
        setInputValue(address);
        setSelectedValue(address);
        setSuggestions([]);
        onPlaceSelect(place);
        sessionTokenRef.current = new places.AutocompleteSessionToken();
      } catch (error) {
        errorHandler(error);
        onPlaceSelect(null);
      }
    },
    [places, onPlaceSelect]
  );

  const handleClearInput = () => {
    setInputValue("");
    setSelectedValue("");
    setSuggestions([]);
  };

  return (
    <MapControl position={ControlPosition.INLINE_START_BLOCK_START}>
      <Container className="map-autocomplete-container">
        <InputGroup>
          <Form.Control
            type="text"
            placeholder={t("map.searchPlace", "Search for a place")}
            value={inputValue}
            onInput={onInputChange}
            className="map-autocomplete-input"
            aria-label={t("map.searchPlace")}
            aria-autocomplete="list"
            aria-controls="autocomplete-results"
            autoComplete="off"
          />
          {inputValue && (
            <Button
              variant="light"
              onClick={handleClearInput}
              className="map-autocomplete-clear-btn"
              aria-label={t("common.clear")}
            >
              ✕
            </Button>
          )}
        </InputGroup>
        {suggestions.length > 0 && (
          <ListGroup as="ul" id="autocomplete-results">
            {suggestions.map((suggestion) => (
              <ListGroup.Item
                as="li"
                action
                key={suggestion.placePrediction!.placeId}
                onClick={() => handleSuggestionClick(suggestion)}
                role="option"
              >
                {suggestion.placePrediction!.text.text}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Container>
    </MapControl>
  );
};
