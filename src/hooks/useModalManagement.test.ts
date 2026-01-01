import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { lazy } from "react";

// Mock NiceModal before imports
vi.mock("@ebay/nice-modal-react", () => {
  const mockShow = vi.fn();
  const mockHide = vi.fn();

  return {
    default: {
      show: mockShow,
      hide: mockHide
    }
  };
});

// Mock SuspenseComponent
vi.mock("../components/utils/suspense", () => ({
  default: (component: React.ComponentType) => component
}));

// Import after mocks
const { useModalManagement } = await import("./useModalManagement");
const ModalManager = (await import("@ebay/nice-modal-react")).default;

describe("useModalManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("showModal", () => {
    it("should show modal with props", () => {
      const { result } = renderHook(() => useModalManagement());
      const MockComponent = () => null;
      const props = { title: "Test Modal", data: { id: 1 } };

      result.current.showModal(MockComponent, props);

      expect(ModalManager.show).toHaveBeenCalledWith(MockComponent, props);
    });

    it("should handle lazy loaded components", () => {
      const { result } = renderHook(() => useModalManagement());
      const LazyComponent = lazy(() =>
        Promise.resolve({ default: () => null })
      );
      const props = { title: "Lazy Modal" };

      result.current.showModal(LazyComponent, props);

      expect(ModalManager.show).toHaveBeenCalled();
    });

    it("should return modal promise", () => {
      const mockPromise = Promise.resolve({ result: "success" });
      (ModalManager.show as ReturnType<typeof vi.fn>).mockReturnValue(
        mockPromise
      );
      const { result } = renderHook(() => useModalManagement());
      const MockComponent = () => null;

      const returnedPromise = result.current.showModal(MockComponent, {});

      expect(returnedPromise).toBe(mockPromise);
    });
  });

  describe("hideModal", () => {
    it("should hide modal by id", () => {
      const { result } = renderHook(() => useModalManagement());
      const modalId = "test-modal-id";

      result.current.hideModal(modalId);

      expect(ModalManager.hide).toHaveBeenCalledWith(modalId);
    });

    it("should return hide promise", () => {
      const mockPromise = Promise.resolve();
      (ModalManager.hide as ReturnType<typeof vi.fn>).mockReturnValue(
        mockPromise
      );
      const { result } = renderHook(() => useModalManagement());

      const returnedPromise = result.current.hideModal("modal-id");

      expect(returnedPromise).toBe(mockPromise);
    });
  });
});
