import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useUIState from "./useUIManagement";

describe("useUIManagement", () => {
  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.showBkTopButton).toBe(false);
      expect(result.current.isUnauthorised).toBe(false);
      expect(result.current.showChangeAddressTerritory).toBe(false);
      expect(result.current.showLanguageSelector).toBe(false);
      expect(result.current.values).toEqual({});
      expect(result.current.isAssignmentLoading).toBe(false);
    });
  });

  describe("unauthorized state", () => {
    it("should update unauthorized state", () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setIsUnauthorised(true);
      });

      expect(result.current.isUnauthorised).toBe(true);
    });
  });

  describe("toggleAddressTerritoryListing", () => {
    it("should toggle address territory listing", () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.showChangeAddressTerritory).toBe(false);

      act(() => {
        result.current.toggleAddressTerritoryListing();
      });

      expect(result.current.showChangeAddressTerritory).toBe(true);

      act(() => {
        result.current.toggleAddressTerritoryListing();
      });

      expect(result.current.showChangeAddressTerritory).toBe(false);
    });
  });

  describe("toggleLanguageSelector", () => {
    it("should toggle language selector", () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.showLanguageSelector).toBe(false);

      act(() => {
        result.current.toggleLanguageSelector();
      });

      expect(result.current.showLanguageSelector).toBe(true);

      act(() => {
        result.current.toggleLanguageSelector();
      });

      expect(result.current.showLanguageSelector).toBe(false);
    });
  });

  describe("values state", () => {
    it("should update values", () => {
      const { result } = renderHook(() => useUIState());
      const newValues = { territoryId: "123", mapId: "456" };

      act(() => {
        result.current.setValues(newValues);
      });

      expect(result.current.values).toEqual(newValues);
    });
  });

  describe("assignment loading state", () => {
    it("should update assignment loading state", () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setIsAssignmentLoading(true);
      });

      expect(result.current.isAssignmentLoading).toBe(true);

      act(() => {
        result.current.setIsAssignmentLoading(false);
      });

      expect(result.current.isAssignmentLoading).toBe(false);
    });
  });
});
