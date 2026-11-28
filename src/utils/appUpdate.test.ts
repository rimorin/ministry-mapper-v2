import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const {
  mockRegisterSW,
  mockCheckVersion,
  mockRecoverFromStaleDeploy,
  mockReloadForNewDeploy
} = vi.hoisted(() => ({
  mockRegisterSW: vi.fn(),
  mockCheckVersion: vi.fn(),
  mockRecoverFromStaleDeploy: vi.fn(),
  mockReloadForNewDeploy: vi.fn()
}));

vi.mock("virtual:pwa-register", () => ({ registerSW: mockRegisterSW }));
vi.mock("./versionCheck", () => ({ checkVersion: mockCheckVersion }));
vi.mock("./reloadForNewDeploy", () => ({
  recoverFromStaleDeploy: mockRecoverFromStaleDeploy,
  reloadForNewDeploy: mockReloadForNewDeploy
}));

const { initAppUpdates, isUpdateReady, applyWaitingUpdate } =
  await import("./appUpdate");

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

describe("initAppUpdates", () => {
  let cleanup: () => void;
  const onUpdatePrompt = vi.fn();
  const update = vi.fn();

  const setServiceWorker = (controlled: boolean) =>
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        controller: controlled ? {} : null,
        ready: Promise.resolve({ update })
      }
    });

  const start = async () => {
    cleanup = initAppUpdates();
    await vi.advanceTimersByTimeAsync(0);
  };

  const restart = async () => {
    cleanup();
    await start();
  };

  const setVisibility = async (state: "visible" | "hidden") => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: state
    });
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
  };

  const showPage = () => setVisibility("visible");

  const resumePage = async () => {
    const event = new Event("pageshow");
    Object.defineProperty(event, "persisted", { value: true });
    window.dispatchEvent(event);
    await vi.advanceTimersByTimeAsync(0);
  };

  const updateTakesOver = () => mockRegisterSW.mock.calls[0][0].onNeedReload();

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockCheckVersion.mockResolvedValue("available");
    mockRecoverFromStaleDeploy.mockReturnValue(true);
    setServiceWorker(true);
    window.addEventListener("mm-sw-update", onUpdatePrompt);
    await start();
  });

  afterEach(() => {
    cleanup();
    window.removeEventListener("mm-sw-update", onUpdatePrompt);
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("registers the service worker immediately", () => {
    expect(mockRegisterSW).toHaveBeenCalledWith(
      expect.objectContaining({ immediate: true })
    );
  });

  it("checks for a new version as soon as it starts", () => {
    expect(mockCheckVersion).toHaveBeenCalledTimes(1);
  });

  it("prompts a reload once the updated service worker has taken over", () => {
    expect(isUpdateReady()).toBe(false);

    updateTakesOver();

    expect(onUpdatePrompt).toHaveBeenCalledTimes(1);
    expect(isUpdateReady()).toBe(true);
  });

  it("installs the new service worker instead of prompting while one is in control", () => {
    expect(update).toHaveBeenCalledTimes(1);
    expect(onUpdatePrompt).not.toHaveBeenCalled();
  });

  it("prompts once when no service worker is in control", async () => {
    setServiceWorker(false);
    vi.clearAllMocks();
    await restart();

    vi.advanceTimersByTime(FIVE_MINUTES);
    await showPage();

    expect(onUpdatePrompt).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
  });

  // A deploy without a version bump still changes sw.js.
  it("still looks for a new service worker when the version is unchanged", async () => {
    mockCheckVersion.mockResolvedValue("current");
    vi.clearAllMocks();
    await restart();

    expect(update).toHaveBeenCalledTimes(1);
    expect(onUpdatePrompt).not.toHaveBeenCalled();
  });

  it("does nothing without a service worker when the version is unchanged", async () => {
    mockCheckVersion.mockResolvedValue("current");
    setServiceWorker(false);
    vi.clearAllMocks();
    await restart();

    expect(update).not.toHaveBeenCalled();
    expect(onUpdatePrompt).not.toHaveBeenCalled();
  });

  it("replaces a build below the minimum version straight away", async () => {
    mockCheckVersion.mockResolvedValue("required");
    vi.clearAllMocks();
    await restart();

    expect(mockRecoverFromStaleDeploy).toHaveBeenCalledExactlyOnceWith({
      dropFirst: true
    });
    expect(update).not.toHaveBeenCalled();
    expect(onUpdatePrompt).not.toHaveBeenCalled();
  });

  it("falls back to the usual update when that replacement cannot run", async () => {
    mockCheckVersion.mockResolvedValue("required");
    mockRecoverFromStaleDeploy.mockReturnValue(false);
    vi.clearAllMocks();
    await restart();

    expect(update).toHaveBeenCalledTimes(1);
  });

  it("skips the check while offline", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    vi.clearAllMocks();
    await restart();

    await showPage();

    expect(mockCheckVersion).not.toHaveBeenCalled();
  });

  it("checks at most once every five minutes on tab focus", async () => {
    await showPage();
    expect(mockCheckVersion).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(FIVE_MINUTES);
    await showPage();
    await showPage();
    expect(mockCheckVersion).toHaveBeenCalledTimes(2);
  });

  it("bypasses the throttle when a suspended page resumes", async () => {
    await resumePage();

    expect(mockCheckVersion).toHaveBeenCalledTimes(2);
  });

  it("checks hourly while the page stays open", async () => {
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

    expect(mockCheckVersion).toHaveBeenCalledTimes(2);
  });

  describe("applyWaitingUpdate", () => {
    it("does nothing while no update is waiting", () => {
      expect(applyWaitingUpdate()).toBe(false);
      expect(mockReloadForNewDeploy).not.toHaveBeenCalled();
    });

    it("loads a waiting update", () => {
      updateTakesOver();

      expect(applyWaitingUpdate()).toBe(true);
      expect(mockReloadForNewDeploy).toHaveBeenCalledTimes(1);
    });

    it("leaves the update waiting while a dialog is open", () => {
      updateTakesOver();
      document.body.innerHTML = '<div role="dialog"></div>';

      expect(applyWaitingUpdate()).toBe(false);
      expect(mockReloadForNewDeploy).not.toHaveBeenCalled();
    });

    // The phone sidebar closes as one of its items switches the view.
    it("loads it while a dialog is only closing", () => {
      updateTakesOver();
      document.body.innerHTML = '<div role="dialog" data-closed></div>';

      expect(applyWaitingUpdate()).toBe(true);
    });
  });

  describe("coming back with an update waiting", () => {
    beforeEach(() => updateTakesOver());

    it("applies it after a long break", async () => {
      await setVisibility("hidden");
      vi.advanceTimersByTime(THIRTY_MINUTES);
      await showPage();

      expect(mockReloadForNewDeploy).toHaveBeenCalledTimes(1);
    });

    it("leaves it to the prompt after a short break", async () => {
      await setVisibility("hidden");
      vi.advanceTimersByTime(FIVE_MINUTES);
      await showPage();

      expect(mockReloadForNewDeploy).not.toHaveBeenCalled();
    });

    it("keeps the page while a dialog is open", async () => {
      document.body.innerHTML = '<div role="dialog"></div>';
      await setVisibility("hidden");
      vi.advanceTimersByTime(THIRTY_MINUTES);
      await showPage();

      expect(mockReloadForNewDeploy).not.toHaveBeenCalled();
    });

    // The update toast itself is a Base UI toast with a dialog role.
    it("still applies it while a toast is showing", async () => {
      document.body.innerHTML = '<div role="dialog" data-slot="toast"></div>';
      await setVisibility("hidden");
      vi.advanceTimersByTime(THIRTY_MINUTES);
      await showPage();

      expect(mockReloadForNewDeploy).toHaveBeenCalledTimes(1);
    });

    it("keeps the page while a text field has focus", async () => {
      document.body.innerHTML = "<textarea></textarea>";
      document.querySelector("textarea")?.focus();
      await setVisibility("hidden");
      vi.advanceTimersByTime(THIRTY_MINUTES);
      await showPage();

      expect(mockReloadForNewDeploy).not.toHaveBeenCalled();
    });

    it("still applies it when the focus is on a checkbox, not a text field", async () => {
      document.body.innerHTML = '<input type="checkbox" />';
      document.querySelector("input")?.focus();
      await setVisibility("hidden");
      vi.advanceTimersByTime(THIRTY_MINUTES);
      await showPage();

      expect(mockReloadForNewDeploy).toHaveBeenCalledTimes(1);
    });

    it("keeps the page while offline", async () => {
      await setVisibility("hidden");
      vi.advanceTimersByTime(THIRTY_MINUTES);
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
      await showPage();

      expect(mockReloadForNewDeploy).not.toHaveBeenCalled();
    });
  });

  it("does not reload after a long break when no update is waiting", async () => {
    await setVisibility("hidden");
    vi.advanceTimersByTime(THIRTY_MINUTES);
    await showPage();

    expect(mockReloadForNewDeploy).not.toHaveBeenCalled();
  });
});
