import { vi } from "vitest";
import type { RecordModel } from "pocketbase";

export const createMockAuthModel = (overrides: Partial<RecordModel> = {}) => ({
  id: "test-user-id",
  collectionId: "users",
  collectionName: "users",
  created: "2024-01-01T00:00:00.000Z",
  updated: "2024-01-01T00:00:00.000Z",
  email: "test@example.com",
  emailVisibility: true,
  verified: true,
  ...overrides
});

export const createMockRecord = (
  overrides: Partial<RecordModel> = {}
): RecordModel => ({
  id: "test-record-id",
  created: "2024-01-01T00:00:00.000Z",
  updated: "2024-01-01T00:00:00.000Z",
  collectionId: "test-collection",
  collectionName: "test",
  ...overrides
});

export const mockPocketBase = {
  authStore: {
    model: createMockAuthModel(),
    token: "mock-token",
    isValid: true,
    onChange: vi.fn(),
    clear: vi.fn(),
    save: vi.fn()
  },
  collection: vi.fn(() => ({
    getList: vi.fn().mockResolvedValue({
      page: 1,
      perPage: 30,
      totalItems: 0,
      totalPages: 0,
      items: []
    }),
    getOne: vi.fn().mockResolvedValue(createMockRecord()),
    getFullList: vi.fn().mockResolvedValue([]),
    getFirstListItem: vi.fn().mockResolvedValue(createMockRecord()),
    create: vi.fn().mockResolvedValue(createMockRecord()),
    update: vi.fn().mockResolvedValue(createMockRecord()),
    delete: vi.fn().mockResolvedValue(true),
    subscribe: vi.fn().mockResolvedValue(() => {})
  })),
  realtime: {
    subscribe: vi.fn().mockResolvedValue(() => {}),
    unsubscribe: vi.fn()
  },
  send: vi.fn()
};

export const resetMockPocketBase = () => {
  vi.clearAllMocks();
  mockPocketBase.authStore.model = createMockAuthModel();
  mockPocketBase.authStore.isValid = true;
};

export default mockPocketBase;
