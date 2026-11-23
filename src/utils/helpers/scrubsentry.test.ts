import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/react";
import { scrubBreadcrumb, scrubEvent, scrubUrl } from "./scrubsentry";

const LINK = "abc123def456ghi";

describe("scrubUrl", () => {
  it("replaces a share link id in the map address", () => {
    expect(scrubUrl(`https://app.example.test/map/${LINK}`)).toBe(
      "https://app.example.test/map/:id"
    );
  });

  it("replaces a share link id in its record's path", () => {
    expect(
      scrubUrl(`/api/collections/assignments/records/${LINK}?fields=id`)
    ).toBe("/api/collections/assignments/records/:id");
  });

  it("drops the query and fragment", () => {
    expect(scrubUrl("/auth/callback?code=secret&state=s&name=Someone")).toBe(
      "/auth/callback"
    );
    expect(scrubUrl("/usermgmt#mode=reset")).toBe("/usermgmt");
  });

  it("leaves other paths as they are", () => {
    expect(scrubUrl("/map/add")).toBe("/map/add");
    expect(scrubUrl("/api/collections/maps/records/abc123def456ghi")).toBe(
      "/api/collections/maps/records/abc123def456ghi"
    );
  });
});

describe("scrubBreadcrumb", () => {
  it("scrubs a navigation's from and to", () => {
    const crumb = scrubBreadcrumb({
      category: "navigation",
      data: { from: "/", to: `/map/${LINK}` }
    });
    expect(crumb.data).toEqual({ from: "/", to: "/map/:id" });
  });

  it("scrubs a request's url and keeps the rest", () => {
    const crumb = scrubBreadcrumb({
      category: "fetch",
      data: {
        url: `https://be.example.test/api/collections/addresses/records?filter=x`,
        method: "GET",
        status_code: 200
      }
    });
    expect(crumb.data).toEqual({
      url: "https://be.example.test/api/collections/addresses/records",
      method: "GET",
      status_code: 200
    });
  });

  it("passes a breadcrumb without data through", () => {
    expect(scrubBreadcrumb({ category: "ui.click" })).toEqual({
      category: "ui.click"
    });
  });
});

describe("scrubEvent", () => {
  it("scrubs the page address, its query and the referer", () => {
    const event = scrubEvent({
      type: undefined,
      request: {
        url: `https://app.example.test/map/${LINK}?x=1`,
        query_string: "x=1",
        headers: {
          Referer: `https://app.example.test/map/${LINK}`,
          "User-Agent": "test"
        }
      }
    } as ErrorEvent);
    expect(event.request).toEqual({
      url: "https://app.example.test/map/:id",
      headers: {
        Referer: "https://app.example.test/map/:id",
        "User-Agent": "test"
      }
    });
  });
});
