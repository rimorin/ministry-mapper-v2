import { useFlags } from "launchdarkly-react-client-sdk";

/**
 * Whether the publisher role is switched on for the active congregation: the
 * role itself, giving links to members, and "My maps" for staff. Without the
 * LaunchDarkly provider useFlags() returns {} and it stays off. An account
 * that already holds the role or a link keeps what it has either way.
 */
export default function usePublisherRoleEnabled() {
  const { enablePublisherRole } = useFlags();
  return enablePublisherRole === true;
}
