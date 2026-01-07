import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import useTerritoryManagement from "./useTerritoryManagement";
import * as pocketbase from "../utils/pocketbase";

vi.mock("../utils/pocketbase");
vi.mock("./useNotification", () => ({
  default: () => ({
    notifyError: vi.fn()
  })
}));
vi.mock("./useLocalStorage", () => ({
  default: (key: string, defaultValue: string) => {
    return useState(defaultValue);
  }
}));

describe("useTerritoryManagement", () => {
  const mockCongregationCode = "CONG001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      expect(result.current.selectedTerritory).toEqual({
        id: "",
        code: undefined,
        name: undefined
      });
      expect(result.current.territories.size).toBe(0);
      expect(result.current.showTerritoryListing).toBe(false);
      expect(result.current.isProcessingTerritory).toBe(false);
      expect(result.current.congregationTerritoryList).toEqual([]);
    });
  });

  describe("toggleTerritoryListing", () => {
    it("should toggle the territory listing visibility", () => {
      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      expect(result.current.showTerritoryListing).toBe(false);

      act(() => {
        result.current.toggleTerritoryListing();
      });

      expect(result.current.showTerritoryListing).toBe(true);

      act(() => {
        result.current.toggleTerritoryListing();
      });

      expect(result.current.showTerritoryListing).toBe(false);
    });
  });

  describe("handleTerritorySelect", () => {
    it("should update selected territory and close listing", () => {
      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      act(() => {
        result.current.toggleTerritoryListing();
      });

      expect(result.current.showTerritoryListing).toBe(true);

      act(() => {
        result.current.handleTerritorySelect("territory123");
      });

      expect(result.current.selectedTerritory.id).toBe("territory123");
      expect(result.current.showTerritoryListing).toBe(false);
    });
  });

  describe("deleteTerritory", () => {
    it("should not delete if no territory is selected", async () => {
      const deleteDataByIdSpy = vi.spyOn(pocketbase, "deleteDataById");
      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      await act(async () => {
        await result.current.deleteTerritory();
      });

      expect(deleteDataByIdSpy).not.toHaveBeenCalled();
    });

    it("should delete territory and reload page on success", async () => {
      const deleteDataByIdSpy = vi
        .spyOn(pocketbase, "deleteDataById")
        .mockResolvedValue(true);
      const reloadSpy = vi.fn();
      Object.defineProperty(window, "location", {
        value: { reload: reloadSpy },
        writable: true
      });

      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      act(() => {
        result.current.setSelectedTerritory({
          id: "territory123",
          code: "T-01",
          name: "Test Territory"
        });
      });

      await act(async () => {
        await result.current.deleteTerritory();
      });

      expect(deleteDataByIdSpy).toHaveBeenCalledWith(
        "territories",
        "territory123",
        {
          requestKey: `territory-del-${mockCongregationCode}-T-01`
        }
      );
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe("resetTerritory", () => {
    it("should not reset if no territory code is set", async () => {
      const callFunctionSpy = vi.spyOn(pocketbase, "callFunction");
      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      await act(async () => {
        await result.current.resetTerritory();
      });

      expect(callFunctionSpy).not.toHaveBeenCalled();
    });

    it("should reset territory on success", async () => {
      const callFunctionSpy = vi
        .spyOn(pocketbase, "callFunction")
        .mockResolvedValue({});

      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      act(() => {
        result.current.setSelectedTerritory({
          id: "territory123",
          code: "T-01",
          name: "Test Territory"
        });
      });

      await act(async () => {
        await result.current.resetTerritory();
      });

      expect(callFunctionSpy).toHaveBeenCalledWith("/territory/reset", {
        method: "POST",
        body: {
          territory: "territory123"
        }
      });
    });
  });

  describe("processCongregationTerritories", () => {
    it("should return empty map for null/undefined input", () => {
      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      const territoryMap = result.current.processCongregationTerritories(null);

      expect(territoryMap.size).toBe(0);
    });

    it("should process congregation territories correctly", () => {
      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      const mockTerritories = {
        t1: {
          id: "territory1",
          code: "T-01",
          description: "Territory 1",
          progress: 50
        },
        t2: {
          id: "territory2",
          code: "T-02",
          description: "Territory 2",
          progress: 75
        }
      };

      const territoryMap =
        result.current.processCongregationTerritories(mockTerritories);

      expect(territoryMap.size).toBe(2);
      expect(territoryMap.get("territory1")).toEqual({
        id: "territory1",
        code: "T-01",
        name: "Territory 1",
        aggregates: 50
      });
      expect(territoryMap.get("territory2")).toEqual({
        id: "territory2",
        code: "T-02",
        name: "Territory 2",
        aggregates: 75
      });
    });
  });

  describe("clearTerritorySelection", () => {
    it("should clear selected territory", () => {
      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      act(() => {
        result.current.setSelectedTerritory({
          id: "territory123",
          code: "T-01",
          name: "Test Territory"
        });
      });

      expect(result.current.selectedTerritory.id).toBe("territory123");

      act(() => {
        result.current.clearTerritorySelection();
      });

      expect(result.current.selectedTerritory).toEqual({
        id: "",
        code: undefined,
        name: undefined
      });
    });
  });

  describe("updateTerritoryCode", () => {
    it("should update territory code in both selectedTerritory and territories map", () => {
      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      const mockTerritories = new Map([
        [
          "territory1",
          {
            id: "territory1",
            code: "T-01",
            name: "Territory 1",
            aggregates: 50
          }
        ],
        [
          "territory2",
          {
            id: "territory2",
            code: "T-02",
            name: "Territory 2",
            aggregates: 75
          }
        ]
      ]);

      act(() => {
        result.current.setTerritories(mockTerritories);
        result.current.setSelectedTerritory({
          id: "territory1",
          code: "T-01",
          name: "Territory 1"
        });
      });

      act(() => {
        result.current.updateTerritoryCode("territory1", "T-01-NEW");
      });

      expect(result.current.selectedTerritory.code).toBe("T-01-NEW");
      expect(result.current.territories.get("territory1")?.code).toBe(
        "T-01-NEW"
      );
      expect(result.current.territories.get("territory2")?.code).toBe("T-02");
    });
  });

  describe("updateTerritoryName", () => {
    it("should update territory name in both selectedTerritory and territories map", () => {
      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      const mockTerritories = new Map([
        [
          "territory1",
          {
            id: "territory1",
            code: "T-01",
            name: "Territory 1",
            aggregates: 50
          }
        ],
        [
          "territory2",
          {
            id: "territory2",
            code: "T-02",
            name: "Territory 2",
            aggregates: 75
          }
        ]
      ]);

      act(() => {
        result.current.setTerritories(mockTerritories);
        result.current.setSelectedTerritory({
          id: "territory1",
          code: "T-01",
          name: "Territory 1"
        });
      });

      act(() => {
        result.current.updateTerritoryName(
          "territory1",
          "Updated Territory Name"
        );
      });

      expect(result.current.selectedTerritory.name).toBe(
        "Updated Territory Name"
      );
      expect(result.current.territories.get("territory1")?.name).toBe(
        "Updated Territory Name"
      );
      expect(result.current.territories.get("territory2")?.name).toBe(
        "Territory 2"
      );
    });
  });

  describe("congregationTerritoryList", () => {
    it("should return array of territory values", () => {
      const { result } = renderHook(() =>
        useTerritoryManagement({ congregationCode: mockCongregationCode })
      );

      const mockTerritories = new Map([
        [
          "territory1",
          {
            id: "territory1",
            code: "T-01",
            name: "Territory 1",
            aggregates: 50
          }
        ],
        [
          "territory2",
          {
            id: "territory2",
            code: "T-02",
            name: "Territory 2",
            aggregates: 75
          }
        ]
      ]);

      act(() => {
        result.current.setTerritories(mockTerritories);
      });

      expect(result.current.congregationTerritoryList).toHaveLength(2);
      expect(result.current.congregationTerritoryList).toContainEqual({
        id: "territory1",
        code: "T-01",
        name: "Territory 1",
        aggregates: 50
      });
    });
  });
});
