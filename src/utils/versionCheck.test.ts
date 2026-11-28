import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkVersion } from "./versionCheck";

describe("checkVersion", () => {
  const serve = (body: object, ok = true) =>
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) })
    );

  beforeEach(() => {
    vi.stubEnv("VITE_APP_VERSION", "1.2.0");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is current when the served version matches the running build", async () => {
    serve({ version: "1.2.0" });

    expect(await checkVersion()).toBe("current");
  });

  it("offers a newer served version", async () => {
    serve({ version: "1.3.0" });

    expect(await checkVersion()).toBe("available");
  });

  it("requires the update when the running build is below the minimum", async () => {
    serve({ version: "1.10.0", minVersion: "1.9.1" });

    expect(await checkVersion()).toBe("required");
  });

  it("only offers the update when the running build meets the minimum", async () => {
    serve({ version: "1.3.0", minVersion: "1.2.0" });

    expect(await checkVersion()).toBe("available");
  });

  it("ignores a minimum above the served version", async () => {
    serve({ version: "1.3.0", minVersion: "2.0.0" });

    expect(await checkVersion()).toBe("available");
  });

  it("is current on a non-ok response", async () => {
    serve({ version: "1.3.0" }, false);

    expect(await checkVersion()).toBe("current");
  });

  it("is current when the fetch rejects (e.g. offline)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(await checkVersion()).toBe("current");
  });
});
