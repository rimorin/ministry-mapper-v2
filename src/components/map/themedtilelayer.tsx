import { Browser } from "leaflet";
import { TileLayer } from "react-leaflet";

const GEOAPIFY_ATTRIBUTION =
  'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a> contributors';

const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY as string;
const TILE_STYLE = "osm-carto";
const BASE_URL = `https://maps.geoapify.com/v1/tile/${TILE_STYLE}/{z}/{x}/{y}.png?apiKey=${API_KEY}`;
const RETINA_URL = `https://maps.geoapify.com/v1/tile/${TILE_STYLE}/{z}/{x}/{y}@2x.png?apiKey=${API_KEY}`;

export function ThemedTileLayer() {
  return (
    <TileLayer
      url={Browser.retina ? RETINA_URL : BASE_URL}
      attribution={GEOAPIFY_ATTRIBUTION}
      maxZoom={20}
    />
  );
}
