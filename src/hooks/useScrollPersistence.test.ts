import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useScrollPersistence from "./useScrollPersistence";

const STORAGE_KEY = "mapListScroll";

const mockElement = { scrollTop: 0 };
vi.mock("react-window", () => ({
  useListRef: () => ({ current: { element: mockElement } })
}));

describe("useScrollPersistence", () => {
  beforeEach(() => {
    localStorage.clear();
    mockElement.scrollTop = 0;
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("return value", () => {
    it("should return listRef and onScroll", () => {
      const { result } = renderHook(() =>
        useScrollPersistence("territory-uuid-1")
      );
      expect(result.current.listRef).toBeDefined();
      expect(typeof result.current.onScroll).toBe("function");
    });
  });

  describe("scroll saving", () => {
    it("should save scroll position to localStorage after debounce", () => {
      const { result } = renderHook(() =>
        useScrollPersistence("territory-uuid-1")
      );

      act(() => {
        result.current.onScroll({
          target: { scrollTop: 300 }
        } as unknown as React.UIEvent<HTMLDivElement>);
        vi.runAllTimers();
      });

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
        id: "territory-uuid-1",
        offset: 300
      });
    });

    it("should debounce multiple scroll events and only save the last", () => {
      const { result } = renderHook(() =>
        useScrollPersistence("territory-uuid-1")
      );

      act(() => {
        result.current.onScroll({
          target: { scrollTop: 100 }
        } as unknown as React.UIEvent<HTMLDivElement>);
        result.current.onScroll({
          target: { scrollTop: 200 }
        } as unknown as React.UIEvent<HTMLDivElement>);
        result.current.onScroll({
          target: { scrollTop: 300 }
        } as unknown as React.UIEvent<HTMLDivElement>);
        vi.runAllTimers();
      });

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
        id: "territory-uuid-1",
        offset: 300
      });
    });

    it("should overwrite a different territory's saved position", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: "territory-uuid-1", offset: 500 })
      );
      const { result } = renderHook(() =>
        useScrollPersistence("territory-uuid-2")
      );

      act(() => {
        result.current.onScroll({
          target: { scrollTop: 200 }
        } as unknown as React.UIEvent<HTMLDivElement>);
        vi.runAllTimers();
      });

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
        id: "territory-uuid-2",
        offset: 200
      });
    });

    it("should not write to localStorage if unmounted before debounce fires", () => {
      const { result, unmount } = renderHook(() =>
        useScrollPersistence("territory-uuid-1")
      );

      act(() => {
        result.current.onScroll({
          target: { scrollTop: 300 }
        } as unknown as React.UIEvent<HTMLDivElement>);
      });

      unmount();
      vi.runAllTimers();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("should silently ignore localStorage write errors", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      const { result } = renderHook(() =>
        useScrollPersistence("territory-uuid-1")
      );

      expect(() =>
        act(() => {
          result.current.onScroll({
            target: { scrollTop: 300 }
          } as unknown as React.UIEvent<HTMLDivElement>);
          vi.runAllTimers();
        })
      ).not.toThrow();
    });
  });

  describe("scroll restoration", () => {
    it("should restore scroll position for the same territory", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: "territory-uuid-1", offset: 500 })
      );

      renderHook(() => useScrollPersistence("territory-uuid-1"));

      act(() => vi.runAllTimers());

      expect(mockElement.scrollTop).toBe(500);
    });

    it("should not restore scroll position for a different territory", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: "territory-uuid-1", offset: 500 })
      );

      renderHook(() => useScrollPersistence("territory-uuid-2"));

      act(() => vi.runAllTimers());

      expect(mockElement.scrollTop).toBe(0);
    });

    it("should not schedule RAF when there is no stored data", () => {
      const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame");

      renderHook(() => useScrollPersistence("territory-uuid-1"));

      expect(rafSpy).not.toHaveBeenCalled();
      rafSpy.mockRestore();
    });

    it("should not schedule RAF when stored offset is 0", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: "territory-uuid-1", offset: 0 })
      );
      const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame");

      renderHook(() => useScrollPersistence("territory-uuid-1"));

      expect(rafSpy).not.toHaveBeenCalled();
      rafSpy.mockRestore();
    });

    it("should handle malformed JSON in localStorage gracefully", () => {
      localStorage.setItem(STORAGE_KEY, "not-valid-json{");

      expect(() =>
        renderHook(() => useScrollPersistence("territory-uuid-1"))
      ).not.toThrow();
      expect(mockElement.scrollTop).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("should cancel RAF on unmount if it has not fired yet", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: "territory-uuid-1", offset: 500 })
      );
      const cancelRafSpy = vi.spyOn(globalThis, "cancelAnimationFrame");

      const { unmount } = renderHook(() =>
        useScrollPersistence("territory-uuid-1")
      );
      unmount();

      expect(cancelRafSpy).toHaveBeenCalled();
      cancelRafSpy.mockRestore();
    });

    it("should cancel debounce timer on unmount", () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
      const { result, unmount } = renderHook(() =>
        useScrollPersistence("territory-uuid-1")
      );

      act(() => {
        result.current.onScroll({
          target: { scrollTop: 100 }
        } as unknown as React.UIEvent<HTMLDivElement>);
      });

      unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});
