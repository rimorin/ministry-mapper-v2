import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import useAnalytics from "./useAnalytics";

type UmamiWindow = Window & {
  umami?: {
    track: ReturnType<typeof vi.fn>;
    identify: ReturnType<typeof vi.fn>;
  };
};

const mockTrack = vi.fn();
const mockUmami = { track: mockTrack, identify: vi.fn() };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  delete (window as UmamiWindow).umami;
});

describe("useAnalytics", () => {
  describe("trackEvent", () => {
    it("fires in non-production environments when umami is loaded", () => {
      vi.stubEnv("VITE_SYSTEM_ENVIRONMENT", "local");
      (window as UmamiWindow).umami = mockUmami;

      const { result } = renderHook(() => useAnalytics());
      result.current.trackEvent("signup");

      expect(mockTrack).toHaveBeenCalledWith("signup", undefined);
    });

    it("fires in production when umami is loaded", () => {
      vi.stubEnv("VITE_SYSTEM_ENVIRONMENT", "production");
      (window as UmamiWindow).umami = mockUmami;

      const { result } = renderHook(() => useAnalytics());
      result.current.trackEvent("signup");

      expect(mockTrack).toHaveBeenCalledWith("signup", undefined);
    });

    it("passes event data through to umami", () => {
      vi.stubEnv("VITE_SYSTEM_ENVIRONMENT", "production");
      (window as UmamiWindow).umami = mockUmami;

      const { result } = renderHook(() => useAnalytics());
      result.current.trackEvent("login-oauth", { provider: "google" });

      expect(mockTrack).toHaveBeenCalledWith("login-oauth", {
        provider: "google"
      });
    });

    it("does not throw when umami script has not yet loaded", () => {
      vi.stubEnv("VITE_SYSTEM_ENVIRONMENT", "production");

      const { result } = renderHook(() => useAnalytics());
      expect(() => result.current.trackEvent("signup")).not.toThrow();
    });

    it("is a no-op when umami is not loaded", () => {
      vi.stubEnv("VITE_SYSTEM_ENVIRONMENT", "staging");

      const { result } = renderHook(() => useAnalytics());
      result.current.trackEvent("login");

      expect(mockTrack).not.toHaveBeenCalled();
    });
  });
});
