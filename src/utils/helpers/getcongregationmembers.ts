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
}

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
    )
    .join(", ");

// Accounts that cannot sign in are left out; the backend refuses them too.
const getCongregationMembers = async (
  congregation: string
): Promise<CongregationMember[]> => {
  const [records, links] = await Promise.all([
    getList("roles", {
      filter: `congregation="${congregation}"`,
      expand: "user",
      fields: PB_FIELDS.CONGREGATION_MEMBERS,
      requestKey: `members-${congregation}`
    }),
    // A hint only: the roster still shows without it.
    getList("assignments", {
      filter: `congregation="${congregation}" && expiry_date > @now`,
      expand: "map",
      fields: PB_FIELDS.MEMBER_LINKS,
      requestKey: `member-links-${congregation}`
    }).catch(() => [])
  ]);

  const held = new Map<string, MemberMap[]>();
  for (const link of links) {
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

  return records
    .flatMap((record) => {
      const user = record.expand?.user;
      return user?.name && !user.disabled && user.verified
        ? [
            {
              id: record.user as string,
              name: user.name as string,
              email: (user.email as string) ?? "",
              role: record.role as string,
              maps: held.get(record.user) ?? []
            }
          ]
        : [];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

export default getCongregationMembers;
