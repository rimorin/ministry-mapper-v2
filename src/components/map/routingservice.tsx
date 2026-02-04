import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { Polyline as LeafletPolyline, LatLngBounds } from "leaflet";
import { latlongInterface, TravelMode } from "../../utils/interface";

interface RoutingServiceProps {
  start: latlongInterface | undefined;
  end: latlongInterface;
  travelMode: TravelMode;
  color?: string;
  onLoadingChange?: (loading: boolean) => void;
}

const RoutingService: React.FC<RoutingServiceProps> = ({
  start,
  end,
  travelMode,
  color = "#2563eb",
  onLoadingChange
}) => {
  const map = useMap();
  const routeLineRef = useRef<LeafletPolyline | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!start) return;

    // Cancel any in-flight request to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const profile = travelMode === "DRIVING" ? "driving-car" : "foot-walking";

    const fetchRoute = async () => {
      onLoadingChange?.(true);
      try {
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
          {
            method: "POST",
            headers: {
              Authorization: import.meta.env.VITE_OPENROUTE_API_KEY,
              "Content-Type": "application/json",
              Accept: "application/geo+json"
            },
            body: JSON.stringify({
              coordinates: [
                [start.lng, start.lat],
                [end.lng, end.lat]
              ]
            }),
            signal: abortControllerRef.current?.signal
          }
        );

        const data = await response.json();

        if (data.features?.[0]?.geometry?.coordinates) {
          const latLngs: [number, number][] =
            data.features[0].geometry.coordinates.map(
              (coord: number[]) => [coord[1], coord[0]] as [number, number]
            );

          // Swap old route with new route atomically (prevents flicker during live updates)
          if (routeLineRef.current) {
            map.removeLayer(routeLineRef.current);
          }

          routeLineRef.current = new LeafletPolyline(latLngs, {
            color,
            weight: 5,
            opacity: 0.7,
            smoothFactor: 1
          }).addTo(map);

          map.fitBounds(new LatLngBounds(latLngs), { padding: [50, 50] });
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return; // Expected when new route request starts
        }
        console.error("Error fetching route:", error);
      } finally {
        onLoadingChange?.(false);
      }
    };

    fetchRoute();

    return () => {
      // Abort ongoing requests but keep route visible during updates
      abortControllerRef.current?.abort();
    };
  }, [map, start, end, travelMode, color, onLoadingChange]);

  // Remove route only on component unmount
  useEffect(() => {
    return () => {
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
    };
  }, [map]);

  return null;
};

export default RoutingService;
