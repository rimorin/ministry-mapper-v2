import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useVersionCheck } from "./useVersionCheck";
import * as Sentry from "@sentry/react";

// Mock Sentry
vi.mock("@sentry/react", () => ({
  captureException: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

// Use generic test versions (not tied to actual app version)
const CURRENT_VERSION = "1.0.0";
const NEW_VERSION = "2.0.0";

// Mock environment variable
vi.stubEnv("VITE_APP_VERSION", CURRENT_VERSION);

describe("useVersionCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("should return initial state", () => {
      const { result } = renderHook(() => useVersionCheck(60000));

      expect(result.current.needRefresh).toBe(false);
      expect(typeof result.current.refresh).toBe("function");
    });
  });

  describe("version checking", () => {
    it("should detect new version", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          version: NEW_VERSION,
          buildTime: "2026-02-13T10:00:00Z"
        })
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const { result } = renderHook(() => useVersionCheck(60000));

      await waitFor(() => {
        expect(result.current.needRefresh).toBe(true);
      });
    });

    it("should not flag refresh when versions match", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          version: CURRENT_VERSION,
          buildTime: "2026-02-13T10:00:00Z"
        })
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const { result } = renderHook(() => useVersionCheck(60000));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      expect(result.current.needRefresh).toBe(false);
    });

    it("should use cache busting query parameter", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          version: CURRENT_VERSION,
          buildTime: "2026-02-13T10:00:00Z"
        })
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      renderHook(() => useVersionCheck(60000));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const callArg = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(callArg).toMatch(/\/version\.json\?t=\d+/);
    });
  });

  describe("error handling", () => {
    it("should handle fetch errors gracefully", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useVersionCheck(60000));

      await waitFor(() => {
        expect(Sentry.captureException).toHaveBeenCalled();
      });

      expect(result.current.needRefresh).toBe(false);
    });

    it("should handle non-ok responses", async () => {
      const mockResponse = {
        ok: false,
        status: 404
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const { result } = renderHook(() => useVersionCheck(60000));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      expect(result.current.needRefresh).toBe(false);
    });
  });

  describe("refresh function", () => {
    it("should reload window when called", () => {
      const reloadSpy = vi.fn();
      Object.defineProperty(window, "location", {
        writable: true,
        value: { reload: reloadSpy }
      });

      const { result } = renderHook(() => useVersionCheck(60000));

      result.current.refresh();

      expect(reloadSpy).toHaveBeenCalled();
    });
  });
});
