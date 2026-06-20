import {
  asyncWithLDProvider,
  type LDContext
} from "launchdarkly-react-client-sdk";
import * as Sentry from "@sentry/react";
import { ACCESS_LEVEL_MAPPING } from "../utils/constants";

export interface CongregationAccess {
  code: string;
  access: string;
  name: string;
}

// Single shared key for all pre-login traffic. Anonymous contexts still count
// toward MAU, so collapsing every visitor into one context keeps the global
// (maintenance) flags billable as ~1 context instead of one-per-device.
const ANONYMOUS_CONTEXT: LDContext = {
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
    // flicker); timeout rejects so a cold-start outage can't hang the app.
    return await asyncWithLDProvider({
      clientSideID,
      context: ANONYMOUS_CONTEXT,
      timeout: 3,
      options: {
        bootstrap: "localStorage",
        privateAttributes: ["email"],
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
 * Builds a multi-context for an authenticated user: a primary `user` context
 * (the billable MAU) carrying role attributes, plus a non-billable
 * `congregation` context for the active congregation to enable group targeting.
 * Custom attributes don't affect context uniqueness, so roles are free to add.
 */
export const buildLaunchDarklyContext = (
  user: { id: string; name?: string; email?: string },
  accesses: CongregationAccess[],
  activeCongregationCode: string
): LDContext => {
  const roles = [...new Set(accesses.map((access) => access.access))];
  const maxAccessLevel = accesses.reduce(
    (max, access) => Math.max(max, ACCESS_LEVEL_MAPPING[access.access] ?? 0),
    0
  );
  const active = accesses.find(
    (access) => access.code === activeCongregationCode
  );

  return {
    kind: "multi",
    user: {
      key: user.id,
      name: user.name,
      email: user.email,
      roles,
      maxAccessLevel
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
