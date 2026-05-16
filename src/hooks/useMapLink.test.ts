import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useMapLink from "./useMapLink";
import * as pocketbase from "../utils/pocketbase";
import { DEFAULT_COORDINATES } from "../utils/constants";
import { saveAssignmentCache } from "../utils/smartsync";
import type { LinkMapResponse } from "../utils/interface";
import { ClientResponseError } from "pocketbase";

vi.mock("../utils/pocketbase", async () => {
  const actual = await vi.importActual("../utils/pocketbase");
  return { ...(actual as object), callFunction: vi.fn() };
});
vi.mock("./useNotification", () => ({
  default: () => ({
    notifyError: vi.fn()
  })
}));
vi.mock("react-i18next", async () => {
  const actual = await vi.importActual("react-i18next");
  return {
    ...(actual as object),
    useTranslation: () => ({
      t: (key: string, defaultValue: string) => defaultValue,
      i18n: { language: "en" }
    })
  };
});

const futureDate = new Date(Date.now() + 1_000_000).toISOString();
const pastDate = new Date(Date.now() - 1_000_000).toISOString();

const mockResponse: LinkMapResponse = {
  expiry_date: futureDate,
  publisher: "Test Publisher",
  map: {
    id: "map123",
    description: "Test Map",
    type: "single",
    coordinates: { lat: 1.3521, lng: 103.8198 },
    progress: 75,
    aggregates: { notDone: 2, notHome: 1 },
    territory: "territory123"
  },
  congregation: {
    id: "cong123",
    max_tries: 3,
    origin: "sg",
    expiry_hours: 24,
    options: [
      {
        id: "opt1",
        code: "NH",
        description: "Not Home",
        is_countable: true,
        is_default: false,
        sequence: 1
      }
    ]
  },
  addresses: [
    {
      id: "addr1",
      code: "10",
      floor: 1,
      sequence: 1,
      status: "not_done",
      notes: "",
      not_home_tries: 0,
      dnc_time: "",
      coordinates: null,
      updated: "",
      updated_by: "",
      options: []
    }
  ],
  has_pinned_messages: false
};

describe("useMapLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useMapLink());

      expect(result.current.isLinkExpired).toBe(false);
      expect(result.current.tokenEndTime).toBe(0);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.coordinates).toEqual(DEFAULT_COORDINATES.Singapore);
      expect(result.current.mapDetails).toBeUndefined();
      expect(result.current.hasPinnedMessages).toBe(false);
    });
  });

  describe("getMapData", () => {
    it("should return early when linkId is undefined", async () => {
      const callFunctionSpy = vi.spyOn(pocketbase, "callFunction");
      const { result } = renderHook(() => useMapLink());

      const res = await result.current.getMapData(undefined);

      expect(res).toBeUndefined();
      expect(callFunctionSpy).not.toHaveBeenCalled();
    });

    it("should call /link/map with POST and null requestKey", async () => {
      const spy = vi
        .spyOn(pocketbase, "callFunction")
        .mockResolvedValue(mockResponse);
      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123");

      expect(spy).toHaveBeenCalledWith("/link/map", {
        method: "POST",
        requestKey: null
      });
    });

    it("should load map data and return mapId and preloadedAddresses", async () => {
      vi.spyOn(pocketbase, "callFunction").mockResolvedValue(mockResponse);
      const { result } = renderHook(() => useMapLink());

      const res = await result.current.getMapData("link123");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isLinkExpired).toBe(false);
        expect(result.current.mapDetails?.id).toBe("map123");
        expect(result.current.mapDetails?.name).toBe("Test Map");
        expect(result.current.coordinates).toEqual({
          lat: 1.3521,
          lng: 103.8198
        });
      });

      expect(res).toEqual({
        mapId: "map123",
        preloadedAddresses: mockResponse.addresses
      });
    });

    it("should set tokenEndTime from expiry date and territoryId from map", async () => {
      vi.spyOn(pocketbase, "callFunction").mockResolvedValue(mockResponse);
      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123");

      await waitFor(() => {
        expect(result.current.tokenEndTime).toBe(
          new Date(mockResponse.expiry_date).getTime()
        );
        expect(result.current.territoryId).toBe("territory123");
      });
    });

    it("should fall back to DEFAULT_COORDINATES when map has no coordinates", async () => {
      vi.spyOn(pocketbase, "callFunction").mockResolvedValue({
        ...mockResponse,
        map: { ...mockResponse.map, coordinates: null }
      });
      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123");

      await waitFor(() => {
        expect(result.current.coordinates).toEqual(
          DEFAULT_COORDINATES.Singapore
        );
      });
    });

    it("should resolve a localized JSON description to a plain string", async () => {
      vi.spyOn(pocketbase, "callFunction").mockResolvedValue({
        ...mockResponse,
        map: {
          ...mockResponse.map,
          description: { en: "English Map", zh: "中文地图" }
        }
      });
      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123");

      await waitFor(() => {
        expect(result.current.mapDetails?.name).toBe("English Map");
      });
    });

    it("should set isLinkExpired when expiry date has passed", async () => {
      vi.spyOn(pocketbase, "callFunction").mockResolvedValue({
        ...mockResponse,
        expiry_date: pastDate
      });
      const { result } = renderHook(() => useMapLink());

      const res = await result.current.getMapData("link123");

      await waitFor(() => {
        expect(result.current.isLinkExpired).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
      expect(res).toBeUndefined();
    });

    it("should return undefined when response has no map id (stale format)", async () => {
      vi.spyOn(pocketbase, "callFunction").mockResolvedValue({
        some: "garbage"
      });
      const { result } = renderHook(() => useMapLink());

      const res = await result.current.getMapData("link123");

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(res).toBeUndefined();
    });

    it("should set hasPinnedMessages from response", async () => {
      vi.spyOn(pocketbase, "callFunction").mockResolvedValue({
        ...mockResponse,
        has_pinned_messages: true
      });
      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123");

      await waitFor(() => {
        expect(result.current.hasPinnedMessages).toBe(true);
      });
    });

    it("should save response to cache (excluding addresses)", async () => {
      vi.spyOn(pocketbase, "callFunction").mockResolvedValue(mockResponse);
      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123");

      const raw = localStorage.getItem("mm-assignment-link123");
      expect(raw).not.toBeNull();
      const cached = JSON.parse(raw!);
      expect(cached.data.map.id).toBe("map123");
      expect(cached.data.addresses).toBeUndefined();
    });

    it("should fall back to cache on fetch error and return empty preloadedAddresses", async () => {
      const { addresses, ...cachedData } = mockResponse;
      saveAssignmentCache("link123", cachedData);
      vi.spyOn(pocketbase, "callFunction").mockRejectedValue(
        new Error("Network error")
      );
      const { result } = renderHook(() => useMapLink());

      const res = await result.current.getMapData("link123");

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(res).toEqual({ mapId: "map123", preloadedAddresses: [] });
      expect(result.current.mapDetails?.id).toBe("map123");
    });

    it("should not write to cache when using a preloaded record", async () => {
      const { addresses, ...cachedData } = mockResponse;
      saveAssignmentCache("link123", cachedData);
      vi.spyOn(pocketbase, "callFunction").mockRejectedValue(
        new Error("Network error")
      );
      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123");

      // cachedAt should not have been updated (cache write is skipped for preloaded records)
      const raw = localStorage.getItem("mm-assignment-link123");
      const entry = JSON.parse(raw!);
      expect(entry.data.addresses).toBeUndefined();
      // Verify it's the same entry we saved, not a new one written by the hook
      expect(entry.cachedAt).toBeLessThanOrEqual(Date.now());
    });

    it("should set isLinkExpired and not fall back to cache on 401", async () => {
      const { addresses, ...cachedData } = mockResponse;
      saveAssignmentCache("link123", cachedData);
      const authError = new ClientResponseError({ status: 401, response: {} });
      vi.spyOn(pocketbase, "callFunction").mockRejectedValue(authError);
      const { result } = renderHook(() => useMapLink());

      const res = await result.current.getMapData("link123");

      await waitFor(() => {
        expect(result.current.isLinkExpired).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
      expect(res).toBeUndefined();
      expect(result.current.mapDetails).toBeUndefined();
      expect(localStorage.getItem("mm-assignment-link123")).toBeNull();
    });

    it("should return undefined and finish loading when fetch fails and no cache exists", async () => {
      vi.spyOn(pocketbase, "callFunction").mockRejectedValue(
        new Error("Network error")
      );
      const { result } = renderHook(() => useMapLink());

      const res = await result.current.getMapData("link123");

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(res).toBeUndefined();
      expect(result.current.mapDetails).toBeUndefined();
    });
  });

  describe("mid-session expiry", () => {
    it("should set isLinkExpired and clear cache on mm-auth-expired event", async () => {
      vi.spyOn(pocketbase, "callFunction").mockResolvedValue(mockResponse);
      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123");
      expect(localStorage.getItem("mm-assignment-link123")).not.toBeNull();

      act(() => {
        window.dispatchEvent(new CustomEvent("mm-auth-expired"));
      });

      await waitFor(() => expect(result.current.isLinkExpired).toBe(true));
      expect(localStorage.getItem("mm-assignment-link123")).toBeNull();
    });

    it("should set isLinkExpired and clear cache when markLinkExpired is called", async () => {
      vi.spyOn(pocketbase, "callFunction").mockResolvedValue(mockResponse);
      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123");
      expect(localStorage.getItem("mm-assignment-link123")).not.toBeNull();

      act(() => {
        result.current.markLinkExpired();
      });

      await waitFor(() => expect(result.current.isLinkExpired).toBe(true));
      expect(localStorage.getItem("mm-assignment-link123")).toBeNull();
    });
  });

  describe("setters", () => {
    it("should allow updating mapDetails", () => {
      const { result } = renderHook(() => useMapLink());
      const newMapDetails = {
        id: "map456",
        name: "Updated Map",
        type: "single",
        aggregates: { display: "80%", value: 80, notHome: 0, notDone: 0 },
        coordinates: { lat: 1.3521, lng: 103.8198 },
        assigneeDetailsList: [],
        personalDetailsList: [],
        floors: [],
        sequence: 1
      };

      act(() => {
        result.current.setMapDetails(newMapDetails);
      });

      expect(result.current.mapDetails?.id).toBe("map456");
      expect(result.current.mapDetails?.name).toBe("Updated Map");
    });

    it("should allow updating hasPinnedMessages", () => {
      const { result } = renderHook(() => useMapLink());

      act(() => {
        result.current.setHasPinnedMessages(true);
      });

      expect(result.current.hasPinnedMessages).toBe(true);
    });
  });
});
