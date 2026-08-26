import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { Router as WouterRouter } from "wouter";
import { memoryLocation } from "wouter/memory-location";

const mocks = vi.hoisted(() => ({ trackPageview: vi.fn() }));

vi.mock("../utils/analytics", () => ({
  trackPageview: mocks.trackPageview
}));

// The lazy page modules pull in maps, charts and PocketBase. The pageview
// effect runs on mount regardless of whether they resolve, so stub them out.
const stub = (name: string) => ({ default: () => <div>{name}</div> });
vi.mock("./map", () => stub("map"));
vi.mock("./frontpage", () => stub("frontpage"));
vi.mock("./signup", () => stub("signup"));
vi.mock("./forgot", () => stub("forgot"));
vi.mock("./usrmgmt", () => stub("usrmgmt"));
vi.mock("./oauthcallback", () => stub("oauthcallback"));
vi.mock("../components/statics/notfound", () => stub("notfound"));

const Router = (await import("./router")).default;

const renderAt = (path: string) => {
  const { hook } = memoryLocation({ path });
  return render(
    <WouterRouter hook={hook}>
      <Router />
    </WouterRouter>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Router pageviews", () => {
  it("reports the route pattern for a map link, never the token", () => {
    renderAt("/map/super-secret-link-token");

    expect(mocks.trackPageview).toHaveBeenCalledWith("/map/:id");
    const reported = mocks.trackPageview.mock.calls.flat().join(" ");
    expect(reported).not.toContain("super-secret-link-token");
  });

  it("reports static routes as they are", () => {
    renderAt("/signup");

    expect(mocks.trackPageview).toHaveBeenCalledWith("/signup");
  });

  it("does not report the front page, which reports its own screens", () => {
    renderAt("/");

    expect(mocks.trackPageview).not.toHaveBeenCalled();
  });

  it("does not mistake a lookalike path for the map route", () => {
    renderAt("/maps/abc");

    expect(mocks.trackPageview).toHaveBeenCalledWith("/maps/abc");
  });
});
