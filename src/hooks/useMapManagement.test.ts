/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useState } from "react";

// Mock dependencies
vi.mock("./useNotification", () => ({
  default: () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
    notifyWarning: vi.fn()
  })
}));

vi.mock("./useLocalStorage", () => ({
  default: (key: string, initialValue: boolean) => {
    const [value, setValue] = useState(initialValue);
    return [value, setValue];
  }
}));

vi.mock("../utils/pocketbase", () => ({
  deleteDataById: vi.fn(() => Promise.resolve()),
  callFunction: vi.fn(() => Promise.resolve()),
  getList: vi.fn(() => Promise.resolve([]))
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue
  })
}));

// Import after mocks
const { default: useMapManagement } = await import("./useMapManagement");
const { deleteDataById, callFunction, getList } =
  await import("../utils/pocketbase");

describe("useMapManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useMapManagement());

      expect(result.current.processingMap).toEqual({
        isProcessing: false,
        mapId: null
      });
      expect(result.current.sortedAddressList).toEqual([]);
      expect(result.current.accordingKeys).toEqual([]);
      expect(result.current.mapViews).toBeInstanceOf(Map);
      expect(result.current.mapViews.size).toBe(0);
      expect(result.current.isMapView).toBe(false);
    });

    it("should expose all required methods", () => {
      const { result } = renderHook(() => useMapManagement());

      expect(typeof result.current.deleteMap).toBe("function");
      expect(typeof result.current.addFloorToMap).toBe("function");
      expect(typeof result.current.resetMap).toBe("function");
      expect(typeof result.current.processMapRecord).toBe("function");
      expect(typeof result.current.setupMaps).toBe("function");
      expect(typeof result.current.handleAddressTerritorySelect).toBe(
        "function"
      );
    });
  });

  describe("deleteMap", () => {
    it("should delete map and notify success", async () => {
      vi.mocked(deleteDataById).mockResolvedValueOnce(undefined as any);

      const { result } = renderHook(() => useMapManagement());

      await act(async () => {
        await result.current.deleteMap("map-123", "Test Map");
      });

      await waitFor(() => {
        expect(deleteDataById).toHaveBeenCalledWith("maps", "map-123", {
          requestKey: "map-del-map-123"
        });
        expect(result.current.processingMap.isProcessing).toBe(false);
      });
    });

    it("should set processing state during deletion", async () => {
      let resolveDelete!: (value: any) => void;
      const deletePromise = new Promise<any>((resolve) => {
        resolveDelete = resolve;
      });
      vi.mocked(deleteDataById).mockReturnValueOnce(deletePromise);

      const { result } = renderHook(() => useMapManagement());

      act(() => {
        result.current.deleteMap("map-123", "Test Map");
      });

      // Should be processing
      expect(result.current.processingMap).toEqual({
        isProcessing: true,
        mapId: "map-123"
      });

      resolveDelete!(undefined);
      await waitFor(() => {
        expect(result.current.processingMap.isProcessing).toBe(false);
      });
    });

    it("should not notify when showNotification is false", async () => {
      vi.mocked(deleteDataById).mockResolvedValueOnce(undefined as any);

      const { result } = renderHook(() => useMapManagement());

      await act(async () => {
        await result.current.deleteMap("map-123", "Test Map", false);
      });

      await waitFor(() => {
        expect(deleteDataById).toHaveBeenCalled();
      });
    });
  });

  describe("addFloorToMap", () => {
    it("should add floor to map", async () => {
      vi.mocked(callFunction).mockResolvedValueOnce({});

      const { result } = renderHook(() => useMapManagement());

      await act(async () => {
        await result.current.addFloorToMap("map-123", false);
      });

      await waitFor(() => {
        expect(callFunction).toHaveBeenCalledWith("/map/floor/add", {
          method: "POST",
          body: {
            map: "map-123",
            add_higher: false
          }
        });
        expect(result.current.processingMap.isProcessing).toBe(false);
      });
    });

    it("should add higher floor when specified", async () => {
      vi.mocked(callFunction).mockResolvedValueOnce({});

      const { result } = renderHook(() => useMapManagement());

      await act(async () => {
        await result.current.addFloorToMap("map-123", true);
      });

      await waitFor(() => {
        expect(callFunction).toHaveBeenCalledWith("/map/floor/add", {
          method: "POST",
          body: {
            map: "map-123",
            add_higher: true
          }
        });
      });
    });
  });

  describe("resetMap", () => {
    it("should reset map statuses", async () => {
      vi.mocked(callFunction).mockResolvedValueOnce({});

      const { result } = renderHook(() => useMapManagement());

      await act(async () => {
        await result.current.resetMap("map-123");
      });

      await waitFor(() => {
        expect(callFunction).toHaveBeenCalledWith("/map/reset", {
          method: "POST",
          body: {
            map: "map-123"
          }
        });
        expect(result.current.processingMap.isProcessing).toBe(false);
      });
    });
  });

  describe("processMapRecord", () => {
    it("should process map record with all fields", () => {
      const { result } = renderHook(() => useMapManagement());

      const mockMapRecord = {
        id: "map-123",
        collectionId: "maps",
        collectionName: "maps",
        type: "PRIVATE",
        location: "123 Main St",
        progress: 75,
        aggregates: {
          notDone: 5,
          notHome: 3
        },
        description: "Test Building",
        coordinates: { lat: 1.23, lng: 4.56 },
        sequence: 1
      } as any;

      const processed = result.current.processMapRecord(mockMapRecord);

      expect(processed).toEqual({
        id: "map-123",
        type: "PRIVATE",
        location: "123 Main St",
        aggregates: {
          display: "75%",
          value: 75,
          notDone: 5,
          notHome: 3
        },
        name: "Test Building",
        coordinates: { lat: 1.23, lng: 4.56 },
        sequence: 1
      });
    });

    it("should use default values for missing fields", () => {
      const { result } = renderHook(() => useMapManagement());

      const mockMapRecord = {
        id: "map-123",
        collectionId: "maps",
        collectionName: "maps",
        progress: 50,
        description: "Test",
        sequence: 1
      } as any;

      const processed = result.current.processMapRecord(mockMapRecord);

      expect(processed.type).toBeDefined();
      expect(processed.location).toBe("");
      expect(processed.aggregates.notDone).toBe(0);
      expect(processed.aggregates.notHome).toBe(0);
      expect(processed.coordinates).toBeDefined();
    });
  });

  describe("setupMaps", () => {
    it("should fetch and setup maps for territory", async () => {
      const mockMaps = [
        {
          id: "map-1",
          collectionId: "maps",
          collectionName: "maps",
          type: "PRIVATE",
          location: "Building A",
          progress: 50,
          description: "Map 1",
          coordinates: { lat: 1, lng: 2 },
          sequence: 1
        },
        {
          id: "map-2",
          collectionId: "maps",
          collectionName: "maps",
          type: "PUBLIC",
          location: "Building B",
          progress: 75,
          description: "Map 2",
          coordinates: { lat: 3, lng: 4 },
          sequence: 2
        }
      ] as any;

      vi.mocked(getList).mockResolvedValueOnce(mockMaps);

      const { result } = renderHook(() => useMapManagement());

      await act(async () => {
        await result.current.setupMaps("territory-123");
      });

      await waitFor(() => {
        expect(getList).toHaveBeenCalledWith("maps", {
          filter: 'territory="territory-123"',
          requestKey: null,
          sort: "sequence",
          fields: expect.any(String)
        });
        expect(result.current.sortedAddressList).toHaveLength(2);
        expect(result.current.accordingKeys).toEqual(["map-1", "map-2"]);
        expect(result.current.mapViews.size).toBe(2);
      });
    });

    it("should not fetch when territoryId is empty", async () => {
      const { result } = renderHook(() => useMapManagement());

      await act(async () => {
        await result.current.setupMaps("");
      });

      expect(getList).not.toHaveBeenCalled();
    });

    it("should respect current map view setting", async () => {
      const mockMaps = [
        {
          id: "map-1",
          collectionId: "maps",
          collectionName: "maps",
          type: "PRIVATE",
          progress: 50,
          description: "Map 1",
          sequence: 1
        }
      ] as any;

      vi.mocked(getList).mockResolvedValueOnce(mockMaps);

      const { result } = renderHook(() => useMapManagement());

      // Set map view to true
      act(() => {
        result.current.setIsMapView(true);
      });

      await act(async () => {
        await result.current.setupMaps("territory-123");
      });

      await waitFor(() => {
        expect(result.current.mapViews.get("map-1")).toBe(true);
      });
    });
  });

  describe("handleAddressTerritorySelect", () => {
    it("should move map to new territory", async () => {
      vi.mocked(callFunction).mockResolvedValueOnce({});

      const mockValues = {
        map: "map-123"
      } as any;

      const mockTerritories = new Map([
        [
          "new-terr-1",
          {
            id: "new-terr-1",
            code: "T2",
            name: "Territory 2",
            aggregates: {} as any
          }
        ]
      ]);

      const mockToggle = vi.fn();

      const { result } = renderHook(() => useMapManagement());

      // Add a map to the list first
      act(() => {
        result.current.setSortedAddressList([
          {
            id: "map-123",
            name: "Test Map",
            type: "PRIVATE",
            location: "Location",
            aggregates: { display: "50%", value: 50, notDone: 0, notHome: 0 },
            coordinates: { lat: 0, lng: 0 },
            sequence: 1,
            assigneeDetailsList: [],
            personalDetailsList: [],
            floors: []
          }
        ] as any);
      });

      await act(async () => {
        await result.current.handleAddressTerritorySelect(
          "new-terr-1",
          mockValues,
          "old-terr-1",
          mockTerritories,
          mockToggle
        );
      });

      await waitFor(() => {
        expect(mockToggle).toHaveBeenCalled();
        expect(callFunction).toHaveBeenCalledWith("/map/territory/update", {
          method: "POST",
          body: {
            map: "map-123",
            new_territory: "new-terr-1",
            old_territory: "old-terr-1"
          }
        });
        expect(result.current.sortedAddressList).toHaveLength(0);
      });
    });

    it("should filter out moved map from list", async () => {
      vi.mocked(callFunction).mockResolvedValueOnce({});

      const mockValues = { map: "map-to-move" } as any;
      const mockTerritories = new Map([
        [
          "new-terr",
          {
            id: "new-terr",
            code: "T2",
            name: "Territory 2",
            aggregates: {} as any
          }
        ]
      ]);
      const mockToggle = vi.fn();

      const { result } = renderHook(() => useMapManagement());

      act(() => {
        result.current.setSortedAddressList([
          {
            id: "map-to-move",
            name: "Map 1",
            type: "PRIVATE",
            location: "Location 1",
            aggregates: { display: "50%", value: 50, notDone: 0, notHome: 0 },
            coordinates: { lat: 0, lng: 0 },
            sequence: 1,
            assigneeDetailsList: [],
            personalDetailsList: [],
            floors: []
          },
          {
            id: "map-to-keep",
            name: "Map 2",
            type: "PRIVATE",
            location: "Location 2",
            aggregates: { display: "75%", value: 75, notDone: 0, notHome: 0 },
            coordinates: { lat: 0, lng: 0 },
            sequence: 2,
            assigneeDetailsList: [],
            personalDetailsList: [],
            floors: []
          }
        ] as any);
      });

      await act(async () => {
        await result.current.handleAddressTerritorySelect(
          "new-terr",
          mockValues,
          "old-terr",
          mockTerritories,
          mockToggle
        );
      });

      await waitFor(() => {
        expect(result.current.sortedAddressList).toHaveLength(1);
        expect(result.current.sortedAddressList[0].id).toBe("map-to-keep");
      });
    });
  });

  describe("state setters", () => {
    it("should update sortedAddressList", () => {
      const { result } = renderHook(() => useMapManagement());

      const newList = [
        {
          id: "map-1",
          name: "Test",
          type: "PRIVATE",
          location: "Location",
          aggregates: { display: "50%", value: 50, notDone: 0, notHome: 0 },
          coordinates: { lat: 0, lng: 0 },
          sequence: 1,
          assigneeDetailsList: [],
          personalDetailsList: [],
          floors: []
        }
      ] as any;

      act(() => {
        result.current.setSortedAddressList(newList);
      });

      expect(result.current.sortedAddressList).toEqual(newList);
    });

    it("should update accordingKeys", () => {
      const { result } = renderHook(() => useMapManagement());

      act(() => {
        result.current.setAccordionKeys(["key-1", "key-2"]);
      });

      expect(result.current.accordingKeys).toEqual(["key-1", "key-2"]);
    });

    it("should update mapViews", () => {
      const { result } = renderHook(() => useMapManagement());

      const newMapViews = new Map([
        ["map-1", true],
        ["map-2", false]
      ]);

      act(() => {
        result.current.setMapViews(newMapViews);
      });

      expect(result.current.mapViews).toEqual(newMapViews);
    });

    it("should toggle isMapView", () => {
      const { result } = renderHook(() => useMapManagement());

      expect(result.current.isMapView).toBe(false);

      act(() => {
        result.current.setIsMapView(true);
      });

      expect(result.current.isMapView).toBe(true);
    });
  });
});
