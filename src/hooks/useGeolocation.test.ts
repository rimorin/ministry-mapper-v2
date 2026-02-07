import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import useGeolocation from "./useGeolocation";
import { DEFAULT_COORDINATES } from "../utils/constants";
import { latlongInterface } from "../utils/interface";

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};

describe("useGeolocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global.navigator, "geolocation", {
      writable: true,
      value: mockGeolocation
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("browser support detection", () => {
    it("should detect browser support", () => {
      const { result } = renderHook(() => useGeolocation());
      expect(result.current.isSupported).toBe(true);
    });

    it("should detect when geolocation is not supported", () => {
      Object.defineProperty(global.navigator, "geolocation", {
        writable: true,
        value: undefined
      });

      const { result } = renderHook(() => useGeolocation());
      expect(result.current.isSupported).toBe(false);
    });
  });

  describe("default behavior (one-time fetch on mount)", () => {
    it("should return default Singapore coordinates immediately", () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        setTimeout(
          () =>
            success({
              coords: { latitude: 1.3521, longitude: 103.8198 }
            }),
          100
        );
      });

      const { result } = renderHook(() => useGeolocation());

      expect(result.current.center).toEqual(DEFAULT_COORDINATES.Singapore);
      expect(result.current.isLoadingLocation).toBe(true);
      expect(result.current.currentLocation).toBeNull();
    });

    it("should update to device location when available", async () => {
      const deviceLocation = { lat: 1.3521, lng: 103.8198 };
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: deviceLocation.lat,
            longitude: deviceLocation.lng
          }
        });
      });

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.currentLocation).toEqual(deviceLocation);
        expect(result.current.center).toEqual(DEFAULT_COORDINATES.Singapore);
        expect(result.current.isLoadingLocation).toBe(false);
      });
    });

    it("should stay at default when device location fails", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          error(new Error("Permission denied"));
        }
      );

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.center).toEqual(DEFAULT_COORDINATES.Singapore);
        expect(result.current.currentLocation).toBeNull();
        expect(result.current.isLoadingLocation).toBe(false);
      });
    });
  });

  describe("with existing polygon coordinates", () => {
    it("should use polygon center and skip geolocation", async () => {
      const polygon = [
        { lat: 1, lng: 1 },
        { lat: 1, lng: 3 },
        { lat: 3, lng: 1 }
      ];

      const { result } = renderHook(() =>
        useGeolocation({ coordinates: polygon })
      );

      expect(result.current.center.lat).toBeCloseTo(1.67, 1);
      expect(result.current.center.lng).toBeCloseTo(1.67, 1);

      await waitFor(() => {
        expect(result.current.isLoadingLocation).toBe(false);
      });
      expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
    });
  });

  describe("skipGeolocation flag", () => {
    it("should skip geolocation when flag is true", async () => {
      const { result } = renderHook(() =>
        useGeolocation({ skipGeolocation: true })
      );

      await waitFor(() => {
        expect(result.current.isLoadingLocation).toBe(false);
      });
      expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
      expect(result.current.center).toEqual(DEFAULT_COORDINATES.Singapore);
      expect(result.current.currentLocation).toBeNull();
    });
  });

  describe("requestLocation method", () => {
    it("should manually request location", async () => {
      const deviceLocation = { lat: 1.3521, lng: 103.8198 };
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: deviceLocation.lat,
            longitude: deviceLocation.lng
          }
        });
      });

      const { result } = renderHook(() =>
        useGeolocation({ skipGeolocation: true })
      );

      let location: latlongInterface | null = null;
      await act(async () => {
        location = await result.current.requestLocation();
      });

      expect(location).toEqual(deviceLocation);
      expect(result.current.currentLocation).toEqual(deviceLocation);
    });

    it("should return null when location request fails", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          error(new Error("Permission denied"));
        }
      );

      const { result } = renderHook(() =>
        useGeolocation({ skipGeolocation: true })
      );

      let location: latlongInterface | null = null;
      await act(async () => {
        location = await result.current.requestLocation();
      });

      expect(location).toBeNull();
    });

    it("should set loading state during request", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        setTimeout(() => {
          success({
            coords: { latitude: 1.3521, longitude: 103.8198 }
          });
        }, 100);
      });

      const { result } = renderHook(() =>
        useGeolocation({ skipGeolocation: true })
      );

      act(() => {
        result.current.requestLocation();
      });

      expect(result.current.isLoadingLocation).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoadingLocation).toBe(false);
      });
    });
  });

  describe("watch mode", () => {
    it("should start watching when enableWatch is true", () => {
      const watchId = 1;
      mockGeolocation.watchPosition.mockReturnValue(watchId);

      renderHook(() => useGeolocation({ enableWatch: true }));

      expect(mockGeolocation.watchPosition).toHaveBeenCalled();
    });

    it("should update currentLocation on position updates", async () => {
      let positionCallback:
        | ((position: GeolocationPosition) => void)
        | undefined;
      mockGeolocation.watchPosition.mockImplementation((success) => {
        positionCallback = success;
        return 1;
      });

      const { result } = renderHook(() =>
        useGeolocation({ enableWatch: true })
      );

      const location1 = { lat: 1.3521, lng: 103.8198 };
      act(() => {
        positionCallback?.({
          coords: {
            latitude: location1.lat,
            longitude: location1.lng,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
            toJSON: () => ({})
          },
          timestamp: Date.now()
        } as GeolocationPosition);
      });

      await waitFor(() => {
        expect(result.current.currentLocation).toEqual(location1);
      });

      const location2 = { lat: 1.3522, lng: 103.8199 };
      act(() => {
        positionCallback?.({
          coords: {
            latitude: location2.lat,
            longitude: location2.lng,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
            toJSON: () => ({})
          },
          timestamp: Date.now()
        } as GeolocationPosition);
      });

      await waitFor(() => {
        expect(result.current.currentLocation).toEqual(location2);
      });
    });

    it("should clear watch on unmount", () => {
      mockGeolocation.watchPosition.mockReturnValue(1);

      const { unmount } = renderHook(() =>
        useGeolocation({ enableWatch: true })
      );

      unmount();

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(1);
    });

    it("should use custom watch options", () => {
      const watchOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000
      };

      renderHook(() => useGeolocation({ enableWatch: true, watchOptions }));

      expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining(watchOptions)
      );
    });

    it("should set locationError on watch error", async () => {
      let errorCallback:
        | ((error: GeolocationPositionError) => void)
        | undefined;
      mockGeolocation.watchPosition.mockImplementation((success, error) => {
        errorCallback = error;
        return 1;
      });

      const { result } = renderHook(() =>
        useGeolocation({ enableWatch: true })
      );

      const mockError = {
        code: 1,
        message: "Permission denied",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as unknown as GeolocationPositionError;
      act(() => {
        errorCallback?.(mockError);
      });

      await waitFor(() => {
        expect(result.current.locationError).toBe(mockError);
      });
    });
  });

  describe("startWatching and stopWatching methods", () => {
    it("should start watching manually", () => {
      mockGeolocation.watchPosition.mockReturnValue(1);

      const { result } = renderHook(() =>
        useGeolocation({ skipGeolocation: true })
      );

      act(() => {
        result.current.startWatching();
      });

      expect(mockGeolocation.watchPosition).toHaveBeenCalled();
    });

    it("should stop watching manually", () => {
      mockGeolocation.watchPosition.mockReturnValue(1);

      const { result } = renderHook(() =>
        useGeolocation({ skipGeolocation: true })
      );

      act(() => {
        result.current.startWatching();
      });

      act(() => {
        result.current.stopWatching();
      });

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(1);
    });

    it("should not start watching if already watching", () => {
      mockGeolocation.watchPosition.mockReturnValue(1);

      const { result } = renderHook(() =>
        useGeolocation({ skipGeolocation: true })
      );

      act(() => {
        result.current.startWatching();
        result.current.startWatching();
      });

      expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should clear error state with clearError", async () => {
      let errorCallback:
        | ((error: GeolocationPositionError) => void)
        | undefined;
      mockGeolocation.watchPosition.mockImplementation((success, error) => {
        errorCallback = error;
        return 1;
      });

      const { result } = renderHook(() =>
        useGeolocation({ enableWatch: true })
      );

      const mockError = {
        code: 1,
        message: "Permission denied",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as unknown as GeolocationPositionError;
      act(() => {
        errorCallback?.(mockError);
      });

      await waitFor(() => {
        expect(result.current.locationError).toBe(mockError);
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.locationError).toBeNull();
    });
  });

  // Backwards compatibility alias test removed
  // The functionality is already fully tested above
  // useMapInitialCenter is just an alias to useGeolocation
});
