import { useEffect, useState, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { divIcon, latLngBounds } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  useMap
} from "react-leaflet";
import { ArrowLeft, ExternalLink, MapPinOff, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ThemedTileLayer } from "../map/themedtilelayer";
import DirectionsMap from "../map/directionsmap";
import {
  currentLocationIcon,
  destinationIcon
} from "../../utils/helpers/mapicons";
import {
  formatDistance,
  getPolygonCenterAsObject
} from "../../utils/helpers/maphelpers";
import { getList, isAbortError } from "../../utils/pocketbase";
import { PB_FIELDS } from "../../utils/constants";
import { resolveLocalized } from "../../utils/resolveLocalized";
import { isEndgame } from "../../utils/policies";
import type { latlongInterface } from "../../utils/interface";
import AssistantBuilding from "./assistant-building";

// A map found near a place or the admin, as listed in the answer.
interface NearbyPoint {
  mapId: string;
  territoryId: string;
  title: string;
  lat: number;
  lng: number;
  distance: number;
}

// What the canvas shows: a territory with its blocks, one map, or the maps an
// answer found nearby. Titles come from the answer, so headers show at once.
export type AssistantPlace =
  | {
      kind: "territory" | "map";
      id: string;
      title: string;
      territoryId: string;
    }
  | {
      kind: "nearby";
      title: string;
      points: NearbyPoint[];
      origin?: latlongInterface;
    }
  | {
      // One map's homes, floor by floor.
      kind: "building";
      id: string;
      title: string;
      territoryId: string;
    };

type PlaceOf<K extends AssistantPlace["kind"]> = Extract<
  AssistantPlace,
  { kind: K }
>;

interface CanvasMap {
  id: string;
  description: string | Record<string, string>;
  progress: number;
  coordinates: latlongInterface | null;
  aggregates: { notDone?: number; total?: number } | null;
}

interface CanvasTerritory {
  code: string;
  description: string;
  progress: number;
  coordinates: latlongInterface[] | null;
}

interface AssistantCanvasProps {
  congregation: string;
  place: PlaceOf<"territory" | "map">;
  onSelectPlace: (place: AssistantPlace) => void;
  onClose: () => void;
  onOpenInAdmin: (territoryId: string) => void;
}

// Leaflet needs to measure its box again when the dialog widens or the drawer
// settles, and to frame what it shows.
const FitTo = ({ points }: { points: latlongInterface[] }) => {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const frame = () => {
      map.invalidateSize();
      if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], 17);
      } else if (points.length > 1) {
        map.fitBounds(latLngBounds(points.map((p) => [p.lat, p.lng])), {
          padding: [24, 24]
        });
      }
    };
    frame();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map, points]);
  return null;
};

// A drag on the map must pan the map, not start the drawer's swipe-to-close,
// which listens for pointer events on its popup.
const keepGesture = (event: SyntheticEvent) => event.stopPropagation();

// A map's progress as the map list colours it: done from 90%, then started,
// then not started. Class names are written out for Tailwind to find.
const progressStep = (progress: number) =>
  isEndgame(progress) ? 2 : progress > 0 ? 1 : 0;
// Leaflet reads className only when a shape is created (setStyle ignores it), so
// it is passed as a prop, not in pathOptions. CSS beats Leaflet's own colours.
const PROGRESS_FILL = [
  "fill-muted-foreground stroke-background",
  "fill-status-nothome stroke-background",
  "fill-status-done stroke-background"
];
const PROGRESS_DOT = [
  "bg-muted-foreground",
  "bg-status-nothome",
  "bg-status-done"
];

const PlaceCanvas = ({
  congregation,
  place,
  onSelectPlace,
  onClose,
  onOpenInAdmin
}: AssistantCanvasProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const [territory, setTerritory] = useState<CanvasTerritory | null>(null);
  const [maps, setMaps] = useState<CanvasMap[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [directionsTo, setDirectionsTo] = useState<latlongInterface | null>(
    null
  );

  useEffect(() => {
    // A later place replaces this one; its late response must not land.
    let current = true;
    setStatus("loading");
    setDirectionsTo(null);
    Promise.all([
      getList("territories", {
        filter: `congregation="${congregation}" && id="${place.territoryId}"`,
        fields: PB_FIELDS.TERRITORIES,
        requestKey: `assistant-canvas-territory-${place.territoryId}`
      }),
      getList("maps", {
        filter: `territory="${place.territoryId}"`,
        fields: PB_FIELDS.MAPS,
        sort: "sequence",
        requestKey: `assistant-canvas-maps-${place.territoryId}`
      })
    ])
      .then(([territories, territoryMaps]) => {
        if (!current) return;
        setTerritory(
          (territories[0] as unknown as CanvasTerritory | undefined) ?? null
        );
        setMaps(territoryMaps as unknown as CanvasMap[]);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!current || isAbortError(error)) return;
        setStatus("error");
      });
    return () => {
      current = false;
    };
  }, [congregation, place.territoryId]);

  const mapName = (map: CanvasMap) => resolveLocalized(map.description, locale);
  const openMap = (map: CanvasMap) =>
    onSelectPlace({
      kind: "map",
      id: map.id,
      title: mapName(map),
      territoryId: place.territoryId
    });
  const located = maps.filter(
    (map): map is CanvasMap & { coordinates: latlongInterface } =>
      map.coordinates !== null && Number.isFinite(map.coordinates.lat)
  );
  const boundary =
    territory?.coordinates && territory.coordinates.length >= 3
      ? territory.coordinates
      : null;
  const selectedMap =
    place.kind === "map" ? maps.find((map) => map.id === place.id) : undefined;

  const destination: latlongInterface | null =
    place.kind === "map"
      ? (selectedMap?.coordinates ?? null)
      : boundary
        ? getPolygonCenterAsObject(boundary)
        : (located[0]?.coordinates ?? null);

  const framed: latlongInterface[] =
    place.kind === "map"
      ? destination
        ? [destination]
        : []
      : (boundary ?? located.map((map) => map.coordinates));

  const homesLeft =
    place.kind === "map"
      ? (selectedMap?.aggregates?.notDone ?? 0)
      : maps.reduce((sum, map) => sum + (map.aggregates?.notDone ?? 0), 0);
  const progress =
    place.kind === "map"
      ? (selectedMap?.progress ?? 0)
      : (territory?.progress ?? 0);

  const header = (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={
          directionsTo
            ? t("assistant.action.back", "Back")
            : t("assistant.canvas.backToChat", "Back to chat")
        }
        onClick={() => (directionsTo ? setDirectionsTo(null) : onClose())}
      >
        <ArrowLeft />
      </Button>
      <h3 className="min-w-0 flex-1 truncate font-medium">{place.title}</h3>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onOpenInAdmin(place.territoryId)}
      >
        <ExternalLink />
        {t("assistant.canvas.openInAdmin", "Open in admin view")}
      </Button>
    </div>
  );

  if (status === "loading") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        {header}
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        {header}
        <p className="text-sm text-muted-foreground">
          {t(
            "assistant.canvas.loadError",
            "This place could not be loaded. Please try again."
          )}
        </p>
      </div>
    );
  }

  if (directionsTo) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        {header}
        <div
          className="relative min-h-0 flex-1 overflow-hidden rounded-md border"
          onPointerDown={keepGesture}
          onTouchStart={keepGesture}
        >
          <DirectionsMap coordinates={directionsTo} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {header}
      {framed.length > 0 ? (
        <div
          className="h-56 shrink-0 overflow-hidden rounded-md border md:h-72"
          onPointerDown={keepGesture}
          onTouchStart={keepGesture}
        >
          <MapContainer
            center={[framed[0].lat, framed[0].lng]}
            zoom={16}
            className="map-container"
            scrollWheelZoom={false}
          >
            <ThemedTileLayer />
            <FitTo points={framed} />
            {boundary && (
              <Polygon
                positions={boundary.map((p) => [p.lat, p.lng])}
                className="stroke-primary fill-primary/10"
              />
            )}
            {place.kind === "map" && destination ? (
              <Marker
                position={[destination.lat, destination.lng]}
                icon={destinationIcon}
              />
            ) : (
              located.map((map) => (
                <CircleMarker
                  key={map.id}
                  center={[map.coordinates.lat, map.coordinates.lng]}
                  radius={7}
                  className={PROGRESS_FILL[progressStep(map.progress)]}
                  pathOptions={{ fillOpacity: 0.9, weight: 2 }}
                  eventHandlers={{
                    click: () => openMap(map)
                  }}
                />
              ))
            )}
          </MapContainer>
        </div>
      ) : (
        <div className="flex h-32 shrink-0 flex-col items-center justify-center gap-2 rounded-md border text-sm text-muted-foreground">
          <MapPinOff className="size-5" />
          {t("assistant.canvas.noLocation", "This place has no location yet.")}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span>
          {t("assistant.canvas.progress", "{{progress}}% done", { progress })}
        </span>
        <span className="text-muted-foreground">
          {t("assistant.canvas.homesLeft", "{{count}} homes not done", {
            count: homesLeft
          })}
        </span>
        {destination && (
          <Button
            type="button"
            size="sm"
            className="ml-auto"
            onClick={() => setDirectionsTo(destination)}
          >
            <Navigation />
            {t("assistant.canvas.directions", "Directions")}
          </Button>
        )}
      </div>

      {place.kind === "territory" && maps.length > 0 && (
        <ul className="min-h-0 flex-1 divide-y overflow-y-auto rounded-md border text-sm">
          {maps.map((map) => (
            <li key={map.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"
                onClick={() => openMap(map)}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    PROGRESS_DOT[progressStep(map.progress)]
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{mapName(map)}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {map.progress}%
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {place.kind === "map" && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() =>
            onSelectPlace({
              kind: "territory",
              id: place.territoryId,
              title: territory
                ? `${territory.code} · ${territory.description}`
                : place.title,
              territoryId: place.territoryId
            })
          }
        >
          <ArrowLeft />
          {t("assistant.canvas.wholeTerritory", "Whole territory")}
        </Button>
      )}
    </div>
  );
};

const numberedIcon = (n: number) =>
  divIcon({
    className: "",
    iconSize: [24, 24],
    html: `<span class="flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-medium text-primary-foreground">${n}</span>`
  });

const NearbyCanvas = ({
  place,
  onSelectPlace,
  onClose
}: Omit<AssistantCanvasProps, "place" | "congregation" | "onOpenInAdmin"> & {
  place: PlaceOf<"nearby">;
}) => {
  const { t } = useTranslation();
  const openPoint = (p: NearbyPoint) =>
    onSelectPlace({
      kind: "map",
      id: p.mapId,
      title: p.title,
      territoryId: p.territoryId
    });
  const framed = [
    ...place.points.map((p) => ({ lat: p.lat, lng: p.lng })),
    ...(place.origin ? [place.origin] : [])
  ];
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("assistant.canvas.backToChat", "Back to chat")}
          onClick={onClose}
        >
          <ArrowLeft />
        </Button>
        <h3 className="min-w-0 flex-1 truncate font-medium">{place.title}</h3>
      </div>
      <div
        className="h-56 shrink-0 overflow-hidden rounded-md border md:h-72"
        onPointerDown={keepGesture}
        onTouchStart={keepGesture}
      >
        <MapContainer
          center={[framed[0].lat, framed[0].lng]}
          zoom={16}
          className="map-container"
          scrollWheelZoom={false}
        >
          <ThemedTileLayer />
          <FitTo points={framed} />
          {place.origin && (
            <Marker
              position={[place.origin.lat, place.origin.lng]}
              icon={currentLocationIcon}
            />
          )}
          {place.points.map((p, index) => (
            <Marker
              key={p.mapId}
              position={[p.lat, p.lng]}
              icon={numberedIcon(index + 1)}
              eventHandlers={{
                click: () => openPoint(p)
              }}
            />
          ))}
        </MapContainer>
      </div>
      <ol className="min-h-0 flex-1 divide-y overflow-y-auto rounded-md border text-sm">
        {place.points.map((p, index) => (
          <li key={p.mapId}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"
              onClick={() => openPoint(p)}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">{p.title}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {formatDistance(p.distance)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
};

const AssistantCanvas = (
  props: Omit<AssistantCanvasProps, "place"> & { place: AssistantPlace }
) => {
  const { place } = props;
  if (place.kind === "building") {
    return (
      <AssistantBuilding
        mapId={place.id}
        title={place.title}
        onClose={props.onClose}
      />
    );
  }
  return place.kind === "nearby" ? (
    <NearbyCanvas {...props} place={place} />
  ) : (
    <PlaceCanvas {...props} place={place} />
  );
};

export default AssistantCanvas;
