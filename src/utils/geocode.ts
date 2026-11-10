import type { latlongInterface } from "./interface";

export interface AddressMatch {
  formatted: string;
  address_line1?: string;
  address_line2?: string;
  lat: number;
  lon: number;
}

export interface GeocodeMatch extends latlongInterface {
  formatted: string;
}

// Searches addresses with Geoapify, limited to the congregation's country
// when it is known. A failed search finds nothing.
export async function searchAddresses(
  text: string,
  origin: string | undefined,
  limit: number,
  signal?: AbortSignal
): Promise<AddressMatch[]> {
  const params = new URLSearchParams({
    text,
    limit: String(limit),
    apiKey: import.meta.env.VITE_GEOAPIFY_API_KEY as string
  });
  if (origin) params.set("filter", `countrycode:${origin.toLowerCase()}`);
  const res = await fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?${params}`,
    { signal }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    features?: Array<{ properties: AddressMatch }>;
  };
  return (data.features ?? []).map((feature) => feature.properties);
}

// The best match for an address, or null when nothing matches, so the admin
// picks the place on the map instead.
export async function geocodeAddress(
  text: string,
  origin?: string,
  signal?: AbortSignal
): Promise<GeocodeMatch | null> {
  const [match] = await searchAddresses(text, origin, 1, signal);
  return match
    ? { lat: match.lat, lng: match.lon, formatted: match.formatted }
    : null;
}
