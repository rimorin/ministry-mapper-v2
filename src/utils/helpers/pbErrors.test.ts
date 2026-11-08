import { describe, it, expect } from "vitest";
import type { TFunction } from "i18next";
import { mapPbAuthError } from "./pbErrors";

const t = ((_key: string, fallback: string) =>
  fallback) as unknown as TFunction;

const forbidden = (message: string) => ({
  status: 403,
  response: { message }
});

describe("mapPbAuthError", () => {
  it("tells a disabled account why it cannot sign in", () => {
    expect(
      mapPbAuthError(
        forbidden(
          "The request doesn't satisfy the collection requirements to authenticate."
        ),
        t
      )
    ).toBe(
      "This account has been disabled. Ask an administrator of your congregation to turn it back on."
    );
  });

  it("keeps the specific and generic 403 messages", () => {
    expect(
      mapPbAuthError(
        forbidden(
          "The collection is not configured to allow password authentication."
        ),
        t
      )
    ).toBe("Password sign-in is not enabled for this account.");
    expect(mapPbAuthError(forbidden("Something else."), t)).toBe(
      "Access denied. You are not allowed to perform this action."
    );
  });
});
