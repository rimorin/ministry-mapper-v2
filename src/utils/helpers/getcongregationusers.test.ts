import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RecordModel } from "pocketbase";

vi.mock("../pocketbase", () => ({
  getList: vi.fn()
}));

const { default: getCongregationUsers } =
  await import("./getcongregationusers");
const { getList } = await import("../pocketbase");

describe("getCongregationUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a map of users from expanded records", async () => {
    vi.mocked(getList).mockResolvedValueOnce([
      {
        id: "role-1",
        role: "conductor",
        expand: { user: { name: "Alice", verified: true, email: "a@test.com" } }
      }
    ] as unknown as RecordModel[]);

    const result = await getCongregationUsers("cong-1", "other-user");
    expect(result.size).toBe(1);
    const entry = result.get("role-1");
    expect(entry?.name).toBe("Alice");
    expect(entry?.email).toBe("a@test.com");
    expect(entry?.role).toBe("conductor");
  });

  it("skips records where expand.user is undefined", async () => {
    vi.mocked(getList).mockResolvedValueOnce([
      { id: "role-1", role: "conductor", expand: {} },
      {
        id: "role-2",
        role: "publisher",
        expand: { user: { name: "Bob", verified: false, email: "b@test.com" } }
      }
    ] as unknown as RecordModel[]);

    const result = await getCongregationUsers("cong-1", "other-user");
    expect(result.size).toBe(1);
    expect(result.has("role-1")).toBe(false);
    expect(result.get("role-2")?.name).toBe("Bob");
  });

  it("returns an empty map when all records have no expand.user", async () => {
    vi.mocked(getList).mockResolvedValueOnce([
      { id: "role-1", role: "conductor", expand: {} }
    ] as unknown as RecordModel[]);

    const result = await getCongregationUsers("cong-1", "other-user");
    expect(result.size).toBe(0);
  });

  it("returns an empty map when getList returns no records", async () => {
    vi.mocked(getList).mockResolvedValueOnce([] as RecordModel[]);

    const result = await getCongregationUsers("cong-1", "other-user");
    expect(result.size).toBe(0);
  });
});
