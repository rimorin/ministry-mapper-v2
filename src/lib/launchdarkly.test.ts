import { describe, it, expect } from "vitest";
import { buildLaunchDarklyContext } from "./launchdarkly";

const user = { id: "u1", name: "Sandy", email: "sandy@example.com" };

type Multi = Record<string, Record<string, unknown>>;

describe("buildLaunchDarklyContext", () => {
  it("lists every role and congregation, and the account's groups", () => {
    const context = buildLaunchDarklyContext(
      user,
      [
        { code: "c1", access: "administrator", name: "Alpha" },
        { code: "c2", access: "publisher", name: "Beta" },
        { code: "c3", access: "publisher", name: "Gamma" }
      ],
      "c1",
      ["Group 2"]
    ) as Multi;

    expect(context.kind).toBe("multi");
    expect(context.user).toEqual({
      key: "u1",
      name: "Sandy",
      email: "sandy@example.com",
      roles: ["administrator", "publisher"],
      maxAccessLevel: 3,
      congregations: ["c1", "c2", "c3"],
      groups: ["Group 2"]
    });
  });

  it("ranks access by staff roles only, so publishers sit below conductors", () => {
    const context = buildLaunchDarklyContext(
      user,
      [{ code: "c1", access: "publisher", name: "Alpha" }],
      ""
    ) as Multi;

    expect(context.user.maxAccessLevel).toBe(0);
    expect(context.user.roles).toEqual(["publisher"]);
    expect(context.user.groups).toEqual([]);
  });

  it("attaches the congregation open in the staff shell", () => {
    const context = buildLaunchDarklyContext(
      user,
      [
        { code: "c1", access: "administrator", name: "Alpha" },
        { code: "c2", access: "conductor", name: "Beta" }
      ],
      "c2"
    ) as Multi;

    expect(context.congregation).toEqual({
      key: "c2",
      name: "Beta",
      activeRole: "conductor"
    });
  });

  it("attaches no congregation where the account is only a publisher", () => {
    const context = buildLaunchDarklyContext(
      user,
      [{ code: "c1", access: "publisher", name: "Alpha" }],
      "c1"
    ) as Multi;

    expect(context.congregation).toBeUndefined();
  });
});
