import { territorySingleProps } from "../../utils/interface";
import {
  DEFAULT_AGGREGATES,
  DEFAULT_COORDINATES,
  STATUS_CODES
} from "../../utils/constants";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker } from "react-leaflet";
import { divIcon } from "leaflet";
import { useMemo, useState } from "react";
import { currentLocationIcon } from "../../utils/helpers/mapicons";
import { MapCurrentTarget } from "../map/mapcurrenttarget";
import { MapController } from "../map/mapcontroller";
import CustomControl from "../map/customcontrol";
import useGeolocation from "../../hooks/useGeolocation";
import { ThemedTileLayer } from "../map/themedtilelayer";

// Inline SVG strings for Leaflet divIcon markers — avoids react-dom/server entirely.
// SVG paths sourced from lucide-icons/lucide@main. Tailwind classes are applied by the
// browser after Leaflet inserts the HTML into the DOM.
const SVG_BASE =
  'xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const STATIC_ICON_HTML: Partial<Record<string, string>> = {
  [STATUS_CODES.DONE]: `<svg ${SVG_BASE} class="size-5 text-green-600 stroke-[2.5]"><path d="M20 6 9 17l-5-5"/></svg>`,
  [STATUS_CODES.DO_NOT_CALL]: `<svg ${SVG_BASE} class="size-5 text-destructive"><circle cx="12" cy="12" r="10"/><path d="M4.929 4.929 19.07 19.071"/></svg>`,
  [STATUS_CODES.INVALID]: `<svg ${SVG_BASE} class="size-5 text-violet-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
};

const getStatusIconHtml = (status: string, nhcount: string): string => {
  if (status === STATUS_CODES.NOT_HOME) {
    return `<span class="relative inline-flex items-center justify-center"><svg ${SVG_BASE} class="size-5 text-amber-500"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>${nhcount ? `<span class="absolute -right-1.5 -top-1.5 z-[9999] flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[10px] font-bold leading-none bg-zinc-900 text-white border border-white shadow-sm">${nhcount}</span>` : ""}</span>`;
  }
  return STATIC_ICON_HTML[status] ?? "";
};

const TerritoryMapView = ({
  houses,
  policy,
  addressDetails,
  handleHouseUpdate
}: territorySingleProps) => {
  const mapCoordinates = addressDetails?.coordinates;
  const aggregates = addressDetails?.aggregates;
  const { currentLocation } = useGeolocation();
  const [center, setCenter] = useState(
    mapCoordinates || DEFAULT_COORDINATES.Singapore
  );

  const houseMarkers = useMemo(
    () =>
      houses?.units.map((element, index) => {
        if (!element.coordinates?.lat || !element.coordinates?.lng) return null;

        const houseType =
          element.type?.map((type) => type.code).join(", ") || "";
        const className =
          policy?.getUnitColor(
            element,
            aggregates?.value || DEFAULT_AGGREGATES.value
          ) || "";

        const statusIconHtml = getStatusIconHtml(
          element.status,
          element.nhcount
        );
        const houseIcon = divIcon({
          html: `<div data-id="${element.id}" data-floor="${element.floor}" class="map-marker ${className}">
          <div class="map-marker-label">${houseType}</div>
          ${statusIconHtml ? `<div class="map-marker-status">${statusIconHtml}</div>` : ""}
        </div>`,
          className: "",
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        return (
          <Marker
            key={`housemark-${element.id}-${index}`}
            position={[element.coordinates.lat, element.coordinates.lng]}
            icon={houseIcon}
            eventHandlers={{
              click: (e) => {
                const markerElement = e.sourceTarget.getElement();
                const targetElement =
                  markerElement?.querySelector("[data-id]") || markerElement;
                handleHouseUpdate({
                  ...e,
                  currentTarget: targetElement
                } as unknown as React.MouseEvent<HTMLElement>);
              }
            }}
          />
        );
      }),
    [houses?.units, aggregates, policy, handleHouseUpdate]
  );

  return (
    <div
      className={
        policy.isFromAdmin()
          ? "map-body-admin"
          : "relative h-full w-full overflow-hidden"
      }
    >
      <MapContainer
        center={[mapCoordinates.lat, mapCoordinates.lng]}
        zoom={17}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <ThemedTileLayer />
        <MapController
          center={center}
          onCenterChange={setCenter}
          zoomLevel={17}
        />
        {currentLocation && (
          <>
            <CustomControl position="topright">
              <MapCurrentTarget
                onClick={() => {
                  setCenter({ ...currentLocation });
                }}
              />
            </CustomControl>
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={currentLocationIcon}
            />
          </>
        )}
        {houseMarkers}
      </MapContainer>
    </div>
  );
};

export default TerritoryMapView;
