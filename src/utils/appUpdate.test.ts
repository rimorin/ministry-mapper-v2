import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockRegisterSW, mockCheckForNewVersion } = vi.hoisted(() => ({
  mockRegisterSW: vi.fn(),
  mockCheckForNewVersion: vi.fn()
}));

vi.mock("virtual:pwa-register", () => ({ registerSW: mockRegisterSW }));
vi.mock("./versionCheck", () => ({
  checkForNewVersion: mockCheckForNewVersion
}));

const { initAppUpdates } = await import("./appUpdate");

const FIVE_MINUTES = 5 * 60 * 1000;

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

  const showPage = async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible"
    });
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
  };

  const resumePage = async () => {
    const event = new Event("pageshow");
    Object.defineProperty(event, "persisted", { value: true });
    window.dispatchEvent(event);
    await vi.advanceTimersByTimeAsync(0);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockCheckForNewVersion.mockResolvedValue(true);
    setServiceWorker(true);
    window.addEventListener("mm-sw-update", onUpdatePrompt);
    cleanup = initAppUpdates();
  });

  afterEach(() => {
    cleanup();
    window.removeEventListener("mm-sw-update", onUpdatePrompt);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("registers the service worker immediately", () => {
    expect(mockRegisterSW).toHaveBeenCalledWith(
      expect.objectContaining({ immediate: true })
    );
  });

  it("prompts a reload once the updated service worker has taken over", () => {
    const { onNeedReload } = mockRegisterSW.mock.calls[0][0];

    onNeedReload();

    expect(onUpdatePrompt).toHaveBeenCalledTimes(1);
  });

  it("installs the new service worker instead of prompting while one is in control", async () => {
    await showPage();

    expect(update).toHaveBeenCalledTimes(1);
    expect(onUpdatePrompt).not.toHaveBeenCalled();
  });

  it("prompts straight away when no service worker is in control", async () => {
    cleanup();
    setServiceWorker(false);
    cleanup = initAppUpdates();

    await showPage();
    vi.advanceTimersByTime(FIVE_MINUTES);
    await showPage();

    expect(onUpdatePrompt).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
  });

  it("does nothing when the running build is current", async () => {
    mockCheckForNewVersion.mockResolvedValue(false);

    await showPage();

    expect(update).not.toHaveBeenCalled();
    expect(onUpdatePrompt).not.toHaveBeenCalled();
  });

  it("skips the check while offline", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

    await showPage();

    expect(mockCheckForNewVersion).not.toHaveBeenCalled();
  });

  it("checks at most once every five minutes on tab focus", async () => {
    await showPage();
    await showPage();
    expect(mockCheckForNewVersion).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(FIVE_MINUTES);
    await showPage();
    expect(mockCheckForNewVersion).toHaveBeenCalledTimes(2);
  });

  it("bypasses the throttle when a suspended page resumes", async () => {
    await showPage();
    await resumePage();

    expect(mockCheckForNewVersion).toHaveBeenCalledTimes(2);
  });

  it("checks hourly while the page stays open", async () => {
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

    expect(mockCheckForNewVersion).toHaveBeenCalledTimes(1);
  });
});
