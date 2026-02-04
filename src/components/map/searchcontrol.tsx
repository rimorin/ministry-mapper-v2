import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { GeoSearchControl, LocationIQProvider } from "leaflet-geosearch";
import { latlongInterface } from "../../utils/interface";
import "leaflet-geosearch/dist/geosearch.css";
import "../../css/geosearch.css";

interface SearchControlProps {
  onLocationSelect: (location: latlongInterface) => void;
  origin: string;
}

export const SearchControl = ({
  onLocationSelect,
  origin
}: SearchControlProps) => {
  const map = useMap();

  useEffect(() => {
    const providerParams: Record<string, string | number> = {
      key: import.meta.env.VITE_LOCATIONIQ_API_KEY,
      limit: 5,
      addressdetails: 1
    };

    if (origin) {
      providerParams.countrycodes = origin.toLowerCase();
    }

    const provider = new LocationIQProvider({ params: providerParams });

    const searchControl = GeoSearchControl({
      provider,
      style: "bar",
      showMarker: false,
      maxSuggestions: 5,
      autoComplete: true,
      autoCompleteDelay: 300,
      autoClose: true,
      retainZoomLevel: false
    });

    map.addControl(searchControl);

    const handleLocationSelect = (event: unknown) => {
      if (
        event &&
        typeof event === "object" &&
        "location" in event &&
        event.location &&
        typeof event.location === "object" &&
        "x" in event.location &&
        "y" in event.location &&
        typeof event.location.x === "number" &&
        typeof event.location.y === "number"
      ) {
        onLocationSelect({ lat: event.location.y, lng: event.location.x });
      }
    };

    map.on("geosearch/showlocation", handleLocationSelect);

    return () => {
      map.off("geosearch/showlocation", handleLocationSelect);
      map.removeControl(searchControl);
    };
  }, [map, onLocationSelect, origin]);

  return null;
};
