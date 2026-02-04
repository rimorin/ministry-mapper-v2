import { useState, useEffect, useRef, useCallback } from "react";
import { latlongInterface } from "../utils/interface";
import { getDefaultMapCenter } from "../utils/helpers/maphelpers";

/**
 * Geolocation options for getCurrentPosition
 */
export const GEOLOCATION_OPTIONS: PositionOptions = {
  timeout: 5000,
  maximumAge: 0,
  enableHighAccuracy: false
};

/**
 * Get current device location (internal helper)
 * @returns Promise that resolves with location or null if failed
 */
const getCurrentLocation = (
  options: PositionOptions = GEOLOCATION_OPTIONS
): Promise<latlongInterface | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        resolve(null);
      },
      options
    );
  });
};

/**
 * Check if two coordinates are effectively the same (within GPS precision tolerance)
 * Tolerance of ~1 meter (0.00001 degrees ≈ 1.1 meters at equator)
 */
const areCoordsEqual = (
  coord1: latlongInterface | null,
  coord2: latlongInterface
): boolean => {
  if (!coord1) return false;
  const tolerance = 0.00001; // ~1 meter
  return (
    Math.abs(coord1.lat - coord2.lat) < tolerance &&
    Math.abs(coord1.lng - coord2.lng) < tolerance
  );
};

interface UseGeolocationOptions {
  coordinates?: latlongInterface[] | latlongInterface;
  skipGeolocation?: boolean;
  enableWatch?: boolean;
  watchOptions?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  };
}

interface UseGeolocationReturn {
  center: latlongInterface;
  currentLocation: latlongInterface | null;
  isLoadingLocation: boolean;
  locationError: GeolocationPositionError | null;
  isSupported: boolean;
  requestLocation: () => Promise<latlongInterface | null>;
  startWatching: () => void;
  stopWatching: () => void;
  clearError: () => void;
}

/**
 * Comprehensive geolocation hook for all location-related needs.
 * Handles one-time fetching, continuous tracking, and manual requests.
 *
 * @example
 * // One-time fetch on mount
 * const { currentLocation } = useGeolocation();
 *
 * @example
 * // Manual request
 * const { requestLocation } = useGeolocation({ skipGeolocation: true });
 * const location = await requestLocation();
 *
 * @example
 * // Continuous tracking (for navigation)
 * const { currentLocation } = useGeolocation({
 *   enableWatch: true,
 *   watchOptions: { enableHighAccuracy: true }
 * });
 */
export function useGeolocation({
  coordinates,
  skipGeolocation = false,
  enableWatch = false,
  watchOptions
}: UseGeolocationOptions = {}): UseGeolocationReturn {
  const defaultCenter = getDefaultMapCenter(coordinates);
  const [center, setCenter] = useState<latlongInterface>(defaultCenter);
  const [currentLocation, setCurrentLocation] =
    useState<latlongInterface | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] =
    useState<GeolocationPositionError | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastErrorCodeRef = useRef<number | null>(null);
  const isSupported =
    typeof navigator !== "undefined" && !!navigator.geolocation;

  /**
   * Request location manually
   */
  const requestLocation =
    useCallback(async (): Promise<latlongInterface | null> => {
      if (!isSupported) return null;

      setIsLoadingLocation(true);
      setLocationError(null);

      const options: PositionOptions = watchOptions
        ? {
            timeout: watchOptions.timeout ?? GEOLOCATION_OPTIONS.timeout,
            maximumAge:
              watchOptions.maximumAge ?? GEOLOCATION_OPTIONS.maximumAge,
            enableHighAccuracy:
              watchOptions.enableHighAccuracy ??
              GEOLOCATION_OPTIONS.enableHighAccuracy
          }
        : GEOLOCATION_OPTIONS;

      try {
        const location = await getCurrentLocation(options);
        if (location) {
          setCurrentLocation(location);
          setCenter(location);
        }
        return location;
      } catch {
        return null;
      } finally {
        setIsLoadingLocation(false);
      }
    }, [isSupported, watchOptions]);

  /**
   * Start watching position
   */
  const startWatching = useCallback(() => {
    if (!isSupported || watchIdRef.current !== null) return;

    const options: PositionOptions = watchOptions
      ? {
          timeout: watchOptions.timeout ?? 15000,
          maximumAge: watchOptions.maximumAge ?? 1000,
          enableHighAccuracy: watchOptions.enableHighAccuracy ?? true
        }
      : {
          timeout: 15000,
          maximumAge: 1000,
          enableHighAccuracy: true
        };

    setIsLoadingLocation(true);
    setLocationError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setCurrentLocation((prev) => {
          const same = areCoordsEqual(prev, location);
          if (same) {
            return prev;
          }
          return location;
        });

        setCenter((prev) => {
          if (areCoordsEqual(prev, location)) {
            return prev; // Same location (within 1m), don't trigger update
          }
          return location;
        });

        // Reset error state on successful location
        setLocationError(null);
        lastErrorCodeRef.current = null;
        setIsLoadingLocation(false);
      },
      (error) => {
        // Only update error state if error code changed
        if (error.code !== lastErrorCodeRef.current) {
          setLocationError(error);
          lastErrorCodeRef.current = error.code;
        }
        setIsLoadingLocation(false);
      },
      options
    );
  }, [isSupported, watchOptions]);

  /**
   * Stop watching position
   */
  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setLocationError(null);
  };

  // One-time fetch on mount (unless skipped)
  useEffect(() => {
    if (skipGeolocation) return;
    if (enableWatch) return; // Watch mode handles its own fetching
    if (Array.isArray(coordinates) && coordinates.length >= 3) return;

    let cancelled = false;

    setIsLoadingLocation(true);
    getCurrentLocation()
      .then((location) => {
        if (!cancelled && location) {
          setCurrentLocation(location);
          // Don't update center - it should remain stable after initial mount
          // Components should use currentLocation for device markers
          // and center only for initial map positioning
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingLocation(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [coordinates, skipGeolocation, enableWatch]);

  // Watch mode
  useEffect(() => {
    if (!enableWatch || skipGeolocation || !isSupported) return;

    const options =
      watchOptions !== undefined
        ? watchOptions
        : {
            timeout: 15000,
            maximumAge: 1000,
            enableHighAccuracy: true
          };

    setIsLoadingLocation(true);
    setLocationError(null);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setCurrentLocation((prev) => {
          const same = areCoordsEqual(prev, location);
          if (same) {
            return prev;
          }
          return location;
        });

        setCenter((prev) => {
          if (areCoordsEqual(prev, location)) {
            return prev; // Same location (within 1m), don't trigger update
          }
          return location;
        });

        // Reset error state on successful location
        setLocationError(null);
        lastErrorCodeRef.current = null;
        setIsLoadingLocation(false);
      },
      (error) => {
        // Only update error state if error code changed
        if (error.code !== lastErrorCodeRef.current) {
          setLocationError(error);
          lastErrorCodeRef.current = error.code;
        }
        setIsLoadingLocation(false);
      },
      options
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enableWatch, skipGeolocation, isSupported, watchOptions]);

  return {
    center,
    currentLocation,
    isLoadingLocation,
    locationError,
    isSupported,
    requestLocation,
    startWatching,
    stopWatching,
    clearError
  };
}

// Deprecated alias for backward compatibility
/**
 * @deprecated Use `useGeolocation` instead. This alias will be removed in a future version.
 */
export function useMapInitialCenter(
  options: UseGeolocationOptions
): Pick<UseGeolocationReturn, "center" | "isLoadingLocation"> {
  const { center, isLoadingLocation } = useGeolocation(options);
  return { center, isLoadingLocation };
}

export default useGeolocation;
