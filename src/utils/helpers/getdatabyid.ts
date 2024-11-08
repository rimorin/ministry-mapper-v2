import { RecordOptions } from "pocketbase";
import { pb } from "../pocketbase";

async function getDataById(
  collectionName: string,
  id: string,
  options?: RecordOptions
) {
  try {
    return await pb.collection(collectionName).getOne(id, options);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error; // rethrow other errors
  }
}

export default getDataById;
