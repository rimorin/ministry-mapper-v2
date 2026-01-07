import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useAuthentication from "./useAuthentication";
import * as pocketbase from "../utils/pocketbase";
import type { RecordModel, RecordAuthResponse } from "pocketbase";

vi.mock("../utils/pocketbase");
vi.mock("./useNotification", () => ({
  default: () => ({
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
    notifyInfo: vi.fn()
  })
}));

describe("useAuthentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useAuthentication());

      expect(result.current.isLogin).toBe(false);
      expect(result.current.isOAuthLoading).toBe(false);
      expect(result.current.otpSessionId).toBe("");
      expect(result.current.otpCode).toBe("");
      expect(result.current.mfaId).toBe("");
    });
  });

  describe("loginInWithEmailAndPassword", () => {
    it("should successfully login with email and password", async () => {
      const mockAuthResponse: RecordAuthResponse<RecordModel> = {
        record: { id: "user123" } as RecordModel,
        token: "mock-token"
      };
      vi.spyOn(pocketbase, "authenticateEmailAndPassword").mockResolvedValue(
        mockAuthResponse
      );
      const { result } = renderHook(() => useAuthentication());

      await act(async () => {
        await result.current.loginInWithEmailAndPassword(
          "test@example.com",
          "password123"
        );
      });

      expect(pocketbase.authenticateEmailAndPassword).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
      expect(result.current.isLogin).toBe(false);
    });

    it("should trim and lowercase email before authentication", async () => {
      const mockAuthResponse: RecordAuthResponse<RecordModel> = {
        record: { id: "user123" } as RecordModel,
        token: "mock-token"
      };
      vi.spyOn(pocketbase, "authenticateEmailAndPassword").mockResolvedValue(
        mockAuthResponse
      );
      const { result } = renderHook(() => useAuthentication());

      await act(async () => {
        await result.current.loginInWithEmailAndPassword(
          " Test@Example.COM ",
          "password123"
        );
      });

      expect(pocketbase.authenticateEmailAndPassword).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
    });

    it("should handle MFA requirement and request OTP", async () => {
      const mfaError = {
        response: { mfaId: "mfa-123" }
      };
      vi.spyOn(pocketbase, "authenticateEmailAndPassword").mockRejectedValue(
        mfaError
      );
      vi.spyOn(pocketbase, "requestOTP").mockResolvedValue("otp-session-123");

      const { result } = renderHook(() => useAuthentication());

      await act(async () => {
        await result.current.loginInWithEmailAndPassword(
          "test@example.com",
          "password123"
        );
      });

      await waitFor(() => {
        expect(result.current.otpSessionId).toBe("otp-session-123");
        expect(result.current.mfaId).toBe("mfa-123");
      });
    });

    it("should handle authentication errors without MFA", async () => {
      const error = new Error("Invalid credentials");
      vi.spyOn(pocketbase, "authenticateEmailAndPassword").mockRejectedValue(
        error
      );

      const { result } = renderHook(() => useAuthentication());

      await act(async () => {
        await result.current.loginInWithEmailAndPassword(
          "test@example.com",
          "wrongpassword"
        );
      });

      expect(result.current.isLogin).toBe(false);
      expect(result.current.otpSessionId).toBe("");
    });
  });

  describe("handleOtpSubmit", () => {
    it("should successfully submit OTP", async () => {
      const mockAuthResponse: RecordAuthResponse<RecordModel> = {
        record: { id: "user123" } as RecordModel,
        token: "mock-token"
      };
      vi.spyOn(pocketbase, "authenticateOTP").mockResolvedValue(
        mockAuthResponse
      );

      const { result } = renderHook(() => useAuthentication());

      // Simulate having MFA state set
      await act(async () => {
        await result.current.loginInWithEmailAndPassword(
          "test@example.com",
          "pass"
        );
      });

      await act(async () => {
        await result.current.handleOtpSubmit("otp-session-123", "1234");
      });

      expect(result.current.isLogin).toBe(false);
    });

    it("should handle OTP submission errors", async () => {
      const error = new Error("Invalid OTP");
      vi.spyOn(pocketbase, "authenticateOTP").mockRejectedValue(error);

      const { result } = renderHook(() => useAuthentication());

      await act(async () => {
        await result.current.handleOtpSubmit("otp-session-123", "0000");
      });

      expect(result.current.isLogin).toBe(false);
    });
  });

  describe("handleResendOtp", () => {
    it("should resend OTP to email", async () => {
      vi.spyOn(pocketbase, "requestOTP").mockResolvedValue("new-otp-session");

      const { result } = renderHook(() => useAuthentication());

      await act(async () => {
        await result.current.handleResendOtp(" Test@Example.COM ");
      });

      expect(pocketbase.requestOTP).toHaveBeenCalledWith("test@example.com");
      await waitFor(() => {
        expect(result.current.otpSessionId).toBe("new-otp-session");
      });
    });
  });

  describe("handleOAuthSignIn", () => {
    it("should initiate OAuth sign-in", async () => {
      const mockAuthResponse: RecordAuthResponse<RecordModel> = {
        record: { id: "user123" } as RecordModel,
        token: "mock-token"
      };
      vi.spyOn(pocketbase, "authenticateOAuth2").mockResolvedValue(
        mockAuthResponse
      );

      const { result } = renderHook(() => useAuthentication());

      act(() => {
        result.current.handleOAuthSignIn("google");
      });

      expect(pocketbase.authenticateOAuth2).toHaveBeenCalledWith("google");
    });

    it("should handle OAuth errors", async () => {
      const error = new Error("OAuth failed");
      vi.spyOn(pocketbase, "authenticateOAuth2").mockRejectedValue(error);

      const { result } = renderHook(() => useAuthentication());

      act(() => {
        result.current.handleOAuthSignIn("google");
      });

      await waitFor(() => {
        expect(result.current.isOAuthLoading).toBe(false);
      });
    });
  });

  describe("clearOtpState", () => {
    it("should clear all OTP-related state", async () => {
      vi.spyOn(pocketbase, "requestOTP").mockResolvedValue("otp-session-123");
      const { result } = renderHook(() => useAuthentication());

      // Set OTP state
      await act(async () => {
        await result.current.handleResendOtp("test@example.com");
      });

      act(() => {
        result.current.setOtpCode("1234");
      });

      expect(result.current.otpSessionId).toBe("otp-session-123");
      expect(result.current.otpCode).toBe("1234");

      // Clear state
      act(() => {
        result.current.clearOtpState();
      });

      expect(result.current.otpSessionId).toBe("");
      expect(result.current.otpCode).toBe("");
      expect(result.current.mfaId).toBe("");
    });
  });

  describe("setOtpCode", () => {
    it("should update OTP code", () => {
      const { result } = renderHook(() => useAuthentication());

      act(() => {
        result.current.setOtpCode("5678");
      });

      expect(result.current.otpCode).toBe("5678");
    });
  });
});
