import { getList } from "../pocketbase";
import { PB_FIELDS } from "../constants";

interface MemberMap {
  link: string;
  map: string;
  name: string | Record<string, string>;
}

export interface CongregationMember {
  id: string;
  name: string;
  // Tells apart members who share a name. Empty when the account hides it.
  email: string;
  role: string;
  maps: MemberMap[];
  // Names of the groups they are in, for narrowing the picker.
  groups: string[];
}

export interface CongregationGroup {
  id: string;
  name: string;
  // User ids.
  members: string[];
}

// Group 2 before Group 10.
export const byName = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true });

export const getCongregationGroups = async (
  congregation: string,
  requestKey = `groups-${congregation}`
): Promise<CongregationGroup[]> =>
  (
    await getList("groups", {
      filter: `congregation="${congregation}"`,
      fields: PB_FIELDS.GROUPS,
      requestKey
    })
  )
    .map(({ id, name, members }) => ({ id, name, members }))
    .sort((a, b) => byName(a.name, b.name));

// Each person on each link, as "person:link": someone added to a link that
// already existed is new too.
const holding = (memberId: string, link: string) => `${memberId}:${link}`;
export const heldLinks = (members: CongregationMember[]) =>
  new Set(
    members.flatMap((member) =>
      member.maps.map((held) => holding(member.id, held.link))
    )
  );

// The maps each chosen member holds in `fresh` that `seen` did not have them
// on, for those holding any: what they were given since `seen` was read. No
// clocks, so a phone with the wrong time gets the same answer.
export const newlyHeld = (
  chosen: CongregationMember[],
  fresh: CongregationMember[],
  seen: Set<string>
) =>
  chosen.flatMap((member) => {
    const now = fresh.find((other) => other.id === member.id);
    const added = (now?.maps ?? []).filter(
      (held) => !seen.has(holding(member.id, held.link))
    );
    return added.length > 0
      ? [{ id: member.id, name: member.name, maps: added }]
      : [];
  });

// The names a link carries when it is called after its members.
export const namesOf = (members: Array<{ name: string }>) =>
  members.map((member) => member.name).join(", ");

const sameName = (a: string, b: string) =>
  a.trim().replace(/\s+/g, " ").toLowerCase() ===
  b.trim().replace(/\s+/g, " ").toLowerCase();

// The typed names with those of the link's members left out: someone picked
// from the list and typed in as well is on the link once, as a member.
export const namesBesides = (typed: string, members: Array<{ name: string }>) =>
  typed
    .split(",")
    .map((name) => name.trim())
    .filter(
      (name) => name && !members.some((member) => sameName(member.name, name))
    );

// Accounts that cannot sign in are left out; the backend refuses them too.
// `linksLoaded` says whether who holds which map came through: the roster
// still loads without it, with nobody holding anything. A `keySuffix` keeps a
// second load in the same screen from cancelling the first.
export const loadCongregationMembers = async (
  congregation: string,
  keySuffix = ""
): Promise<{ members: CongregationMember[]; linksLoaded: boolean }> => {
  const [records, links, groups] = await Promise.all([
    getList("roles", {
      filter: `congregation="${congregation}"`,
      expand: "user",
      fields: PB_FIELDS.CONGREGATION_MEMBERS,
      requestKey: `members-${congregation}${keySuffix}`
    }),
    getList("assignments", {
      filter: `congregation="${congregation}" && expiry_date > @now`,
      expand: "map",
      fields: PB_FIELDS.MEMBER_LINKS,
      requestKey: `member-links-${congregation}${keySuffix}`
    }).catch(() => null),
    getCongregationGroups(
      congregation,
      `member-groups-${congregation}${keySuffix}`
    ).catch(() => [])
  ]);

  const held = new Map<string, MemberMap[]>();
  for (const link of links ?? []) {
    for (const id of (link.assignees as string[]) ?? []) {
      held.set(id, [
        ...(held.get(id) ?? []),
        {
          link: link.id,
          map: link.map,
          name: link.expand?.map?.description ?? ""
        }
      ]);
    }
  }

  const members = records
    .flatMap((record) => {
      const user = record.expand?.user;
      return user?.name && !user.disabled && user.verified
        ? [
            {
              id: record.user as string,
              name: user.name as string,
              email: (user.email as string) ?? "",
              role: record.role as string,
              maps: held.get(record.user) ?? [],
              groups: groups
                .filter((group) => group.members.includes(record.user))
                .map((group) => group.name)
            }
          ]
        : [];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return { members, linksLoaded: links !== null };
};

const getCongregationMembers = async (congregation: string) =>
  (await loadCongregationMembers(congregation)).members;

export default getCongregationMembers;
