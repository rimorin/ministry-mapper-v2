import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import useLocalStorage from "./useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should return initial value when localStorage is empty", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );
      expect(result.current[0]).toBe("default");
    });

    it("should return stored value when localStorage has data", () => {
      localStorage.setItem("testKey", JSON.stringify("stored"));
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );
      expect(result.current[0]).toBe("stored");
    });

    it("should handle JSON parsing errors gracefully", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      localStorage.setItem("testKey", "invalid-json{");
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );
      expect(result.current[0]).toBe("default");
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should work with boolean values", () => {
      localStorage.setItem("boolKey", JSON.stringify(true));
      const { result } = renderHook(() => useLocalStorage("boolKey", false));
      expect(result.current[0]).toBe(true);
    });

    it("should work with number values", () => {
      localStorage.setItem("numKey", JSON.stringify(42));
      const { result } = renderHook(() => useLocalStorage("numKey", 0));
      expect(result.current[0]).toBe(42);
    });
  });

  describe("setValue", () => {
    it("should update localStorage and state", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      act(() => {
        result.current[1]("newValue");
      });

      expect(result.current[0]).toBe("newValue");
      expect(localStorage.getItem("testKey")).toBe('"newValue"');
    });

    it("should accept function updater", () => {
      const { result } = renderHook(() => useLocalStorage("counter", 0));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);
      expect(localStorage.getItem("counter")).toBe("1");
    });

    it("should handle multiple updates", () => {
      const { result } = renderHook(() => useLocalStorage("counter", 0));

      act(() => {
        result.current[1](1);
      });
      act(() => {
        result.current[1](2);
      });
      act(() => {
        result.current[1](3);
      });

      expect(result.current[0]).toBe(3);
    });

    it("should remove item when value is null", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      act(() => {
        result.current[1]("value");
      });

      expect(localStorage.getItem("testKey")).toBe('"value"');

      act(() => {
        result.current[1](null as unknown as string);
      });

      expect(localStorage.getItem("testKey")).toBeNull();
      expect(result.current[0]).toBe("default");
    });

    it("should remove item when value is empty string", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      act(() => {
        result.current[1]("value");
      });

      act(() => {
        result.current[1]("");
      });

      expect(localStorage.getItem("testKey")).toBeNull();
      expect(result.current[0]).toBe("default");
    });

    it("should handle setting boolean values", () => {
      const { result } = renderHook(() => useLocalStorage("boolKey", false));

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);
      expect(localStorage.getItem("boolKey")).toBe("true");
    });
  });

  describe("removeValue", () => {
    it("should remove item and reset to initial value", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      act(() => {
        result.current[1]("value");
      });

      expect(result.current[0]).toBe("value");

      act(() => {
        result.current[2](); // removeValue
      });

      expect(localStorage.getItem("testKey")).toBeNull();
      expect(result.current[0]).toBe("default");
    });

    it("should be safe to call multiple times", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      act(() => {
        result.current[1]("value");
      });

      act(() => {
        result.current[2]();
        result.current[2]();
        result.current[2]();
      });

      expect(localStorage.getItem("testKey")).toBeNull();
      expect(result.current[0]).toBe("default");
    });
  });

  describe("cross-tab synchronization", () => {
    it("should sync state when storage event fires", async () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "testKey",
            newValue: JSON.stringify("synced")
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0]).toBe("synced");
      });
    });

    it("should reset to initial when storage is cleared", async () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      act(() => {
        result.current[1]("value");
      });

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "testKey",
            newValue: null
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0]).toBe("default");
      });
    });

    it("should ignore events for different keys", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      act(() => {
        result.current[1]("value");
      });

      const initialValue = result.current[0];

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "otherKey",
            newValue: JSON.stringify("other")
          })
        );
      });

      expect(result.current[0]).toBe(initialValue);
    });

    it("should handle invalid JSON in storage event", async () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "testKey",
            newValue: "invalid-json{"
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0]).toBe("default");
      });
    });
  });

  describe("error handling", () => {
    it("should handle localStorage quota exceeded on set", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      const setItemSpy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("QuotaExceededError");
        });

      act(() => {
        result.current[1]("large-value");
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      setItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("should handle localStorage errors on remove", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      const removeItemSpy = vi
        .spyOn(Storage.prototype, "removeItem")
        .mockImplementation(() => {
          throw new Error("Storage error");
        });

      act(() => {
        result.current[2]();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      removeItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("hook cleanup", () => {
    it("should cleanup storage event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "storage",
        expect.any(Function)
      );
      removeEventListenerSpy.mockRestore();
    });
  });

  describe("edge cases", () => {
    it("should handle objects as values", () => {
      const { result } = renderHook(() =>
        useLocalStorage<{ name: string }>("objKey", { name: "default" })
      );

      act(() => {
        result.current[1]({ name: "updated" });
      });

      expect(result.current[0]).toEqual({ name: "updated" });
      expect(JSON.parse(localStorage.getItem("objKey")!)).toEqual({
        name: "updated"
      });
    });

    it("should handle arrays as values", () => {
      const { result } = renderHook(() =>
        useLocalStorage<string[]>("arrayKey", [])
      );

      act(() => {
        result.current[1](["a", "b", "c"]);
      });

      expect(result.current[0]).toEqual(["a", "b", "c"]);
      expect(JSON.parse(localStorage.getItem("arrayKey")!)).toEqual([
        "a",
        "b",
        "c"
      ]);
    });
  });
});
