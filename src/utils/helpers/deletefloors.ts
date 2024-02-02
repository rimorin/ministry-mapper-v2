import { collection, where, query } from "firebase/firestore";
import { firestore } from "../../firebase";
import MultiBatchHandler from "./multibatchupdate";
import { MULTI_BATCH_ACTIONS } from "../constants";
const deleteBlockFloor = async (
  congregation: string,
  mapId: string,
  floor: number
) => {
  await MultiBatchHandler(
    query(
      collection(firestore, `congregations/${congregation}/addresses`),
      where("floor", "==", floor),
      where("map", "==", mapId)
    ),
    MULTI_BATCH_ACTIONS.DELETE
  );
};

export default deleteBlockFloor;
