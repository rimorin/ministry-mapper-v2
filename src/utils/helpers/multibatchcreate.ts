import {
  CollectionReference,
  DocumentData,
  WriteBatch,
  doc,
  writeBatch
} from "firebase/firestore";
import { firestore } from "../../firebase";
import { FIRESTORE_MAX_BATCH_SIZE } from "../constants";

/**
 * Executes batch operations on Firestore documents in multiple batches.
 * @param query - The query to retrieve the documents.
 * @param action - The action to perform on the documents ("delete" or "update").
 * @param update - The update object to be applied to the documents (only applicable for "update" action).
 */
const MultiBatchSetter = async (
  collectionReference: CollectionReference<DocumentData>,
  data = [] as object[]
) => {
  const batchArray = new Array<WriteBatch>();
  batchArray.push(writeBatch(firestore));
  let operationCounter = 0;
  let batchIndex = 0;

  data.forEach((details) => {
    batchArray[batchIndex].set(doc(collectionReference), details);

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

export default MultiBatchSetter;
