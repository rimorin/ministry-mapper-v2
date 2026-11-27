import { useEffect } from "react";
import { useLDClient } from "launchdarkly-react-client-sdk";
import { getUser } from "../utils/pocketbase";
import { STAFF_ROLES } from "../utils/constants";
import { getCongregationGroups } from "../utils/helpers/getcongregationmembers";
import {
  buildLaunchDarklyContext,
  type CongregationAccess
} from "../lib/launchdarkly";

/**
 * Identifies the signed-in account to LaunchDarkly, so flags can target by
 * role, congregation or group. Staff wait for their groups in the open
 * congregation; a publisher-only account uses the groups from its links.
 */
const useLaunchDarklyContext = (
  memberships: CongregationAccess[],
  activeCongregationCode: string,
  publisherGroups: string[]
) => {
  const ldClient = useLDClient();

  useEffect(() => {
    if (!ldClient || memberships.length === 0) return;
    const user = getUser();
    if (!user || typeof user === "string") return;
    const identify = (groups: string[]) =>
      ldClient.identify(
        buildLaunchDarklyContext(
          user,
          memberships,
          activeCongregationCode,
          groups
        )
      );

    const isStaffHere = memberships.some(
      (access) =>
        access.code === activeCongregationCode &&
        STAFF_ROLES.includes(access.access)
    );
    if (!isStaffHere) {
      identify(publisherGroups);
      return;
    }
    let current = true;
    getCongregationGroups(
      activeCongregationCode,
      `ld-groups-${activeCongregationCode}`
    )
      .then((groups) =>
        groups
          .filter((group) => group.members.includes(user.id))
          .map((group) => group.name)
      )
      .catch(() => [])
      .then((names) => {
        if (current) identify(names);
      });
    return () => {
      current = false;
    };
  }, [ldClient, memberships, activeCongregationCode, publisherGroups]);
};

export default useLaunchDarklyContext;
