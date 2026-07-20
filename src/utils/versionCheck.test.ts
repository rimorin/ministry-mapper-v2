import { describe, it, expect, vi, afterEach } from "vitest";
import { checkForNewVersion } from "./versionCheck";

describe("checkForNewVersion", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns true when the served version differs from the running build", async () => {
    vi.stubEnv("VITE_APP_VERSION", "1.0.0");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: "1.1.0" })
      })
    );

    expect(await checkForNewVersion()).toBe(true);
  });

  it("returns false when the served version matches the running build", async () => {
    vi.stubEnv("VITE_APP_VERSION", "1.0.0");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: "1.0.0" })
      })
    );

    expect(await checkForNewVersion()).toBe(false);
  });

  it("returns false on a non-ok response", async () => {
    vi.stubEnv("VITE_APP_VERSION", "1.0.0");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ version: "1.1.0" })
      })
    );

    expect(await checkForNewVersion()).toBe(false);
  });

  it("returns false when the fetch rejects (e.g. offline)", async () => {
    vi.stubEnv("VITE_APP_VERSION", "1.0.0");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(await checkForNewVersion()).toBe(false);
  });
});
