import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useConfirm } from "./useConfirm";

// Mock the modal management hook
const mockShowModal = vi.fn();

vi.mock("./useModalManagement", () => ({
  useModalManagement: () => ({
    showModal: mockShowModal,
    hideModal: vi.fn()
  })
}));

// Mock the ConfirmDialog component
vi.mock("../components/modal/confirmdialog", () => ({
  default: vi.fn()
}));

describe("useConfirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("confirm", () => {
    it("should return true when user confirms", async () => {
      mockShowModal.mockResolvedValue(true);
      const { result } = renderHook(() => useConfirm());

      const confirmed = await result.current.confirm({
        title: "Delete Item",
        message: "Are you sure?"
      });

      expect(confirmed).toBe(true);
      expect(mockShowModal).toHaveBeenCalledWith(expect.any(Object), {
        title: "Delete Item",
        message: "Are you sure?",
        confirmText: undefined,
        cancelText: undefined,
        variant: "danger",
        focusConfirm: false
      });
    });

    it("should return false when user cancels", async () => {
      mockShowModal.mockResolvedValue(false);
      const { result } = renderHook(() => useConfirm());

      const confirmed = await result.current.confirm({
        title: "Delete Item",
        message: "Are you sure?"
      });

      expect(confirmed).toBe(false);
    });

    it("should return false when modal is dismissed", async () => {
      mockShowModal.mockRejectedValue(new Error("Dismissed"));
      const { result } = renderHook(() => useConfirm());

      const confirmed = await result.current.confirm({
        title: "Delete Item",
        message: "Are you sure?"
      });

      expect(confirmed).toBe(false);
    });

    it("should pass custom button text", async () => {
      mockShowModal.mockResolvedValue(true);
      const { result } = renderHook(() => useConfirm());

      await result.current.confirm({
        title: "Confirm Action",
        message: "Proceed?",
        confirmText: "Yes, Continue",
        cancelText: "No, Go Back"
      });

      expect(mockShowModal).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          confirmText: "Yes, Continue",
          cancelText: "No, Go Back"
        })
      );
    });

    it("should support different variants", async () => {
      mockShowModal.mockResolvedValue(true);
      const { result } = renderHook(() => useConfirm());

      await result.current.confirm({
        title: "Warning",
        message: "Continue?",
        variant: "warning"
      });

      expect(mockShowModal).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          variant: "warning"
        })
      );
    });

    it("should support focusConfirm option", async () => {
      mockShowModal.mockResolvedValue(true);
      const { result } = renderHook(() => useConfirm());

      await result.current.confirm({
        title: "Important",
        message: "Proceed?",
        focusConfirm: true
      });

      expect(mockShowModal).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          focusConfirm: true
        })
      );
    });

    it("should handle non-boolean return values", async () => {
      mockShowModal.mockResolvedValue("some-value");
      const { result } = renderHook(() => useConfirm());

      const confirmed = await result.current.confirm({
        title: "Test",
        message: "Test"
      });

      expect(confirmed).toBe(false);
    });
  });
});
