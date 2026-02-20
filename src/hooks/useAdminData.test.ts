/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// Mock dependencies
vi.mock("./useNotification", () => ({
  default: () => ({
    notifyError: vi.fn(),
    notifyWarning: vi.fn()
  })
}));

vi.mock("../utils/pocketbase", () => ({
  getList: vi.fn(() => Promise.resolve([])),
  getDataById: vi.fn(() => Promise.resolve(null)),
  getUser: vi.fn(() => "Test User")
}));

const mockProcessCongregationTerritories = vi.fn(() => new Map());
const mockSetUserCongregationAccesses = vi.fn();
const mockSetCongregationCode = vi.fn();
const mockSetCongregationCodeCache = vi.fn();
const mockSetCongregationName = vi.fn();
const mockSetDefaultExpiryHours = vi.fn();
const mockSetPolicy = vi.fn();
const mockSetTerritories = vi.fn();
const mockSetSelectedTerritory = vi.fn();
const mockSetTerritoryCodeCache = vi.fn();
const mockSetUserAccessLevel = vi.fn();
const mockSetIsUnauthorised = vi.fn();
const mockNotifyError = vi.fn();
const mockNotifyWarning = vi.fn();
const mockT = vi.fn((key: string, defaultValue: string) => defaultValue) as any;

// Import after mocks
const { default: useAdminData } = await import("./useAdminData");
const { getList, getDataById } = await import("../utils/pocketbase");

describe("useAdminData", () => {
  const defaultProps = {
    userId: "user-123",
    congregationCodeCache: "",
    congregationAccessRef: { current: {} } as React.RefObject<
      Record<string, string>
    >,
    setUserCongregationAccesses: mockSetUserCongregationAccesses,
    setCongregationCode: mockSetCongregationCode,
    setCongregationCodeCache: mockSetCongregationCodeCache,
    setCongregationName: mockSetCongregationName,
    setDefaultExpiryHours: mockSetDefaultExpiryHours,
    setPolicy: mockSetPolicy,
    setTerritories: mockSetTerritories,
    setSelectedTerritory: mockSetSelectedTerritory,
    setTerritoryCodeCache: mockSetTerritoryCodeCache,
    setUserAccessLevel: mockSetUserAccessLevel,
    setIsUnauthorised: mockSetIsUnauthorised,
    notifyError: mockNotifyError,
    notifyWarning: mockNotifyWarning,
    processCongregationTerritories: mockProcessCongregationTerritories,
    territoryCodeCache: "",
    userEmail: "test@example.com",
    t: mockT
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default loading state", () => {
      const { result } = renderHook(() => useAdminData(defaultProps));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasAnyMaps).toBe(false);
    });

    it("should expose all required methods", () => {
      const { result } = renderHook(() => useAdminData(defaultProps));

      expect(typeof result.current.fetchData).toBe("function");
      expect(typeof result.current.fetchCongregationData).toBe("function");
      expect(typeof result.current.loadAllCongregationData).toBe("function");
      expect(typeof result.current.checkForMaps).toBe("function");
      expect(typeof result.current.setIsLoading).toBe("function");
    });
  });

  describe("fetchData", () => {
    it("should fetch user roles and set congregation accesses", async () => {
      const mockRoles = [
        {
          id: "role-1",
          collectionId: "roles",
          collectionName: "roles",
          role: "ADMIN",
          expand: {
            congregation: {
              id: "cong-1",
              name: "Test Congregation"
            }
          }
        }
      ] as any;

      vi.mocked(getList).mockResolvedValueOnce(mockRoles);

      const { result } = renderHook(() => useAdminData(defaultProps));

      await result.current.fetchData();

      await waitFor(() => {
        expect(mockSetUserCongregationAccesses).toHaveBeenCalledWith([
          {
            code: "cong-1",
            access: "ADMIN",
            name: "Test Congregation"
          }
        ]);
      });
    });

    it("should set unauthorised when no roles found", async () => {
      vi.mocked(getList).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAdminData(defaultProps));

      await result.current.fetchData();

      await waitFor(() => {
        expect(mockSetIsUnauthorised).toHaveBeenCalledWith(true);
        expect(mockNotifyError).toHaveBeenCalledWith(
          expect.stringContaining("Unauthorised"),
          true
        );
      });
    });

    it("should use cached congregation code if valid", async () => {
      const mockRoles = [
        {
          id: "role-1",
          collectionId: "roles",
          collectionName: "roles",
          role: "ADMIN",
          expand: {
            congregation: {
              id: "cong-cached",
              name: "Cached Congregation"
            }
          }
        }
      ] as any;

      vi.mocked(getList).mockResolvedValueOnce(mockRoles);

      const propsWithCache = {
        ...defaultProps,
        congregationCodeCache: "cong-cached"
      };

      const { result } = renderHook(() => useAdminData(propsWithCache));

      await result.current.fetchData();

      await waitFor(() => {
        expect(mockSetCongregationCode).toHaveBeenCalledWith("cong-cached");
      });
    });
  });

  describe("fetchCongregationData", () => {
    it("should fetch congregation details and territories", async () => {
      const mockCongregation = {
        id: "cong-1",
        collectionId: "congregations",
        collectionName: "congregations",
        name: "Test Congregation",
        expiry_hours: 48,
        max_tries: 3,
        origin: { lat: 0, lng: 0 }
      } as any;

      const mockOptions = [
        {
          id: "opt-1",
          collectionId: "options",
          collectionName: "options",
          code: "NH",
          description: "Not Home",
          is_countable: true,
          is_default: false,
          sequence: 1
        }
      ] as any;

      const mockTerritories = [
        {
          id: "terr-1",
          collectionId: "territories",
          collectionName: "territories",
          code: "T1",
          description: "Territory 1",
          progress: { display: "50%", value: 50 }
        }
      ] as any;

      vi.mocked(getDataById).mockResolvedValueOnce(mockCongregation);
      vi.mocked(getList)
        .mockResolvedValueOnce(mockOptions)
        .mockResolvedValueOnce(mockTerritories);

      const territoryMap = new Map([
        [
          "terr-1",
          {
            id: "terr-1",
            code: "T1",
            name: "Territory 1",
            aggregates: {} as any
          }
        ]
      ]);
      mockProcessCongregationTerritories.mockReturnValueOnce(territoryMap);

      const { result } = renderHook(() => useAdminData(defaultProps));

      const territories = await result.current.fetchCongregationData("cong-1");

      await waitFor(() => {
        expect(mockSetCongregationName).toHaveBeenCalledWith(
          "Test Congregation"
        );
        expect(mockSetDefaultExpiryHours).toHaveBeenCalledWith(48);
        expect(mockSetPolicy).toHaveBeenCalled();
        expect(mockSetTerritories).toHaveBeenCalledWith(territoryMap);
        expect(territories).toBe(territoryMap);
      });
    });

    it("should notify when congregation not found", async () => {
      vi.mocked(getDataById).mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAdminData(defaultProps));

      await result.current.fetchCongregationData("invalid-cong");

      await waitFor(() => {
        expect(mockNotifyWarning).toHaveBeenCalledWith(
          expect.stringContaining("not found")
        );
      });
    });
  });

  describe("checkForMaps", () => {
    it("should set hasAnyMaps to false when no territories", async () => {
      const { result } = renderHook(() => useAdminData(defaultProps));

      await result.current.checkForMaps(new Map());

      await waitFor(() => {
        expect(result.current.hasAnyMaps).toBe(false);
      });
    });

    it("should check for maps across territories", async () => {
      const territoryMap = new Map([
        [
          "terr-1",
          {
            id: "terr-1",
            code: "T1",
            name: "Territory 1",
            aggregates: {} as any
          }
        ],
        [
          "terr-2",
          {
            id: "terr-2",
            code: "T2",
            name: "Territory 2",
            aggregates: {} as any
          }
        ]
      ]);

      vi.mocked(getList).mockResolvedValueOnce([{ id: "map-1" }] as any);

      const { result } = renderHook(() => useAdminData(defaultProps));

      await result.current.checkForMaps(territoryMap);

      await waitFor(() => {
        expect(result.current.hasAnyMaps).toBe(true);
        expect(getList).toHaveBeenCalledWith(
          "maps",
          expect.objectContaining({
            filter: expect.stringContaining("terr-1"),
            fields: "id"
          })
        );
      });
    });

    it("should handle errors gracefully", async () => {
      const territoryMap = new Map([
        [
          "terr-1",
          {
            id: "terr-1",
            code: "T1",
            name: "Territory 1",
            aggregates: {} as any
          }
        ]
      ]);

      vi.mocked(getList).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useAdminData(defaultProps));

      await result.current.checkForMaps(territoryMap);

      await waitFor(() => {
        expect(result.current.hasAnyMaps).toBe(false);
      });
    });
  });

  describe("loadAllCongregationData", () => {
    it("should load congregation data and check for maps", async () => {
      const mockCongregation = {
        id: "cong-1",
        collectionId: "congregations",
        collectionName: "congregations",
        name: "Test Congregation",
        expiry_hours: 24,
        max_tries: 3,
        origin: { lat: 0, lng: 0 }
      } as any;

      const territoryMap = new Map([
        [
          "terr-1",
          {
            id: "terr-1",
            code: "T1",
            name: "Territory 1",
            aggregates: {} as any
          }
        ]
      ]);

      vi.mocked(getDataById).mockResolvedValueOnce(mockCongregation);
      vi.mocked(getList)
        .mockResolvedValueOnce([]) // options
        .mockResolvedValueOnce([]) // territories
        .mockResolvedValueOnce([]); // maps

      mockProcessCongregationTerritories.mockReturnValueOnce(territoryMap);

      const propsWithAccess = {
        ...defaultProps,
        congregationAccessRef: {
          current: { "cong-1": "ADMIN" }
        } as React.RefObject<Record<string, string>>
      };

      const { result } = renderHook(() => useAdminData(propsWithAccess));

      await result.current.loadAllCongregationData("cong-1");

      await waitFor(() => {
        expect(mockSetUserAccessLevel).toHaveBeenCalledWith("ADMIN");
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should set loading state correctly during process", async () => {
      const mockCongregation = {
        id: "cong-1",
        collectionId: "congregations",
        collectionName: "congregations",
        name: "Test",
        expiry_hours: 24,
        max_tries: 3,
        origin: { lat: 0, lng: 0 }
      } as any;

      vi.mocked(getDataById).mockResolvedValueOnce(mockCongregation);
      vi.mocked(getList).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAdminData(defaultProps));

      const loadPromise = result.current.loadAllCongregationData("cong-1");

      // Loading should be true during execution
      expect(result.current.isLoading).toBe(true);

      await loadPromise;

      // Loading should be false after completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("setIsLoading", () => {
    it("should update loading state", () => {
      const { result } = renderHook(() => useAdminData(defaultProps));

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
