import { getList } from "../pocketbase";
import { PB_FIELDS } from "../constants";

export interface CongregationMember {
  id: string;
  name: string;
  // Tells apart members who share a name. Empty when the account hides it.
  email: string;
  // Unexpired links this member holds, so a conductor can see who is free.
  openLinks: number;
}

// The names a link carries when it is called after its members.
export const namesOf = (members: Array<{ name: string }>) =>
  members.map((member) => member.name).join(", ");

// Everyone with a role in the congregation, publishers included, by name: the
// accounts a link can be given to.
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
    // The counts are a hint: the roster is still worth showing without them.
    getList("assignments", {
      filter: `congregation="${congregation}" && expiry_date > @now`,
      fields: PB_FIELDS.ASSIGNMENT_HOLDERS,
      requestKey: `member-links-${congregation}`
    }).catch(() => [])
  ]);

  const openLinks = new Map<string, number>();
  for (const link of links) {
    for (const id of (link.assignees as string[]) ?? []) {
      openLinks.set(id, (openLinks.get(id) ?? 0) + 1);
    }
  }

  return records
    .flatMap((record) => {
      const name = record.expand?.user?.name;
      return name
        ? [
            {
              id: record.user,
              name,
              email: record.expand?.user?.email ?? "",
              openLinks: openLinks.get(record.user) ?? 0
            }
          ]
        : [];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

export default getCongregationMembers;
