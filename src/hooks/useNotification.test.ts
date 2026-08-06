import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useNotification } from "./useNotification";

const { mockToast } = vi.hoisted(() => ({
  mockToast: {
    add: vi.fn(),
    close: vi.fn()
  }
}));

vi.mock("@/components/ui/toast", () => ({
  toast: mockToast
}));

// Mock Sentry
vi.mock("@sentry/react", () => ({
  captureException: vi.fn()
}));

describe("useNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("notifySuccess", () => {
    it("should call toast.add with message", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifySuccess("Operation successful");

      expect(mockToast.add).toHaveBeenCalledWith({
        title: "Operation successful",
        description: undefined,
        type: "success"
      });
    });

    it("should call toast.add with message and description when title provided", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifySuccess("Operation successful", "Success");

      expect(mockToast.add).toHaveBeenCalledWith({
        title: "Operation successful",
        description: "Success",
        type: "success"
      });
    });
  });

  describe("notifyError", () => {
    it("should call toast.add with string message and no auto-dismiss", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifyError("Something went wrong");

      expect(mockToast.add).toHaveBeenCalledWith({
        id: "app-error",
        title: "Something went wrong",
        type: "error",
        timeout: 0
      });
    });

    it("should format Error objects", async () => {
      const { result } = renderHook(() => useNotification());
      const error = new Error("Test error");

      result.current.notifyError(error);

      expect(mockToast.add).toHaveBeenCalled();
    });

    it("should not show notification when silent is true", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifyError("Error message", true);

      expect(mockToast.add).not.toHaveBeenCalled();
    });

    it("should handle abort errors silently", () => {
      const { result } = renderHook(() => useNotification());
      const abortError = { isAbort: true, message: "Aborted" };

      result.current.notifyError(abortError);

      expect(mockToast.add).not.toHaveBeenCalled();
    });

    it("should format validation errors from API", () => {
      const { result } = renderHook(() => useNotification());
      const apiError = {
        status: 400,
        response: {
          message: "Validation failed",
          data: {
            email: { message: "Email is required" },
            password: { message: "Password must be at least 8 characters" }
          }
        }
      };

      result.current.notifyError(apiError);

      expect(mockToast.add).toHaveBeenCalled();
      const errorMessage = mockToast.add.mock.calls[0][0].title;
      expect(errorMessage).toContain("Validation failed");
      expect(errorMessage).toContain("email: Email is required");
      expect(errorMessage).toContain(
        "password: Password must be at least 8 characters"
      );
    });
  });

  describe("notifyWarning", () => {
    it("should call toast.add with message", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifyWarning("This is a warning");

      expect(mockToast.add).toHaveBeenCalledWith({
        title: "This is a warning",
        description: undefined,
        type: "warning"
      });
    });

    it("should call toast.add with description when title provided", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifyWarning("This is a warning", "Warning");

      expect(mockToast.add).toHaveBeenCalledWith({
        title: "This is a warning",
        description: "Warning",
        type: "warning"
      });
    });
  });

  describe("notifyInfo", () => {
    it("should call toast.add with message", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifyInfo("This is info");

      expect(mockToast.add).toHaveBeenCalledWith({
        title: "This is info",
        description: undefined,
        type: "info"
      });
    });

    it("should call toast.add with description when title provided", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifyInfo("This is info", "Information");

      expect(mockToast.add).toHaveBeenCalledWith({
        title: "This is info",
        description: "Information",
        type: "info"
      });
    });
  });

  describe("handleNotification", () => {
    it("should handle success type", () => {
      const { result } = renderHook(() => useNotification());

      result.current.handleNotification("success", "Success message");

      expect(mockToast.add).toHaveBeenCalledWith({
        title: "Success message",
        description: undefined,
        type: "success"
      });
    });

    it("should handle error type", () => {
      const { result } = renderHook(() => useNotification());

      result.current.handleNotification("error", "Error message");

      expect(mockToast.add).toHaveBeenCalledWith({
        id: "app-error",
        title: "Error message",
        type: "error",
        timeout: 0
      });
    });

    it("should handle warning type", () => {
      const { result } = renderHook(() => useNotification());

      result.current.handleNotification("warning", "Warning message");

      expect(mockToast.add).toHaveBeenCalledWith({
        title: "Warning message",
        description: undefined,
        type: "warning"
      });
    });

    it("should handle info type", () => {
      const { result } = renderHook(() => useNotification());

      result.current.handleNotification("info", "Info message");

      expect(mockToast.add).toHaveBeenCalledWith({
        title: "Info message",
        description: undefined,
        type: "info"
      });
    });
  });
});
