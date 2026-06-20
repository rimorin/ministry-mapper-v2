import { describe, it, expect } from "vitest";
import { buildLaunchDarklyContext } from "./launchdarkly";

const user = { id: "u1", name: "Sandy", email: "sandy@example.com" };

describe("buildLaunchDarklyContext", () => {
  it("builds a multi-context with deduped roles and the highest access level", () => {
    const context = buildLaunchDarklyContext(
      user,
      [
        { code: "c1", access: "administrator", name: "Alpha" },
        { code: "c2", access: "publisher", name: "Beta" },
        { code: "c3", access: "publisher", name: "Gamma" }
      ],
      "c1"
    ) as Record<string, Record<string, unknown>>;

    expect(context.kind).toBe("multi");
    expect(context.user).toMatchObject({
      key: "u1",
      name: "Sandy",
      email: "sandy@example.com",
      maxAccessLevel: 3
    });
    expect(context.user.roles).toEqual(["administrator", "publisher"]);
  });

  it("attaches the active congregation as its own context kind", () => {
    const context = buildLaunchDarklyContext(
      user,
      [
        { code: "c1", access: "administrator", name: "Alpha" },
        { code: "c2", access: "publisher", name: "Beta" }
      ],
      "c2"
    ) as Record<string, Record<string, unknown>>;

    expect(context.congregation).toEqual({
      key: "c2",
      name: "Beta",
      activeRole: "publisher"
    });
  });

  it("omits the congregation context when the active code is unknown", () => {
    const context = buildLaunchDarklyContext(
      user,
      [{ code: "c1", access: "administrator", name: "Alpha" }],
      ""
    ) as Record<string, unknown>;

    expect(context.congregation).toBeUndefined();
  });
});
