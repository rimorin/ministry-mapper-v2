import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useAuthentication from "./useAuthentication";
import * as pocketbase from "../utils/pocketbase";
import type { RecordModel, RecordAuthResponse } from "pocketbase";

const { mockNotifyError, mockNotifyInfo } = vi.hoisted(() => ({
  mockNotifyError: vi.fn(),
  mockNotifyInfo: vi.fn()
}));

vi.mock("../utils/pocketbase");
vi.mock("./useNotification", () => ({
  default: () => ({
    notifyError: mockNotifyError,
    notifyWarning: vi.fn(),
    notifyInfo: mockNotifyInfo,
    runAction: vi.fn().mockImplementation(
      async (
        fn: () => Promise<unknown>,
        options?: {
          setLoading?: (v: boolean) => void;
          onError?: (e: unknown) => void;
        }
      ) => {
        options?.setLoading?.(true);
        try {
          await fn();
        } catch (error) {
          options?.onError?.(error);
        } finally {
          options?.setLoading?.(false);
        }
      }
    )
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

    it("shows a friendly message for an expired OTP instead of reporting the error", async () => {
      const error = Object.assign(new Error("ClientResponseError"), {
        status: 400,
        response: { message: "Invalid or expired OTP.", data: {} }
      });
      vi.spyOn(pocketbase, "authenticateOTP").mockRejectedValue(error);

      const { result } = renderHook(() => useAuthentication());

      await act(async () => {
        await result.current.handleOtpSubmit("otp-session-123", "0000");
      });

      expect(mockNotifyError).toHaveBeenCalledWith(expect.any(String));
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
      expect(mockNotifyInfo).toHaveBeenCalledWith("A new code is on its way.");
    });

    it("says nothing was sent when the resend fails", async () => {
      const error = new Error("Too many requests");
      vi.spyOn(pocketbase, "requestOTP").mockRejectedValue(error);

      const { result } = renderHook(() => useAuthentication());

      await act(async () => {
        await result.current.handleResendOtp("test@example.com");
      });

      expect(mockNotifyError).toHaveBeenCalled();
      expect(mockNotifyInfo).not.toHaveBeenCalled();
    });
  });

  describe("handleOAuthSignIn", () => {
    it("should initiate OAuth sign-in", async () => {
      vi.spyOn(pocketbase, "startOAuth2Flow").mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthentication());

      act(() => {
        result.current.handleOAuthSignIn("google");
      });

      expect(pocketbase.startOAuth2Flow).toHaveBeenCalledWith("google");
    });

    it("frees the buttons when Back restores the page", async () => {
      vi.spyOn(pocketbase, "startOAuth2Flow").mockResolvedValue(undefined);
      const { result } = renderHook(() => useAuthentication());

      await act(async () => {
        result.current.handleOAuthSignIn("apple");
      });
      act(() => {
        window.dispatchEvent(new Event("pageshow"));
      });

      expect(result.current.isOAuthLoading).toBe(false);
    });

    it("stays busy after the redirect, until a time limit", async () => {
      vi.useFakeTimers();
      try {
        vi.spyOn(pocketbase, "startOAuth2Flow").mockResolvedValue(undefined);
        const { result } = renderHook(() => useAuthentication());

        await act(async () => {
          result.current.handleOAuthSignIn("apple");
        });
        expect(result.current.isOAuthLoading).toBe(true);

        act(() => {
          vi.advanceTimersByTime(4_000);
        });

        expect(result.current.isOAuthLoading).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should handle OAuth errors", async () => {
      const error = new Error("OAuth failed");
      vi.spyOn(pocketbase, "startOAuth2Flow").mockRejectedValue(error);

      const { result } = renderHook(() => useAuthentication());

      act(() => {
        result.current.handleOAuthSignIn("google");
      });

      await waitFor(() => {
        expect(result.current.isOAuthLoading).toBe(false);
      });
      expect(mockNotifyError).toHaveBeenCalledWith(error);
    });
  });

  describe("clearOtpState", () => {
    it("should clear all OTP-related state", async () => {
      vi.spyOn(pocketbase, "requestOTP").mockResolvedValue("otp-session-123");
      const { result } = renderHook(() => useAuthentication());

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
