import { collection, where, query, QueryConstraint } from "firebase/firestore";
import { firestore } from "../../firebase";
import {
  MUTABLE_CODES,
  STATUS_CODES,
  NOT_HOME_STATUS_CODES,
  MULTI_BATCH_ACTIONS
} from "../constants";
import MultiBatchHandler from "./multibatchupdate";

const ResetAddresses = async (
  congregation: string,
  mapId: string,
  territoryId = ""
) => {
  const filter = [where("status", "in", MUTABLE_CODES)] as QueryConstraint[];

  if (territoryId) {
    filter.push(where("territory", "==", territoryId));
  } else {
    filter.push(where("map", "==", mapId));
  }
  await MultiBatchHandler(
    query(
      collection(firestore, `congregations/${congregation}/addresses`),
      ...filter
    ),
    MULTI_BATCH_ACTIONS.UPDATE,
    {
      status: STATUS_CODES.DEFAULT,
      nhcount: NOT_HOME_STATUS_CODES.DEFAULT
    }
  );
};

export default ResetAddresses;
