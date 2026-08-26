import { describe, it, expect, vi, afterEach } from "vitest";
import { ANALYTICS_EVENTS, trackEvent, trackRoute } from "./analytics";

type Umami = NonNullable<Window["umami"]>;

// vi.fn cannot model track()'s overloads, so the mock is cast in.
const mockTrack = vi.fn();
const mockIdentify = vi.fn();

const withUmami = () => {
  window.umami = {
    track: mockTrack,
    identify: mockIdentify
  } as unknown as Umami;
};

afterEach(() => {
  vi.clearAllMocks();
  delete window.umami;
});

describe("trackEvent", () => {
  it("forwards the event and its data to umami", () => {
    withUmami();

    trackEvent(ANALYTICS_EVENTS.LOGIN_OAUTH, { provider: "google" });

    expect(mockTrack).toHaveBeenCalledWith(ANALYTICS_EVENTS.LOGIN_OAUTH, {
      provider: "google"
    });
  });

  it("is a no-op when umami has not loaded", () => {
    expect(() => trackEvent(ANALYTICS_EVENTS.LOGIN)).not.toThrow();
    expect(mockTrack).not.toHaveBeenCalled();
  });
});

describe("trackRoute", () => {
  it("fires the mapped event for a tracked route", () => {
    withUmami();

    trackRoute("/map/reset", { map_id: "abc" });

    expect(mockTrack).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.MAP_RESET,
      undefined
    );
  });

  it("attaches the status for an address update", () => {
    withUmami();

    trackRoute("/address/update", { address_id: "a1", status: "not_home" });

    expect(mockTrack).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ADDRESS_STATUS_UPDATED,
      { status: "not_home" }
    );
  });

  it("omits event data when the status is absent", () => {
    withUmami();

    trackRoute("/address/update", { address_id: "a1" });

    expect(mockTrack).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ADDRESS_STATUS_UPDATED,
      undefined
    );
  });

  it("tolerates a missing body on a route with an extractor", () => {
    withUmami();

    expect(() => trackRoute("/address/update", undefined)).not.toThrow();
    expect(mockTrack).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ADDRESS_STATUS_UPDATED,
      undefined
    );
  });

  it("fires for a route path written without a leading slash", () => {
    withUmami();

    trackRoute("options/update", { congregation: "ABC" });

    expect(mockTrack).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.CONGREGATION_OPTIONS_UPDATED,
      undefined
    );
  });

  it("ignores read-only routes", () => {
    withUmami();

    trackRoute("/map/addresses", { map_id: "abc" });
    trackRoute("/map/codes", { map_id: "abc" });

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("ignores routes already tracked at their call site", () => {
    withUmami();

    trackRoute("/territory/link", {});
    trackRoute("/report/generate", {});

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("ignores unknown routes", () => {
    withUmami();

    trackRoute("/not/a/route", {});

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("is a no-op when umami has not loaded", () => {
    expect(() => trackRoute("/map/add", {})).not.toThrow();
    expect(mockTrack).not.toHaveBeenCalled();
  });
});

describe("initAnalytics", () => {
  const SRC = "https://analytics.example.com/script.js";
  const SITE_ID = "site-123";

  const loadModule = async () => {
    vi.resetModules();
    vi.stubEnv("VITE_UMAMI_SRC_URL", SRC);
    vi.stubEnv("VITE_UMAMI_WEBSITE_ID", SITE_ID);
    return import("./analytics");
  };

  const injectedScript = () =>
    document.querySelector<HTMLScriptElement>(
      `script[data-website-id="${SITE_ID}"]`
    );

  afterEach(() => {
    vi.unstubAllEnvs();
    injectedScript()?.remove();
  });

  it("opts out of query strings and auto pageviews", async () => {
    const { initAnalytics } = await loadModule();

    initAnalytics();

    const script = injectedScript();
    expect(script?.dataset.excludeSearch).toBe("true");
    expect(script?.dataset.autoPageview).toBe("false");
    expect(script?.dataset.performance).toBe("true");
  });

  it("tags the script with the release version", async () => {
    vi.stubEnv("VITE_APP_VERSION", "2.7.2");
    const { initAnalytics } = await loadModule();

    initAnalytics();

    expect(injectedScript()?.dataset.tag).toBe("2.7.2");
  });

  it("omits the tag when no version is set", async () => {
    vi.stubEnv("VITE_APP_VERSION", "");
    const { initAnalytics } = await loadModule();

    initAnalytics();

    expect(injectedScript()?.dataset.tag).toBeUndefined();
  });

  it("replays events queued before the script loads", async () => {
    const { initAnalytics, trackEvent } = await loadModule();
    initAnalytics();

    trackEvent(ANALYTICS_EVENTS.LOGIN_OAUTH, { provider: "google" });
    expect(mockTrack).not.toHaveBeenCalled();

    withUmami();
    injectedScript()?.dispatchEvent(new Event("load"));

    expect(mockTrack).toHaveBeenCalledWith(ANALYTICS_EVENTS.LOGIN_OAUTH, {
      provider: "google"
    });
  });

  it("replays in order and only once", async () => {
    const { initAnalytics, trackEvent } = await loadModule();
    initAnalytics();

    trackEvent(ANALYTICS_EVENTS.LOGIN);
    trackEvent(ANALYTICS_EVENTS.SIGNUP);

    withUmami();
    injectedScript()?.dispatchEvent(new Event("load"));
    injectedScript()?.dispatchEvent(new Event("load"));

    expect(mockTrack.mock.calls.map((call) => call[0])).toEqual([
      ANALYTICS_EVENTS.LOGIN,
      ANALYTICS_EVENTS.SIGNUP
    ]);
  });

  it("discards the queue when the script fails to load", async () => {
    const { initAnalytics, trackEvent } = await loadModule();
    initAnalytics();

    trackEvent(ANALYTICS_EVENTS.LOGIN);
    injectedScript()?.dispatchEvent(new Event("error"));

    withUmami();
    trackEvent(ANALYTICS_EVENTS.SIGNUP);

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith(ANALYTICS_EVENTS.SIGNUP, undefined);
  });

  it("bounds the queue so an unloaded script cannot grow it forever", async () => {
    const { initAnalytics, trackEvent } = await loadModule();
    initAnalytics();

    for (let i = 0; i < 50; i++) trackEvent(ANALYTICS_EVENTS.LOGIN);

    withUmami();
    injectedScript()?.dispatchEvent(new Event("load"));

    expect(mockTrack).toHaveBeenCalledTimes(20);
  });

  it("drops calls when analytics was never configured", async () => {
    vi.resetModules();
    const { trackEvent } = await import("./analytics");

    trackEvent(ANALYTICS_EVENTS.LOGIN);

    withUmami();
    trackEvent(ANALYTICS_EVENTS.SIGNUP);

    expect(mockTrack).toHaveBeenCalledTimes(1);
  });
});

describe("identify", () => {
  it("sends congregation and role, and no personal data", async () => {
    withUmami();
    const { identify } = await import("./analytics");

    identify({ congregation: "ABC", role: "conductor" });

    expect(mockIdentify).toHaveBeenCalledWith({
      congregation: "ABC",
      role: "conductor"
    });
  });
});

describe("trackPageview", () => {
  it("overrides url and title while keeping tracker defaults", async () => {
    withUmami();
    const { trackPageview } = await import("./analytics");

    trackPageview("/admin", "Admin");

    const payload = mockTrack.mock.calls[0][0] as (
      props: Record<string, unknown>
    ) => Record<string, unknown>;
    expect(
      payload({ website: "site-123", url: "/", title: "Ignored" })
    ).toEqual({ website: "site-123", url: "/admin", title: "Admin" });
  });

  it("leaves the title untouched when none is given", async () => {
    withUmami();
    const { trackPageview } = await import("./analytics");

    trackPageview("/map/abc");

    const payload = mockTrack.mock.calls[0][0] as (
      props: Record<string, unknown>
    ) => Record<string, unknown>;
    expect(payload({ url: "/", title: "Real title" })).toEqual({
      url: "/map/abc",
      title: "Real title"
    });
  });
});
