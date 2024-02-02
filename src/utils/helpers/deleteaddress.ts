import { collection, deleteDoc, doc, query, where } from "firebase/firestore";
import { firestore } from "../../firebase";
import MultiBatchHandler from "./multibatchupdate";
import { MULTI_BATCH_ACTIONS } from "../constants";

const deleteTerritoryAddress = async (congregation: string, mapId: string) => {
  deleteDoc(doc(firestore, `congregations/${congregation}/maps/${mapId}`));

  await MultiBatchHandler(
    query(
      collection(firestore, `congregations/${congregation}/addresses`),
      where("map", "==", mapId)
    ),
    MULTI_BATCH_ACTIONS.DELETE
  );

  await MultiBatchHandler(
    query(collection(firestore, "links"), where("map", "==", mapId)),
    MULTI_BATCH_ACTIONS.DELETE
  );
};

export default deleteTerritoryAddress;
