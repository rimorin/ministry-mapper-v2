import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useMapLink from "./useMapLink";
import * as pocketbase from "../utils/pocketbase";
import {
  DEFAULT_COORDINATES,
  MESSAGE_TYPES,
  PB_FIELDS
} from "../utils/constants";
import { RecordModel } from "pocketbase";

vi.mock("../utils/pocketbase");
vi.mock("./useNotification", () => ({
  default: () => ({
    notifyError: vi.fn()
  })
}));

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

  describe("checkPinnedMessages", () => {
    it("should not check messages if readPinnedMessages is true", async () => {
      const getListSpy = vi.spyOn(pocketbase, "getList");
      const { result } = renderHook(() => useMapLink());

      await result.current.checkPinnedMessages("map123", "true");

      expect(getListSpy).not.toHaveBeenCalled();
    });

    it("should check and set hasPinnedMessages when messages exist", async () => {
      vi.spyOn(pocketbase, "getList").mockResolvedValue([
        {
          id: "msg1",
          collectionId: "messages",
          collectionName: "messages"
        } as RecordModel
      ]);
      const { result } = renderHook(() => useMapLink());

      await result.current.checkPinnedMessages("map123", "false");

      await waitFor(() => {
        expect(result.current.hasPinnedMessages).toBe(true);
      });

      expect(pocketbase.getList).toHaveBeenCalledWith("messages", {
        filter: `map = "map123" && type= "${MESSAGE_TYPES.ADMIN}" && pinned = true`,
        fields: "id",
        requestKey: null
      });
    });

    it("should not set hasPinnedMessages when no messages exist", async () => {
      vi.spyOn(pocketbase, "getList").mockResolvedValue([]);
      const { result } = renderHook(() => useMapLink());

      await result.current.checkPinnedMessages("map123", "false");

      await waitFor(() => {
        expect(result.current.hasPinnedMessages).toBe(false);
      });
    });
  });

  describe("getMapData", () => {
    it("should return early if linkId is undefined", async () => {
      const getDataByIdSpy = vi.spyOn(pocketbase, "getDataById");
      const { result } = renderHook(() => useMapLink());

      const mapId = await result.current.getMapData(undefined, "false");

      expect(mapId).toBeUndefined();
      expect(getDataByIdSpy).not.toHaveBeenCalled();
    });

    it("should set isLinkExpired when assignment not found", async () => {
      vi.spyOn(pocketbase, "getDataById").mockResolvedValue(null);
      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123", "false");

      await waitFor(() => {
        expect(result.current.isLinkExpired).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should set isLinkExpired when expiry date has passed", async () => {
      const pastDate = new Date(Date.now() - 1000000).toISOString();
      vi.spyOn(pocketbase, "getDataById").mockResolvedValue({
        id: "assignment123",
        collectionId: "assignments",
        collectionName: "assignments",
        map: "map123",
        expiry_date: pastDate,
        expand: {
          map: {
            congregation: "cong123",
            expand: {
              congregation: {
                id: "cong123"
              }
            }
          }
        }
      } as RecordModel);
      vi.spyOn(pocketbase, "getList").mockResolvedValue([]);

      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123", "false");

      await waitFor(() => {
        expect(result.current.isLinkExpired).toBe(true);
      });
    });

    it("should successfully load valid link data", async () => {
      const futureDate = new Date(Date.now() + 1000000).toISOString();
      const mockLinkRecord = {
        id: "assignment123",
        collectionId: "assignments",
        collectionName: "assignments",
        map: "map123",
        publisher: "pub123",
        expiry_date: futureDate,
        expand: {
          map: {
            id: "map123",
            type: "Private",
            location: "Test Location",
            progress: 75,
            description: "Test Map",
            coordinates: { lat: 1.3521, lng: 103.8198 },
            congregation: "cong123",
            expand: {
              congregation: {
                id: "cong123",
                max_tries: 3,
                origin: "Singapore",
                expiry_hours: 24
              }
            }
          }
        }
      } as RecordModel;

      const mockOptions = [
        {
          id: "opt1",
          collectionId: "options",
          collectionName: "options",
          code: "NH",
          description: "Not Home",
          is_countable: true,
          is_default: false,
          sequence: 1
        } as RecordModel
      ];

      vi.spyOn(pocketbase, "getDataById").mockResolvedValue(mockLinkRecord);
      vi.spyOn(pocketbase, "getList").mockResolvedValue(mockOptions);

      const { result } = renderHook(() => useMapLink());

      const mapId = await result.current.getMapData("link123", "false");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isLinkExpired).toBe(false);
        expect(result.current.mapDetails).toBeDefined();
        expect(result.current.mapDetails?.id).toBe("map123");
        expect(result.current.mapDetails?.name).toBe("Test Map");
        expect(result.current.coordinates).toEqual({
          lat: 1.3521,
          lng: 103.8198
        });
        expect(mapId).toBe("map123");
      });

      expect(pocketbase.getDataById).toHaveBeenCalledWith(
        "assignments",
        "link123",
        {
          requestKey: null,
          expand: "map, map.congregation",
          fields: PB_FIELDS.ASSIGNMENT_LINKS
        }
      );

      expect(pocketbase.getList).toHaveBeenCalledWith("options", {
        filter: `congregation="cong123"`,
        requestKey: null,
        fields: PB_FIELDS.CONGREGATION_OPTIONS,
        sort: "sequence"
      });
    });

    it("should handle errors and call notifyError", async () => {
      const error = new Error("Network error");
      vi.spyOn(pocketbase, "getDataById").mockRejectedValue(error);

      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123", "false");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should check pinned messages when localStorage key is null", async () => {
      const futureDate = new Date(Date.now() + 1000000).toISOString();
      const mockLinkRecord = {
        id: "assignment123",
        collectionId: "assignments",
        collectionName: "assignments",
        map: "map123",
        publisher: "pub123",
        expiry_date: futureDate,
        expand: {
          map: {
            id: "map123",
            progress: 50,
            description: "Test Map",
            expand: {
              congregation: {
                id: "cong123",
                max_tries: 3,
                origin: "Singapore",
                expiry_hours: 24
              }
            }
          }
        }
      } as RecordModel;

      vi.spyOn(pocketbase, "getDataById").mockResolvedValue(mockLinkRecord);
      vi.spyOn(pocketbase, "getList")
        .mockResolvedValueOnce([]) // congregation options
        .mockResolvedValueOnce([
          {
            id: "msg1",
            collectionId: "messages",
            collectionName: "messages"
          } as RecordModel
        ]); // pinned messages

      const { result } = renderHook(() => useMapLink());

      await result.current.getMapData("link123", "false");

      await waitFor(() => {
        expect(result.current.hasPinnedMessages).toBe(true);
      });
    });
  });

  describe("setters", () => {
    it("should allow updating mapDetails", () => {
      const { result } = renderHook(() => useMapLink());
      const newMapDetails = {
        id: "map456",
        name: "Updated Map",
        type: "Private",
        location: "New Location",
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

      expect(result.current.mapDetails).toMatchObject({
        id: "map456",
        name: "Updated Map",
        type: "Private",
        location: "New Location"
      });
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
