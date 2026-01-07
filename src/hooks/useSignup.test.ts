import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useSignup from "./useSignup";
import * as pocketbase from "../utils/pocketbase";
import type { RecordModel } from "pocketbase";

vi.mock("../utils/pocketbase");
vi.mock("./useNotification", () => ({
  default: () => ({
    notifyError: vi.fn(),
    notifyWarning: vi.fn()
  })
}));

describe("useSignup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useSignup());

      expect(result.current.formData).toEqual({
        email: "",
        password: "",
        confirmPassword: "",
        name: ""
      });
      expect(result.current.validated).toBe(false);
      expect(result.current.isPasswordValid).toBe(false);
      expect(result.current.isCreating).toBe(false);
    });
  });

  describe("handleInputChange", () => {
    it("should update form data on input change", () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.handleInputChange({
          target: { id: "name", value: "John Doe" }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.name).toBe("John Doe");

      act(() => {
        result.current.handleInputChange({
          target: { id: "email", value: "john@example.com" }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.email).toBe("john@example.com");
    });

    it("should update multiple fields independently", () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.handleInputChange({
          target: { id: "password", value: "SecurePass123" }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleInputChange({
          target: { id: "confirmPassword", value: "SecurePass123" }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.password).toBe("SecurePass123");
      expect(result.current.formData.confirmPassword).toBe("SecurePass123");
    });
  });

  describe("handleCreateSubmit", () => {
    it("should successfully create a user account", async () => {
      vi.spyOn(pocketbase, "createData").mockResolvedValue({} as RecordModel);
      vi.spyOn(pocketbase, "verifyEmail").mockResolvedValue(true);

      const { result } = renderHook(() => useSignup());
      const onSuccess = vi.fn();

      // Set form data
      act(() => {
        result.current.handleInputChange({
          target: { id: "name", value: "John Doe" }
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleInputChange({
          target: { id: "email", value: "john@example.com" }
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleInputChange({
          target: { id: "password", value: "SecurePass123" }
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleInputChange({
          target: { id: "confirmPassword", value: "SecurePass123" }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleCreateSubmit(onSuccess);
      });

      expect(pocketbase.createData).toHaveBeenCalledWith(
        "users",
        {
          email: "john@example.com",
          name: "John Doe",
          password: "SecurePass123",
          passwordConfirm: "SecurePass123",
          emailVisibility: true
        },
        {
          requestKey: "user-signup-john@example.com"
        }
      );

      expect(pocketbase.verifyEmail).toHaveBeenCalledWith("john@example.com");
      expect(onSuccess).toHaveBeenCalled();
      expect(result.current.isCreating).toBe(false);
    });

    it("should handle creation errors", async () => {
      const error = new Error("Email already exists");
      vi.spyOn(pocketbase, "createData").mockRejectedValue(error);

      const { result } = renderHook(() => useSignup());
      const onSuccess = vi.fn();

      act(() => {
        result.current.handleInputChange({
          target: { id: "email", value: "existing@example.com" }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleCreateSubmit(onSuccess);
      });

      expect(result.current.validated).toBe(false);
      expect(result.current.isCreating).toBe(false);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("should work without onSuccess callback", async () => {
      vi.spyOn(pocketbase, "createData").mockResolvedValue({} as RecordModel);
      vi.spyOn(pocketbase, "verifyEmail").mockResolvedValue(true);

      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.handleInputChange({
          target: { id: "email", value: "test@example.com" }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleCreateSubmit();
      });

      expect(result.current.isCreating).toBe(false);
    });
  });

  describe("resetCreationForm", () => {
    it("should reset all form fields to default", () => {
      const { result } = renderHook(() => useSignup());

      // Set some values
      act(() => {
        result.current.handleInputChange({
          target: { id: "name", value: "John Doe" }
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleInputChange({
          target: { id: "email", value: "john@example.com" }
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.setValidated(true);
      });

      expect(result.current.formData.name).toBe("John Doe");
      expect(result.current.validated).toBe(true);

      // Reset form
      act(() => {
        result.current.resetCreationForm();
      });

      expect(result.current.formData).toEqual({
        email: "",
        password: "",
        confirmPassword: "",
        name: ""
      });
      expect(result.current.validated).toBe(false);
    });
  });

  describe("setValidated", () => {
    it("should update validated state", () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.setValidated(true);
      });

      expect(result.current.validated).toBe(true);
    });
  });

  describe("setIsPasswordValid", () => {
    it("should update password validity state", () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.setIsPasswordValid(true);
      });

      expect(result.current.isPasswordValid).toBe(true);

      act(() => {
        result.current.setIsPasswordValid(false);
      });

      expect(result.current.isPasswordValid).toBe(false);
    });
  });
});
