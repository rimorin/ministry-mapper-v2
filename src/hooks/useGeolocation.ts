import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type RefObject
} from "react";
import { latlongInterface } from "../utils/interface";
import { getDefaultMapCenter } from "../utils/helpers/maphelpers";

const GEOLOCATION_OPTIONS: PositionOptions = {
  timeout: 5000,
  maximumAge: 0,
  enableHighAccuracy: false
};

const WATCH_GEOLOCATION_OPTIONS: PositionOptions = {
  timeout: 15000,
  maximumAge: 1000,
  enableHighAccuracy: true
};

const mergePositionOptions = (
  defaults: PositionOptions,
  overrides?: UseGeolocationOptions["watchOptions"]
): PositionOptions =>
  overrides
    ? {
        timeout: overrides.timeout ?? defaults.timeout,
        maximumAge: overrides.maximumAge ?? defaults.maximumAge,
        enableHighAccuracy:
          overrides.enableHighAccuracy ?? defaults.enableHighAccuracy
      }
    : defaults;

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

const createWatchHandlers = (
  setCurrentLocation: Dispatch<SetStateAction<latlongInterface | null>>,
  setCenter: Dispatch<SetStateAction<latlongInterface>>,
  setLocationError: Dispatch<SetStateAction<GeolocationPositionError | null>>,
  setIsLoadingLocation: Dispatch<SetStateAction<boolean>>,
  lastErrorCodeRef: RefObject<number | null>
): [PositionCallback, PositionErrorCallback] => {
  const onSuccess: PositionCallback = (position) => {
    const location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    setCurrentLocation((prev) =>
      areCoordsEqual(prev, location) ? prev : location
    );
    setCenter((prev) => (areCoordsEqual(prev, location) ? prev : location));

    setLocationError(null);
    lastErrorCodeRef.current = null;
    setIsLoadingLocation(false);
  };

  const onError: PositionErrorCallback = (error) => {
    // Only update error state if error code changed
    if (error.code !== lastErrorCodeRef.current) {
      setLocationError(error);
      lastErrorCodeRef.current = error.code;
    }
    setIsLoadingLocation(false);
  };

  return [onSuccess, onError];
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
function useGeolocation({
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

  const requestLocation =
    useCallback(async (): Promise<latlongInterface | null> => {
      if (!isSupported) return null;

      setIsLoadingLocation(true);
      setLocationError(null);

      const options = mergePositionOptions(GEOLOCATION_OPTIONS, watchOptions);

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

  const startWatching = useCallback(() => {
    if (!isSupported || watchIdRef.current !== null) return;

    const options = mergePositionOptions(
      WATCH_GEOLOCATION_OPTIONS,
      watchOptions
    );

    setIsLoadingLocation(true);
    setLocationError(null);

    const [onSuccess, onError] = createWatchHandlers(
      setCurrentLocation,
      setCenter,
      setLocationError,
      setIsLoadingLocation,
      lastErrorCodeRef
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      options
    );
  }, [isSupported, watchOptions]);

  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

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

    const options = mergePositionOptions(
      WATCH_GEOLOCATION_OPTIONS,
      watchOptions
    );

    setIsLoadingLocation(true);
    setLocationError(null);

    const [onSuccess, onError] = createWatchHandlers(
      setCurrentLocation,
      setCenter,
      setLocationError,
      setIsLoadingLocation,
      lastErrorCodeRef
    );

    const watchId = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
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

export default useGeolocation;
