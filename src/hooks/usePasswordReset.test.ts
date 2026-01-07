import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import usePasswordReset from "./usePasswordReset";
import * as pocketbase from "../utils/pocketbase";

vi.mock("../utils/pocketbase");
vi.mock("./useNotification", () => ({
  default: () => ({
    notifyError: vi.fn(),
    notifyWarning: vi.fn()
  })
}));

describe("usePasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => usePasswordReset());

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.isResetting).toBe(false);
      expect(result.current.message).toBe("");
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe("handleForgotPassword", () => {
    it("should successfully send password reset email", async () => {
      vi.spyOn(pocketbase, "requestPasswordReset").mockResolvedValue(true);

      const { result } = renderHook(() => usePasswordReset());

      await act(async () => {
        await result.current.handleForgotPassword("test@example.com");
      });

      expect(pocketbase.requestPasswordReset).toHaveBeenCalledWith(
        "test@example.com"
      );
      expect(result.current.isProcessing).toBe(false);
    });

    it("should handle forgot password errors", async () => {
      const error = new Error("User not found");
      vi.spyOn(pocketbase, "requestPasswordReset").mockRejectedValue(error);

      const { result } = renderHook(() => usePasswordReset());

      await act(async () => {
        await result.current.handleForgotPassword("nonexistent@example.com");
      });

      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe("handleResetPassword", () => {
    it("should successfully reset password", async () => {
      vi.spyOn(pocketbase, "confirmPasswordReset").mockResolvedValue(true);

      const { result } = renderHook(() => usePasswordReset());

      await act(async () => {
        await result.current.handleResetPassword(
          "action-code-123",
          "NewPass123",
          "NewPass123"
        );
      });

      expect(pocketbase.confirmPasswordReset).toHaveBeenCalledWith(
        "action-code-123",
        "NewPass123",
        "NewPass123"
      );
      expect(result.current.isResetting).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.message).toBe(
        "Your password has been successfully reset."
      );
    });

    it("should handle password reset errors", async () => {
      const error = new Error("Invalid action code");
      vi.spyOn(pocketbase, "confirmPasswordReset").mockRejectedValue(error);

      const { result } = renderHook(() => usePasswordReset());

      await act(async () => {
        await result.current.handleResetPassword(
          "invalid-code",
          "NewPass123",
          "NewPass123"
        );
      });

      expect(result.current.isResetting).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.message).toBeDefined();
    });
  });

  describe("handleVerifyEmail", () => {
    it("should successfully verify email", async () => {
      vi.spyOn(pocketbase, "confirmVerification").mockResolvedValue(true);

      const { result } = renderHook(() => usePasswordReset());

      await act(async () => {
        await result.current.handleVerifyEmail("verification-code-123");
      });

      expect(pocketbase.confirmVerification).toHaveBeenCalledWith(
        "verification-code-123"
      );
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.message).toBe(
        "Your email address has been verified."
      );
    });

    it("should handle email verification errors", async () => {
      const error = new Error("Verification failed");
      vi.spyOn(pocketbase, "confirmVerification").mockRejectedValue(error);

      const { result } = renderHook(() => usePasswordReset());

      await act(async () => {
        await result.current.handleVerifyEmail("invalid-verification-code");
      });

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.message).toBe("Verification failed");
    });

    it("should handle non-Error objects", async () => {
      const error = { code: "VERIFICATION_ERROR", message: "Failed" };
      vi.spyOn(pocketbase, "confirmVerification").mockRejectedValue(error);

      const { result } = renderHook(() => usePasswordReset());

      await act(async () => {
        await result.current.handleVerifyEmail("invalid-code");
      });

      expect(result.current.isSuccess).toBe(false);
      expect(result.current.message).toContain("VERIFICATION_ERROR");
    });
  });

  describe("loading states", () => {
    it("should set isProcessing during forgot password", async () => {
      let resolvePromise: (value: boolean) => void;
      const promise = new Promise<boolean>((resolve) => {
        resolvePromise = resolve;
      });
      vi.spyOn(pocketbase, "requestPasswordReset").mockReturnValue(promise);

      const { result } = renderHook(() => usePasswordReset());

      act(() => {
        result.current.handleForgotPassword("test@example.com");
      });

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });

      await act(async () => {
        resolvePromise!(true);
        await promise;
      });

      expect(result.current.isProcessing).toBe(false);
    });

    it("should set isResetting during password reset", async () => {
      let resolvePromise: (value: boolean) => void;
      const promise = new Promise<boolean>((resolve) => {
        resolvePromise = resolve;
      });
      vi.spyOn(pocketbase, "confirmPasswordReset").mockReturnValue(promise);

      const { result } = renderHook(() => usePasswordReset());

      act(() => {
        result.current.handleResetPassword("code", "pass", "pass");
      });

      await waitFor(() => {
        expect(result.current.isResetting).toBe(true);
      });

      await act(async () => {
        resolvePromise!(true);
        await promise;
      });

      expect(result.current.isResetting).toBe(false);
    });
  });
});
