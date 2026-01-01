import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useNotification } from "./useNotification";

// Mock the toast hook
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
};

vi.mock("../components/middlewares/toast", () => ({
  useToast: () => mockToast
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
    it("should call toast.success with message", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifySuccess("Operation successful");

      expect(mockToast.success).toHaveBeenCalledWith(
        "Operation successful",
        undefined
      );
    });

    it("should call toast.success with message and title", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifySuccess("Operation successful", "Success");

      expect(mockToast.success).toHaveBeenCalledWith(
        "Operation successful",
        "Success"
      );
    });
  });

  describe("notifyError", () => {
    it("should call toast.error with string message", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifyError("Something went wrong");

      expect(mockToast.error).toHaveBeenCalledWith(
        "Something went wrong",
        "Error"
      );
    });

    it("should format Error objects", async () => {
      const { result } = renderHook(() => useNotification());
      const error = new Error("Test error");

      result.current.notifyError(error);

      expect(mockToast.error).toHaveBeenCalled();
    });

    it("should not show notification when silent is true", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifyError("Error message", true);

      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it("should handle abort errors silently", () => {
      const { result } = renderHook(() => useNotification());
      const abortError = { isAbort: true, message: "Aborted" };

      result.current.notifyError(abortError);

      expect(mockToast.error).not.toHaveBeenCalled();
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

      expect(mockToast.error).toHaveBeenCalled();
      const errorMessage = mockToast.error.mock.calls[0][0];
      expect(errorMessage).toContain("Validation failed");
      expect(errorMessage).toContain("email: Email is required");
      expect(errorMessage).toContain(
        "password: Password must be at least 8 characters"
      );
    });
  });

  describe("notifyWarning", () => {
    it("should call toast.warning with message", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifyWarning("This is a warning");

      expect(mockToast.warning).toHaveBeenCalledWith(
        "This is a warning",
        undefined
      );
    });

    it("should call toast.warning with message and title", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifyWarning("This is a warning", "Warning");

      expect(mockToast.warning).toHaveBeenCalledWith(
        "This is a warning",
        "Warning"
      );
    });
  });

  describe("notifyInfo", () => {
    it("should call toast.info with message", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifyInfo("This is info");

      expect(mockToast.info).toHaveBeenCalledWith("This is info", undefined);
    });

    it("should call toast.info with message and title", () => {
      const { result } = renderHook(() => useNotification());

      result.current.notifyInfo("This is info", "Information");

      expect(mockToast.info).toHaveBeenCalledWith(
        "This is info",
        "Information"
      );
    });
  });

  describe("handleNotification", () => {
    it("should handle success type", () => {
      const { result } = renderHook(() => useNotification());

      result.current.handleNotification("success", "Success message");

      expect(mockToast.success).toHaveBeenCalledWith(
        "Success message",
        undefined
      );
    });

    it("should handle error type", () => {
      const { result } = renderHook(() => useNotification());

      result.current.handleNotification("error", "Error message");

      expect(mockToast.error).toHaveBeenCalledWith("Error message", "Error");
    });

    it("should handle warning type", () => {
      const { result } = renderHook(() => useNotification());

      result.current.handleNotification("warning", "Warning message");

      expect(mockToast.warning).toHaveBeenCalledWith(
        "Warning message",
        undefined
      );
    });

    it("should handle info type", () => {
      const { result } = renderHook(() => useNotification());

      result.current.handleNotification("info", "Info message");

      expect(mockToast.info).toHaveBeenCalledWith("Info message", undefined);
    });
  });
});
