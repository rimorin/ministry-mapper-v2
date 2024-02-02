import {
  DocumentData,
  Query,
  WriteBatch,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { firestore } from "../../firebase";
import { FIRESTORE_MAX_BATCH_SIZE, MULTI_BATCH_ACTIONS } from "../constants";

/**
 * Executes batch operations on Firestore documents in multiple batches.
 * @param query - The query to retrieve the documents.
 * @param action - The action to perform on the documents ("delete" or "update").
 * @param update - The update object to be applied to the documents (only applicable for "update" action).
 */
const MultiBatchHandler = async (
  query: Query<DocumentData>,
  action: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data = {} as any
) => {
  const batchArray = new Array<WriteBatch>();
  batchArray.push(writeBatch(firestore));
  let operationCounter = 0;
  let batchIndex = 0;

  const documentReferences = await getDocs(query);

  documentReferences.forEach((doc) => {
    if (action === MULTI_BATCH_ACTIONS.DELETE) {
      batchArray[batchIndex].delete(doc.ref);
    }
    if (action === MULTI_BATCH_ACTIONS.UPDATE) {
      batchArray[batchIndex].update(doc.ref, data);
    }

    operationCounter++;

    if (operationCounter === FIRESTORE_MAX_BATCH_SIZE - 1) {
      batchArray.push(writeBatch(firestore));
      batchIndex++;
      operationCounter = 0;
    }
  });

  const commitPromises = batchArray.map((batch) => batch.commit());
  await Promise.all(commitPromises);
};

export default MultiBatchHandler;
