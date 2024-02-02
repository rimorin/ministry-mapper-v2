import { collection, where, query } from "firebase/firestore";
import { firestore } from "../../firebase";
import {
  MUTABLE_CODES,
  STATUS_CODES,
  NOT_HOME_STATUS_CODES,
  MULTI_BATCH_ACTIONS
} from "../constants";
import MultiBatchHandler from "./multibatchupdate";

const ResetAddresses = async (territoryId: string, congregation: string) => {
  await MultiBatchHandler(
    query(
      collection(firestore, `congregations/${congregation}/addresses`),
      where("territory", "==", territoryId),
      where("status", "in", MUTABLE_CODES)
    ),
    MULTI_BATCH_ACTIONS.UPDATE,
    {
      status: STATUS_CODES.DEFAULT,
      nhcount: NOT_HOME_STATUS_CODES.DEFAULT
    }
  );
};

export default ResetAddresses;
