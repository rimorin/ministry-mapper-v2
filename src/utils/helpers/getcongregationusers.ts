import { pb } from "../pocketbase";
import { userDetails } from "../interface";
import { PB_FIELDS } from "../constants";

const getCongregationUsers = async (
  code: string
): Promise<Map<string, userDetails>> => {
  const records = await pb.collection("roles").getFullList({
    filter: `congregation="${code}"`,
    sort: "-role",
    expand: "user",
    fields: PB_FIELDS.CONGREGATION_ROLES,
    requestKey: `usr-roles-${code}`
  });

  const userListing = new Map<string, userDetails>();
  for (const key of records) {
    const user = key.expand?.user;
    userListing.set(key.id, {
      uid: key.id,
      name: user.name,
      verified: user.verified,
      email: user?.email,
      role: key.role
    });
  }

  return userListing;
};

export default getCongregationUsers;
