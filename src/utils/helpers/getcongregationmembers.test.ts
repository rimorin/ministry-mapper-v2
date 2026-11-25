import { beforeEach, describe, expect, it, vi } from "vitest";

const pb = vi.hoisted(() => ({ getList: vi.fn() }));

vi.mock("../pocketbase", () => pb);

const role = (
  user: string,
  name: string,
  account: Record<string, unknown> = {}
) => ({
  id: `role-${user}`,
  user,
  role: "publisher",
  expand: {
    user: {
      name,
      email: `${user}@example.test`,
      verified: true,
      disabled: false,
      ...account
    }
  }
});

describe("getCongregationMembers", () => {
  beforeEach(() => {
    pb.getList.mockReset();
  });

  const load = async (roles: unknown[], links: unknown[] = []) => {
    pb.getList.mockImplementation((collection: string) =>
      Promise.resolve(collection === "roles" ? roles : links)
    );
    const { default: getCongregationMembers } =
      await import("./getcongregationmembers");
    return getCongregationMembers("cong1");
  };

  it("leaves out accounts that cannot sign in", async () => {
    const members = await load([
      role("ann", "Ann"),
      role("bob", "Bob", { disabled: true }),
      role("cat", "Cat", { verified: false })
    ]);

    expect(members.map((member) => member.name)).toEqual(["Ann"]);
  });

  it("says which maps each member holds", async () => {
    const members = await load(
      [role("ann", "Ann"), role("dan", "Dan")],
      [
        {
          id: "link1",
          map: "map1",
          assignees: ["ann"],
          expand: { map: { description: "Blk 301" } }
        }
      ]
    );

    expect(members).toEqual([
      expect.objectContaining({
        name: "Ann",
        role: "publisher",
        maps: [{ link: "link1", map: "map1", name: "Blk 301" }]
      }),
      expect.objectContaining({ name: "Dan", maps: [] })
    ]);
  });

  it("still lists the roster when the links cannot be read", async () => {
    pb.getList.mockImplementation((collection: string) =>
      collection === "roles"
        ? Promise.resolve([role("ann", "Ann")])
        : Promise.reject(new Error("no"))
    );
    const { default: getCongregationMembers } =
      await import("./getcongregationmembers");

    expect(await getCongregationMembers("cong1")).toEqual([
      expect.objectContaining({ name: "Ann", maps: [] })
    ]);
  });
});
