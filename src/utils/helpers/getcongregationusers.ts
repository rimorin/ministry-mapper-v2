import { getList } from "../pocketbase";
import { userDetails } from "../interface";
import { PB_FIELDS } from "../constants";

const getCongregationUsers = async (
  code: string,
  currentUserId: string
): Promise<Map<string, userDetails>> => {
  const records = await getList("roles", {
    filter: `congregation="${code}" && user != "${currentUserId}"`,
    sort: "-role",
    expand: "user",
    fields: PB_FIELDS.CONGREGATION_ROLES,
    requestKey: `usr-roles-${code}`
  });

  const userListing = new Map<string, userDetails>();
  for (const key of records) {
    const user = key.expand?.user;
    userListing.set(key.id, {
      name: user.name,
      verified: user.verified,
      email: user?.email,
      role: key.role,
      roleId: key.id
    });
  }

  return userListing;
};

export default getCongregationUsers;
