import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const captureMessage = vi.hoisted(() => vi.fn());
vi.mock("@sentry/react", () => ({ captureMessage }));

import {
  isReloadingForNewDeploy,
  recoverFromStaleDeploy
} from "./reloadForNewDeploy";

const MINUTE = 60 * 1000;

describe("recoverFromStaleDeploy", () => {
  const reload = vi.fn();
  const unregister = vi.fn().mockResolvedValue(true);
  const deleteCache = vi.fn().mockResolvedValue(true);
  const realLocation = window.location;
  let online = true;

  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    online = true;
    // jsdom's location cannot reload; swap in a stub that records it.
    Object.defineProperty(window, "location", {
      value: { reload },
      writable: true
    });
    vi.spyOn(navigator, "onLine", "get").mockImplementation(() => online);
    Object.defineProperty(navigator, "serviceWorker", {
      value: { getRegistrations: () => Promise.resolve([{ unregister }]) },
      configurable: true
    });
    vi.stubGlobal("caches", {
      keys: () => Promise.resolve(["workbox-precache", "translations"]),
      delete: deleteCache
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: realLocation,
      writable: true
    });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reloads the first time, leaving the cached app alone", () => {
    expect(recoverFromStaleDeploy(0)).toBe(true);

    expect(reload).toHaveBeenCalledOnce();
    expect(isReloadingForNewDeploy()).toBe(true);
    expect(unregister).not.toHaveBeenCalled();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("drops the cached app before the second reload, and says so", async () => {
    recoverFromStaleDeploy(0);

    expect(recoverFromStaleDeploy(5_000)).toBe(true);

    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(2));
    expect(unregister).toHaveBeenCalledOnce();
    expect(deleteCache).toHaveBeenCalledWith("workbox-precache");
    expect(deleteCache).toHaveBeenCalledWith("translations");
    expect(captureMessage).toHaveBeenCalledOnce();
  });

  // The loop: the marker used to be cleared when the page started, so every
  // reload looked like the first. sessionStorage survives a reload, and
  // nothing clears it now.
  it("stops after the second attempt instead of reloading forever", async () => {
    recoverFromStaleDeploy(0);
    recoverFromStaleDeploy(5_000);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(2));

    expect(recoverFromStaleDeploy(10_000)).toBe(false);
    expect(recoverFromStaleDeploy(15_000)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("gives a later failure, such as the next deployment, fresh attempts", async () => {
    recoverFromStaleDeploy(0);
    recoverFromStaleDeploy(5_000);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(2));

    // A plain reload again, not another drop of the cache.
    expect(recoverFromStaleDeploy(2 * MINUTE)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(3);
    expect(unregister).toHaveBeenCalledOnce();
  });

  it("does nothing offline, where the cache is the only copy of the app", () => {
    online = false;

    expect(recoverFromStaleDeploy(0)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);
  });

  it("makes no attempt when the attempts cannot be counted", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });

    expect(recoverFromStaleDeploy(0)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("still reloads when the cached app cannot be dropped", async () => {
    unregister.mockRejectedValueOnce(new Error("refused"));
    recoverFromStaleDeploy(0);

    recoverFromStaleDeploy(5_000);

    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(2));
  });
});
