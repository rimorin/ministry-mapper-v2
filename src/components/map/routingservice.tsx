import { useCallback, useEffect, useRef } from "react";
import { isAbortError } from "../../utils/pocketbase";
import { useMap } from "react-leaflet";
import { Polyline as LeafletPolyline, LatLngBounds } from "leaflet";
import { latlongInterface, TravelMode } from "../../utils/interface";

interface RoutingServiceProps {
  start: latlongInterface | undefined;
  end: latlongInterface;
  travelMode: TravelMode;
  color?: string;
  onLoadingChange?: (loading: boolean) => void;
  onRouteData?: (data: { duration: number; distance: number }) => void;
}

interface GeoapifyRoutingResponse {
  features?: Array<{
    geometry: { coordinates: number[][][] };
    properties: { time: number; distance: number };
  }>;
}

const RoutingService: React.FC<RoutingServiceProps> = ({
  start,
  end,
  travelMode,
  color = "#2563eb",
  onLoadingChange,
  onRouteData
}) => {
  const map = useMap();
  const routeLayersRef = useRef<LeafletPolyline[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearRouteLayers = useCallback(() => {
    routeLayersRef.current.forEach((layer) => {
      map.removeLayer(layer);
    });
    routeLayersRef.current = [];
  }, [map]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    clearRouteLayers();

    if (!start) {
      onLoadingChange?.(false);
      return;
    }

    const currentController = new AbortController();
    abortControllerRef.current = currentController;

    const mode = travelMode === "DRIVING" ? "drive" : "walk";
    const params = new URLSearchParams({
      waypoints: `${start.lat},${start.lng}|${end.lat},${end.lng}`,
      mode,
      type: mode === "walk" ? "short" : "balanced",
      apiKey: import.meta.env.VITE_GEOAPIFY_API_KEY as string
    });

    const fetchRoute = async () => {
      onLoadingChange?.(true);
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/routing?${params}`,
          { signal: currentController.signal }
        );
        if (!response.ok) throw new Error(`Routing error: ${response.status}`);

        const data: GeoapifyRoutingResponse = await response.json();

        if (data.features?.[0]?.geometry?.coordinates) {
          const multiLine = data.features[0].geometry.coordinates;
          const latLngs: [number, number][] = multiLine
            .flat()
            .map(([lon, lat]) => [lat, lon]);

          routeLayersRef.current = [
            new LeafletPolyline(latLngs, {
              color: "#1e40af",
              weight: 14,
              opacity: 0.2,
              interactive: false
            }).addTo(map),
            new LeafletPolyline(latLngs, {
              color: "#ffffff",
              weight: 9,
              opacity: 0.55,
              interactive: false
            }).addTo(map),
            new LeafletPolyline(latLngs, {
              color,
              weight: 6,
              opacity: 1,
              smoothFactor: 1.5,
              className: "route-line-main"
            }).addTo(map)
          ];

          onRouteData?.({
            duration: data.features[0].properties.time,
            distance: data.features[0].properties.distance
          });

          map.fitBounds(new LatLngBounds(latLngs), { padding: [50, 50] });
        }
      } catch (error) {
        if (isAbortError(error)) return;
        console.error("Error fetching route:", error);
      } finally {
        if (abortControllerRef.current === currentController) {
          abortControllerRef.current = null;
          onLoadingChange?.(false);
        }
      }
    };

    fetchRoute();

    return () => {
      currentController.abort();
      clearRouteLayers();
    };
  }, [
    map,
    start,
    end,
    travelMode,
    color,
    onLoadingChange,
    onRouteData,
    clearRouteLayers
  ]);

  return null;
};

export default RoutingService;
