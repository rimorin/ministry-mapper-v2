import { useEffect } from "react";
import { useLDClient } from "launchdarkly-react-client-sdk";
import { getUser } from "../utils/pocketbase";
import {
  buildLaunchDarklyContext,
  type CongregationAccess
} from "../lib/launchdarkly";

/**
 * Identifies the logged-in user to LaunchDarkly as a multi-context (user +
 * active congregation) so flags can target by role, access level, or
 * congregation. Re-runs when the active congregation changes; no-op when LD is
 * disabled or the user/roles aren't ready yet.
 */
const useLaunchDarklyContext = (
  accesses: CongregationAccess[],
  activeCongregationCode: string
) => {
  const ldClient = useLDClient();

  useEffect(() => {
    if (!ldClient || accesses.length === 0) return;
    const user = getUser();
    if (!user || typeof user === "string") return;
    ldClient.identify(
      buildLaunchDarklyContext(user, accesses, activeCongregationCode)
    );
  }, [ldClient, accesses, activeCongregationCode]);
};

export default useLaunchDarklyContext;
