import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useState } from "react";
import { userDetails } from "./../utils/interface";

// Mock dependencies before imports
vi.mock("./useNotification", () => ({
  default: () => ({
    notifyError: vi.fn()
  })
}));

vi.mock("../useLocalStorage", () => ({
  default: (key: string, initialValue: string) => {
    const [value, setValue] = useState(initialValue);
    return [value, setValue];
  }
}));

vi.mock("../utils/helpers/getcongregationusers", () => ({
  default: vi.fn(() => Promise.resolve(new Map()))
}));

// Import after mocks
const { default: useCongregationManagement } =
  await import("./useCongManagement");
const getCongregationUsers = (
  await import("../utils/helpers/getcongregationusers")
).default;

describe("useCongManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() =>
        useCongregationManagement({ userId: "user-123" })
      );

      expect(result.current.congregationName).toBe("");
      expect(result.current.congregationUsers).toBeInstanceOf(Map);
      expect(result.current.congregationUsers.size).toBe(0);
      expect(result.current.showCongregationListing).toBe(false);
      expect(result.current.showUserListing).toBe(false);
      expect(result.current.isShowingUserListing).toBe(false);
      expect(result.current.userAccessLevel).toBeUndefined();
      expect(result.current.defaultExpiryHours).toBe(24); // DEFAULT_SELF_DESTRUCT_HOURS from constants
      expect(result.current.congregationCode).toBe("");
    });
  });

  describe("congregation name", () => {
    it("should update congregation name", () => {
      const { result } = renderHook(() =>
        useCongregationManagement({ userId: "user-123" })
      );

      act(() => {
        result.current.setCongregationName("Test Congregation");
      });

      expect(result.current.congregationName).toBe("Test Congregation");
    });
  });

  describe("toggleCongregationListing", () => {
    it("should toggle congregation listing visibility", () => {
      const { result } = renderHook(() =>
        useCongregationManagement({ userId: "user-123" })
      );

      expect(result.current.showCongregationListing).toBe(false);

      act(() => {
        result.current.toggleCongregationListing();
      });

      expect(result.current.showCongregationListing).toBe(true);

      act(() => {
        result.current.toggleCongregationListing();
      });

      expect(result.current.showCongregationListing).toBe(false);
    });
  });

  describe("toggleUserListing", () => {
    it("should toggle user listing visibility", () => {
      const { result } = renderHook(() =>
        useCongregationManagement({ userId: "user-123" })
      );

      expect(result.current.showUserListing).toBe(false);

      act(() => {
        result.current.toggleUserListing();
      });

      expect(result.current.showUserListing).toBe(true);

      act(() => {
        result.current.toggleUserListing();
      });

      expect(result.current.showUserListing).toBe(false);
    });
  });

  describe("getUsers", () => {
    it("should fetch and display congregation users", async () => {
      const mockUsers: Map<string, userDetails> = new Map([
        [
          "user1",
          {
            name: "User 1",
            email: "user1@test.com",
            role: "admin",
            verified: true,
            roleId: "role1"
          }
        ],
        [
          "user2",
          {
            name: "User 2",
            email: "user2@test.com",
            role: "conductor",
            verified: true,
            roleId: "role2"
          }
        ]
      ]);
      (getCongregationUsers as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUsers
      );

      const { result } = renderHook(() =>
        useCongregationManagement({ userId: "user-123" })
      );

      act(() => {
        result.current.setCongregationCode("CONG-001");
      });

      await act(async () => {
        await result.current.getUsers();
      });

      await waitFor(() => {
        expect(result.current.congregationUsers).toEqual(mockUsers);
        expect(result.current.showUserListing).toBe(true);
        expect(result.current.isShowingUserListing).toBe(false);
      });
    });

    it("should handle errors when fetching users", async () => {
      (getCongregationUsers as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Fetch failed")
      );

      const { result } = renderHook(() =>
        useCongregationManagement({ userId: "user-123" })
      );

      act(() => {
        result.current.setCongregationCode("CONG-001");
      });

      await act(async () => {
        await result.current.getUsers();
      });

      await waitFor(() => {
        expect(result.current.isShowingUserListing).toBe(false);
      });
    });

    it("should set loading state during fetch", async () => {
      let resolveUsers: (value: Map<string, unknown>) => void;
      const usersPromise = new Promise<Map<string, unknown>>((resolve) => {
        resolveUsers = resolve;
      });
      (getCongregationUsers as ReturnType<typeof vi.fn>).mockReturnValue(
        usersPromise
      );

      const { result } = renderHook(() =>
        useCongregationManagement({ userId: "user-123" })
      );

      act(() => {
        result.current.setCongregationCode("CONG-001");
      });

      act(() => {
        result.current.getUsers();
      });

      await waitFor(() => {
        expect(result.current.isShowingUserListing).toBe(true);
      });

      act(() => {
        resolveUsers(new Map());
      });

      await waitFor(() => {
        expect(result.current.isShowingUserListing).toBe(false);
      });
    });
  });

  describe("handleCongregationSelect", () => {
    it("should update congregation code and clear name", () => {
      const { result } = renderHook(() =>
        useCongregationManagement({ userId: "user-123" })
      );

      act(() => {
        result.current.setCongregationName("Old Name");
        result.current.toggleCongregationListing(); // Open listing
      });

      expect(result.current.showCongregationListing).toBe(true);

      act(() => {
        result.current.handleCongregationSelect("CONG-002");
      });

      expect(result.current.congregationCode).toBe("CONG-002");
      expect(result.current.congregationName).toBe("");
      expect(result.current.showCongregationListing).toBe(false);
    });
  });

  describe("user access level", () => {
    it("should update user access level", () => {
      const { result } = renderHook(() =>
        useCongregationManagement({ userId: "user-123" })
      );

      act(() => {
        result.current.setUserAccessLevel("admin");
      });

      expect(result.current.userAccessLevel).toBe("admin");
    });
  });

  describe("default expiry hours", () => {
    it("should update default expiry hours", () => {
      const { result } = renderHook(() =>
        useCongregationManagement({ userId: "user-123" })
      );

      act(() => {
        result.current.setDefaultExpiryHours(720);
      });

      expect(result.current.defaultExpiryHours).toBe(720);
    });
  });

  describe("congregation users", () => {
    it("should update congregation users map", () => {
      const { result } = renderHook(() =>
        useCongregationManagement({ userId: "user-123" })
      );

      const newUsers: Map<string, userDetails> = new Map([
        [
          "user1",
          {
            name: "User 1",
            email: "user1@test.com",
            role: "admin",
            verified: true,
            roleId: "role1"
          }
        ]
      ]);

      act(() => {
        result.current.setCongregationUsers(newUsers);
      });

      expect(result.current.congregationUsers).toEqual(newUsers);
    });
  });

  describe("user congregation accesses", () => {
    it("should update user congregation accesses", () => {
      const { result } = renderHook(() =>
        useCongregationManagement({ userId: "user-123" })
      );

      const accesses = [
        { code: "CONG-001", access: "admin", name: "Congregation 1" },
        { code: "CONG-002", access: "conductor", name: "Congregation 2" }
      ];

      act(() => {
        result.current.setUserCongregationAccesses(accesses);
      });

      expect(result.current.userCongregationAccesses).toEqual(accesses);
    });
  });
});
