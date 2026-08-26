import { useEffect } from "react";
import { identify } from "../utils/analytics";

interface CongregationIdentity {
  code: string;
  access: string;
}

/**
 * Attaches the active congregation and role to the Umami session so every
 * event and pageview can be segmented without threading data through each
 * call site. Mirrors useLaunchDarklyContext, but carries no name or email —
 * Umami stays free of personal data.
 */
const useAnalyticsIdentity = (
  accesses: CongregationIdentity[],
  activeCongregationCode: string
) => {
  useEffect(() => {
    const active = accesses.find(
      (access) => access.code === activeCongregationCode
    );
    if (!active) return;
    identify({ congregation: active.code, role: active.access });
  }, [accesses, activeCongregationCode]);
};

export default useAnalyticsIdentity;
