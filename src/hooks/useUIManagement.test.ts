import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useUIState from "./useUIManagement";

describe("useUIManagement", () => {
  beforeEach(() => {
    // Reset window scroll
    window.scrollY = 0;
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useUIState());

      expect(result.current.showBkTopButton).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isUnauthorised).toBe(false);
      expect(result.current.showChangeAddressTerritory).toBe(false);
      expect(result.current.showLanguageSelector).toBe(false);
      expect(result.current.values).toEqual({});
      expect(result.current.isAssignmentLoading).toBe(false);
    });
  });

  describe("loading state", () => {
    it("should update loading state", () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
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

  describe("handleScroll", () => {
    it("should show back to top button when scrolled past threshold", () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        window.scrollY = 1000; // Above threshold
        result.current.handleScroll();
      });

      expect(result.current.showBkTopButton).toBe(true);
    });

    it("should hide back to top button when scrolled below threshold", () => {
      const { result } = renderHook(() => useUIState());

      act(() => {
        window.scrollY = 1000;
        result.current.handleScroll();
      });

      expect(result.current.showBkTopButton).toBe(true);

      act(() => {
        window.scrollY = 0;
        result.current.handleScroll();
      });

      expect(result.current.showBkTopButton).toBe(false);
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
