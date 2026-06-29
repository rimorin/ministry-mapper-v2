import { useState, useRef, useCallback, useEffect } from "react";
import { isAbortError } from "../../utils/pocketbase";
import { useMap } from "react-leaflet";
import { Search, X, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { latlongInterface } from "../../utils/interface";
import CustomControl from "./customcontrol";

const MIN_QUERY_LENGTH = 3;

interface SearchControlProps {
  onLocationSelect: (location: latlongInterface) => void;
  origin: string;
}

interface SearchResult {
  formatted: string;
  address_line1?: string;
  address_line2?: string;
  lat: number;
  lon: number;
}

interface GeoapifyFeatureCollection {
  features?: Array<{
    properties: SearchResult;
  }>;
}

export const SearchControl = ({
  onLocationSelect,
  origin
}: SearchControlProps) => {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < MIN_QUERY_LENGTH) {
        setResults([]);
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      try {
        const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY as string;
        const params = new URLSearchParams({
          text: q,
          limit: "5",
          apiKey
        });
        if (origin) params.set("filter", `countrycode:${origin.toLowerCase()}`);
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?${params}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const data: GeoapifyFeatureCollection = await res.json();
        setResults((data.features ?? []).map((f) => f.properties));
      } catch (err) {
        if (!isAbortError(err)) setResults([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    },
    [origin]
  );

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      abortRef.current?.abort();
      return;
    }
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (result: SearchResult) => {
    const lat = result.lat;
    const lng = result.lon;
    onLocationSelect({ lat, lng });
    map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
    setQuery(result.formatted);
    setResults([]);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  };

  const showDropdown =
    results.length > 0 || (isLoading && query.length >= MIN_QUERY_LENGTH);

  return (
    <CustomControl position="topright">
      <div
        className="w-64 sm:w-80"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border bg-background/95 px-3 py-2 shadow-md transition-shadow",
            isFocused && "ring-2 ring-ring/20"
          )}
        >
          {isLoading ? (
            <Spinner className="text-muted-foreground shrink-0" />
          ) : (
            <Search className="size-4 text-muted-foreground shrink-0" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() =>
              setTimeout(() => {
                setIsFocused(false);
                setResults([]);
              }, 200)
            }
            placeholder="Search address…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
          />
          {query && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleClear();
              }}
              className="size-5 shrink-0 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="mt-1 rounded-xl border bg-background/95 shadow-lg overflow-hidden">
            {isLoading && results.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                <Spinner /> Searching…
              </div>
            ) : (
              <ul className="max-h-48 overflow-y-auto divide-y divide-border/50">
                {results.map((result) => (
                  <li key={`${result.lat},${result.lon}`}>
                    <button
                      type="button"
                      onMouseDown={() => handleSelect(result)}
                      className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors"
                    >
                      <MapPin className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                      <span className="flex flex-col min-w-0">
                        <span className="font-medium leading-snug line-clamp-1">
                          {result.address_line1 ?? result.formatted}
                        </span>
                        {result.address_line2 && (
                          <span className="text-xs text-muted-foreground leading-snug line-clamp-1">
                            {result.address_line2}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </CustomControl>
  );
};
