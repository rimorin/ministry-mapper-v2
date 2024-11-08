import { RecordListOptions } from "pocketbase";
import { pb } from "../pocketbase";

async function getFirstItemOfList(
  collectionName: string,
  query: string,
  options?: RecordListOptions
) {
  try {
    const item = await pb
      .collection(collectionName)
      .getFirstListItem(query, options);
    return item;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error; // rethrow other errors
  }
}

export default getFirstItemOfList;
