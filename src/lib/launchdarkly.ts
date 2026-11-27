import {
  asyncWithLDProvider,
  type LDContext
} from "launchdarkly-react-client-sdk";
import * as Sentry from "@sentry/react";
import { ACCESS_LEVEL_MAPPING, STAFF_ROLES } from "../utils/constants";

export interface CongregationAccess {
  code: string;
  access: string;
  name: string;
}

// One shared key for all signed-out traffic, share-link visitors included.
// LaunchDarkly advises a key per device, but each would be a billable MAU, and
// signed-out pages only read global flags.
export const ANONYMOUS_CONTEXT: LDContext = {
  kind: "user",
  key: "anonymous",
  anonymous: true
};

// Resolves to a provider component wrapping the app, or null when flags are
// disabled or unavailable (no client ID, init failure, or 3s timeout). Callers
// render without the provider in that case; useFlags() then yields {}.
export const initLaunchDarkly = async () => {
  const clientSideID = import.meta.env.VITE_LAUNCHDARKLY_CLIENT_ID;
  if (!clientSideID) return null;

  try {
    // bootstrap from localStorage so repeat loads resolve synchronously (no
    // flicker). On timeout asyncWithLDProvider does NOT reject — it resolves
    // with a working provider and hydrates flags via the client's `ready`
    // event, so a short timeout only bounds how long the loader shows on a
    // cold cache; flags still arrive reactively afterwards.
    return await asyncWithLDProvider({
      clientSideID,
      context: ANONYMOUS_CONTEXT,
      timeout: 1.5,
      options: {
        bootstrap: "localStorage",
        privateAttributes: ["email", "name"],
        application: {
          id: "ministry-mapper",
          version: import.meta.env.VITE_APP_VERSION
        }
      }
    });
  } catch (error) {
    // Fail open: render without flags. Surface the failure so a misconfigured
    // client ID or blocked connection is visible rather than silent.
    if (import.meta.env.MODE === "development") {
      console.warn("LaunchDarkly initialization failed:", error);
    }
    if (import.meta.env.VITE_SYSTEM_ENVIRONMENT === "production") {
      Sentry.captureException(error);
    }
    return null;
  }
};

/**
 * A signed-in account's multi-context: the `user` (the billable MAU) with its
 * roles, congregations and groups, plus the `congregation` open in the staff
 * shell. Attributes don't add MAU.
 */
export const buildLaunchDarklyContext = (
  user: { id: string; name?: string; email?: string },
  memberships: CongregationAccess[],
  activeCongregationCode: string,
  groups: string[] = []
): LDContext => {
  const roles = [...new Set(memberships.map((access) => access.access))];
  // Staff roles only: a publisher ranks with a conductor in the mapping, which
  // would let "level 2 and up" rules reach publishers.
  const maxAccessLevel = memberships
    .filter((access) => STAFF_ROLES.includes(access.access))
    .reduce(
      (max, access) => Math.max(max, ACCESS_LEVEL_MAPPING[access.access] ?? 0),
      0
    );
  const active = memberships.find(
    (access) =>
      access.code === activeCongregationCode &&
      STAFF_ROLES.includes(access.access)
  );

  return {
    kind: "multi",
    user: {
      key: user.id,
      name: user.name,
      email: user.email,
      roles,
      maxAccessLevel,
      congregations: [...new Set(memberships.map((access) => access.code))],
      groups
    },
    ...(active && {
      congregation: {
        key: active.code,
        name: active.name,
        activeRole: active.access
      }
    })
  };
};
