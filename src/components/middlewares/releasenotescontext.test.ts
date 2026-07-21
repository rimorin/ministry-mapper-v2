import { describe, it, expect } from "vitest";
import { isPublisherRoute } from "./releasenotescontext";

describe("isPublisherRoute", () => {
  it("treats map links as the publisher audience", () => {
    expect(isPublisherRoute("/map/abc123")).toBe(true);
  });

  it.each(["/", "/signup", "/forgot", "/usermgmt", "/something-else"])(
    "treats %s as the admin audience",
    (path) => {
      expect(isPublisherRoute(path)).toBe(false);
    }
  );
});
