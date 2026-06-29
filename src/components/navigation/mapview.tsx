import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, Marker } from "react-leaflet";
import {
  DEFAULT_COORDINATES,
  LINK_TYPES,
  USER_ACCESS_LEVELS
} from "../../utils/constants";
import { currentLocationIcon } from "../../utils/helpers/mapicons";
import {
  addressDetails,
  AssignmentStatus,
  latlongInterface,
  MapViewProps
} from "../../utils/interface";
import AddressMarker from "../map/marker";
import AssignmentButtonGroup from "./assignmentbtn";
import { getList, getUser } from "../../utils/pocketbase";
import ComponentAuthorizer from "./authorizer";
import { MapController } from "../map/mapcontroller";
import CustomControl from "../map/customcontrol";
import useGeolocation from "../../hooks/useGeolocation";
import { ThemedTileLayer } from "../map/themedtilelayer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

const RING_LEGEND = [
  { color: "var(--mm-success)", labelKey: "navigation.normalRing" },
  { color: "var(--mm-warning)", labelKey: "navigation.personalRing" },
  { color: "var(--mm-progress)", labelKey: "navigation.progressRing" }
] as const;

const MapView: React.FC<MapViewProps> = ({ sortedAddressList, policy }) => {
  const { t } = useTranslation();
  const { currentLocation } = useGeolocation();
  const [center, setCenter] = useState<latlongInterface>();
  const [selectedAddress, setSelectedAddress] = useState<addressDetails | null>(
    null
  );
  const [assignmentStatuses, setAssignmentStatuses] = useState<
    Map<string, AssignmentStatus>
  >(new Map());

  const mapIdsKey = sortedAddressList.map((a) => a.id).join(",");

  useEffect(() => {
    if (!sortedAddressList.length) return;
    const mapIds = sortedAddressList.map((a) => a.id);
    const mapsFilter = mapIds.map((id) => `map="${id}"`).join(" || ");
    const filter = `(${mapsFilter}) && expiry_date >= @now`;
    getList("assignments", {
      filter,
      fields: "map, type",
      requestKey: "mapview-assignments-bulk"
    }).then((assignments) => {
      const statuses = new Map<string, AssignmentStatus>();
      for (const id of mapIds) {
        statuses.set(id, { hasAssignments: false, hasPersonal: false });
      }
      for (const a of assignments) {
        const current = statuses.get(a.map) ?? {
          hasAssignments: false,
          hasPersonal: false
        };
        if (a.type === LINK_TYPES.ASSIGNMENT) current.hasAssignments = true;
        if (a.type === LINK_TYPES.PERSONAL) current.hasPersonal = true;
        statuses.set(a.map, current);
      }
      setAssignmentStatuses(statuses);
    });
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- mapIdsKey is a stable string derived from sortedAddressList ids; using it prevents the fetch re-firing on referential array changes
  }, [mapIdsKey]);

  if (!sortedAddressList.length) return <div>No addresses found</div>;

  const defaultCenter = sortedAddressList[0].coordinates || DEFAULT_COORDINATES;

  return (
    <div className="relative z-0 h-[75dvh] w-full overflow-hidden rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={18}
        style={{ height: "100%", width: "100%" }}
        zoomControl
        scrollWheelZoom
      >
        <ThemedTileLayer />
        <MapController
          center={center}
          onCenterChange={setCenter}
          onMapClick={() => setSelectedAddress(null)}
          zoomLevel={18}
        />
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={currentLocationIcon}
          />
        )}
        {sortedAddressList.map((addressElement) => (
          <AddressMarker
            key={addressElement.id}
            addressElement={addressElement}
            initialStatus={assignmentStatuses.get(addressElement.id)}
            isSelected={selectedAddress?.id === addressElement.id}
            onClick={() => {
              setSelectedAddress(addressElement);
              setCenter(addressElement.coordinates);
            }}
          />
        ))}
        <CustomControl position="topright">
          <Popover>
            <PopoverTrigger
              className="flex size-[44px] items-center justify-center rounded-md border bg-background/95 shadow-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("navigation.markerGuide")}
            >
              <span
                className="flex flex-col items-center gap-[3px]"
                aria-hidden="true"
              >
                {RING_LEGEND.map(({ color }) => (
                  <span
                    key={color}
                    className="block size-[5px] rounded-full border-[1.5px]"
                    style={{ borderColor: color }}
                  />
                ))}
              </span>
            </PopoverTrigger>
            <PopoverContent
              side="left"
              align="start"
              sideOffset={8}
              className="w-auto p-0 gap-0 overflow-hidden"
            >
              <div className="px-3 py-2 border-b">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("navigation.markerGuide")}
                </p>
              </div>
              <div className="px-3 py-2 flex flex-col gap-2">
                {RING_LEGEND.map(({ color, labelKey }) => (
                  <div key={color} className="flex items-center gap-2.5">
                    <div
                      className="size-3 shrink-0 rounded-full border-2"
                      style={{ borderColor: color }}
                    />
                    <span className="text-xs text-foreground whitespace-nowrap">
                      {t(labelKey)}
                    </span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </CustomControl>
        {selectedAddress && (
          <CustomControl position="bottomright">
            <div className="w-56 overflow-hidden rounded-xl bg-background/95 text-sm shadow-lg backdrop-blur-sm ring-1 ring-foreground/10">
              <div className="border-b px-4 py-3">
                <p className="font-semibold leading-tight">
                  {selectedAddress.name}
                </p>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                  {selectedAddress.type}
                </p>
              </div>
              <div className="grid grid-cols-2 divide-x">
                <div className="flex flex-col items-center py-3">
                  <span className="text-2xl font-bold tabular-nums">
                    {selectedAddress.aggregates.notDone}
                  </span>
                  <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Not Done
                  </span>
                </div>
                <div className="flex flex-col items-center py-3">
                  <span className="text-2xl font-bold tabular-nums">
                    {selectedAddress.aggregates.notHome}
                  </span>
                  <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Not Home
                  </span>
                </div>
              </div>
              <ComponentAuthorizer
                requiredPermission={USER_ACCESS_LEVELS.CONDUCTOR.CODE}
                userPermission={policy.userRole}
              >
                <div className="flex flex-row justify-center border-t px-3 py-2">
                  <AssignmentButtonGroup
                    key={selectedAddress.id}
                    addressElement={selectedAddress}
                    policy={policy}
                    userId={getUser("id") as string}
                  />
                </div>
              </ComponentAuthorizer>
            </div>
          </CustomControl>
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
